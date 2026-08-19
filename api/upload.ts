import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import { google } from 'googleapis';
import formidable from 'formidable';

// CRITICAL: Disable Vercel's default body parser so formidable can process the multipart stream
export const config = {
  api: {
    bodyParser: false,
  },
};

const STRICT_MAX_FILE_SIZE = 1048576; // Strict 1 MB limit (1,048,576 bytes)
const DEFAULT_FOLDER_ID = '1oHwkVipP50ixdFSTFDHScld7VZtv9eHb';

function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

/**
 * Bulletproof private key cleaner:
 * 1. Strips leading/trailing whitespace and surrounding quotation marks.
 * 2. Converts literal escaped '\\n' strings into true linebreaks.
 * 3. Handles carriage returns (\r\n -> \n).
 */
function formatPrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
  }
  return key.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();
  setCorsHeaders(res);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed. Please send a POST request with multipart/form-data.',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    // -------------------------------------------------------------
    // STEP 1: Validate Environment Variables
    // -------------------------------------------------------------
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
    const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
    const folderId = (process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID).trim();

    if (!clientEmail || !rawPrivateKey) {
      const missing = [];
      if (!clientEmail) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
      if (!rawPrivateKey) missing.push('GOOGLE_PRIVATE_KEY');

      return res.status(500).json({
        success: false,
        error: `Missing environment variable(s): ${missing.join(', ')}. Please configure them in your Vercel Project Settings.`,
        code: 'MISSING_ENV_VARIABLES',
        missing,
      });
    }

    const formattedKey = formatPrivateKey(rawPrivateKey);

    // Validate PEM block structure
    if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----') || !formattedKey.includes('-----END PRIVATE KEY-----')) {
      return res.status(500).json({
        success: false,
        error: 'GOOGLE_PRIVATE_KEY is missing standard PEM block headers ("-----BEGIN PRIVATE KEY-----" / "-----END PRIVATE KEY-----"). Please re-copy the entire private_key string from your Service Account JSON file.',
        code: 'MALFORMED_PRIVATE_KEY',
      });
    }

    // -------------------------------------------------------------
    // STEP 2: Parse Multipart Form Data safely with Formidable
    // -------------------------------------------------------------
    let parsedFields: formidable.Fields;
    let parsedFiles: formidable.Files;

    try {
      const form = formidable({
        maxFileSize: STRICT_MAX_FILE_SIZE, // 1 MB strict cutoff
        keepExtensions: true,
        allowEmptyFiles: false,
      });

      const parseResult = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      parsedFields = parseResult.fields;
      parsedFiles = parseResult.files;
    } catch (formError: any) {
      const isSizeLimit =
        formError?.code === 1009 ||
        formError?.httpCode === 413 ||
        formError?.message?.toLowerCase().includes('maxfilesize');

      return res.status(400).json({
        success: false,
        error: isSizeLimit
          ? 'File size exceeds the strict 1 MB limit (1,048,576 bytes). Please resize or compress your file.'
          : `Multipart form parsing error: ${formError?.message || 'Unknown parse error'}`,
        code: isSizeLimit ? 'FILE_TOO_LARGE' : 'FORM_PARSE_ERROR',
        details: formError?.message,
      });
    }

    // Extract file item
    const fileItem = Array.isArray(parsedFiles.file) ? parsedFiles.file[0] : parsedFiles.file;
    if (!fileItem || !fileItem.filepath) {
      return res.status(400).json({
        success: false,
        error: 'No file received in request payload. Ensure form-data contains field "file".',
        code: 'NO_FILE_PROVIDED',
      });
    }

    // Double check size in bytes
    if (fileItem.size > STRICT_MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        error: `File size (${fileItem.size.toLocaleString()} bytes) exceeds the strict 1 MB limit (1,048,576 bytes).`,
        code: 'FILE_TOO_LARGE',
        receivedBytes: fileItem.size,
        maxAllowedBytes: STRICT_MAX_FILE_SIZE,
      });
    }

    // -------------------------------------------------------------
    // STEP 3: Authenticate with Google Drive (Wrapped in Try/Catch)
    // -------------------------------------------------------------
    let drive;
    try {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: formattedKey,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      drive = google.drive({ version: 'v3', auth });
    } catch (authError: any) {
      return res.status(500).json({
        success: false,
        error: `Google Service Account JWT initialization failed: ${authError?.message || 'Invalid credentials'}`,
        code: 'AUTH_INITIALIZATION_ERROR',
        details: authError?.message,
      });
    }

    // -------------------------------------------------------------
    // STEP 4: Upload File to Google Drive Folder
    // -------------------------------------------------------------
    const customName = Array.isArray(parsedFields.name) ? parsedFields.name[0] : parsedFields.name;
    const finalFileName = customName || fileItem.originalFilename || `upload-${Date.now()}`;
    const mimeType = fileItem.mimetype || 'application/octet-stream';
    const fileStream = fs.createReadStream(fileItem.filepath);

    let driveResponse;
    try {
      driveResponse = await drive.files.create({
        requestBody: {
          name: finalFileName,
          parents: [folderId],
          mimeType: mimeType,
        },
        media: {
          mimeType: mimeType,
          body: fileStream,
        },
        fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink',
      });
    } catch (uploadError: any) {
      let friendlyError = uploadError?.message || 'Failed to create file in Google Drive.';
      let errorCode = 'GOOGLE_DRIVE_UPLOAD_FAILED';

      if (uploadError?.message?.includes('invalid_grant') || uploadError?.message?.includes('Invalid JWT')) {
        friendlyError = 'Invalid Service Account private key or email. Verify GOOGLE_PRIVATE_KEY and GOOGLE_SERVICE_ACCOUNT_EMAIL.';
        errorCode = 'INVALID_SERVICE_ACCOUNT_CREDENTIALS';
      } else if (uploadError?.code === 404 || uploadError?.message?.includes('File not found')) {
        friendlyError = `Google Drive folder "${folderId}" not found. Verify the folder ID and ensure it is shared with ${clientEmail}.`;
        errorCode = 'FOLDER_NOT_FOUND';
      } else if (uploadError?.code === 403 || uploadError?.message?.includes('insufficientFilePermissions')) {
        friendlyError = `Permission denied: Service Account (${clientEmail}) is not an Editor on Google Drive folder "${folderId}".`;
        errorCode = 'FOLDER_ACCESS_DENIED';
      }

      return res.status(500).json({
        success: false,
        error: friendlyError,
        code: errorCode,
        details: uploadError?.response?.data || uploadError?.message,
        folderId,
      });
    }

    const fileId = driveResponse.data.id;
    if (!fileId) {
      return res.status(500).json({
        success: false,
        error: 'Google Drive uploaded the file but did not return a valid file ID.',
        code: 'MISSING_FILE_ID',
      });
    }

    // -------------------------------------------------------------
    // STEP 5: Set Public Read Permissions (Safe fallback)
    // -------------------------------------------------------------
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError: any) {
      console.warn('Could not set public permissions on file:', permError?.message);
    }

    // -------------------------------------------------------------
    // STEP 6: Fetch Verified View Link & Return JSON Response
    // -------------------------------------------------------------
    let viewLink = driveResponse.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    try {
      const fileMetadata = await drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, webViewLink, webContentLink',
      });
      if (fileMetadata.data.webViewLink) {
        viewLink = fileMetadata.data.webViewLink;
      }
    } catch (metaError) {
      // Non-blocking, viewLink fallback is already constructed
    }

    const durationMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      viewLink: viewLink,
      webViewLink: viewLink,
      fileId: fileId,
      fileName: driveResponse.data.name || finalFileName,
      folderId: folderId,
      durationMs: durationMs,
    });
  } catch (uncaughtError: any) {
    console.error('Unhandled upload error in /api/upload:', uncaughtError);
    return res.status(500).json({
      success: false,
      error: uncaughtError?.message || 'An unexpected internal server error occurred.',
      code: 'UNHANDLED_EXCEPTION',
      details: uncaughtError?.stack || uncaughtError?.toString(),
    });
  }
}
