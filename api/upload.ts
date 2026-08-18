import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import { google } from 'googleapis';
import formidable from 'formidable';

// Disable default body parser so formidable can process multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

const STRICT_MAX_FILE_SIZE = 1048576; // Strictly 1 MB limit (1,048,576 bytes)
const DEFAULT_FOLDER_ID = '1oHwkVipP50ixdFSTFDHScld7VZtv9eHb';

function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

/**
 * Sanitizes and cleans the Google Private Key string.
 * Handles escaped newlines, wrapping quotation marks, and line endings.
 */
function sanitizePrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  // Strip accidental outer quotes if added in Vercel UI
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // Convert literal '\n' characters into real linebreaks
  key = key.replace(/\\n/g, '\n');
  return key;
}

export default async function handler(
  req: IncomingMessage & { body?: any; query?: any },
  res: ServerResponse
) {
  const requestStartTime = Date.now();
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed. POST is required for file uploads.' }));
    return;
  }

  console.log('[Upload API] Received POST request at', new Date().toISOString());

  // -------------------------------------------------------------
  // STEP 1: Environment Variables Diagnostics
  // -------------------------------------------------------------
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = (process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID).trim();

  console.log('[Upload API Diagnostics] Checking Environment Variables:', {
    hasClientEmail: Boolean(clientEmail),
    clientEmailMasked: clientEmail ? `${clientEmail.slice(0, 4)}...${clientEmail.slice(-10)}` : 'MISSING',
    hasPrivateKey: Boolean(rawPrivateKey),
    privateKeyLength: rawPrivateKey ? rawPrivateKey.length : 0,
    hasFolderId: Boolean(folderId),
    targetFolderId: folderId,
  });

  if (!clientEmail || !rawPrivateKey) {
    const missingVars: string[] = [];
    if (!clientEmail) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!rawPrivateKey) missingVars.push('GOOGLE_PRIVATE_KEY');

    console.error('[Upload API Error] Missing required environment variables:', missingVars);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: `Server Configuration Error: Missing environment variables [${missingVars.join(', ')}]. Please verify these in your Vercel Project Settings under Environment Variables.`,
        code: 'MISSING_ENV_VARS',
        missing: missingVars,
      })
    );
    return;
  }

  const cleanedPrivateKey = sanitizePrivateKey(rawPrivateKey);
  const keyHasHeader = cleanedPrivateKey.includes('-----BEGIN PRIVATE KEY-----');
  const keyHasFooter = cleanedPrivateKey.includes('-----END PRIVATE KEY-----');

  if (!keyHasHeader || !keyHasFooter) {
    console.error('[Upload API Error] Malformed private key format:', { keyHasHeader, keyHasFooter });
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error:
          'Server Configuration Error: GOOGLE_PRIVATE_KEY is missing standard PEM headers ("-----BEGIN PRIVATE KEY-----" / "-----END PRIVATE KEY-----"). Please ensure you copied the entire private_key field from your service account JSON file.',
        code: 'INVALID_PRIVATE_KEY_PEM',
      })
    );
    return;
  }

  // -------------------------------------------------------------
  // STEP 2: Parse Formidable Multipart Data with 1 MB Limit
  // -------------------------------------------------------------
  let parsedFields: formidable.Fields = {};
  let parsedFiles: formidable.Files = {};

  try {
    const form = formidable({
      maxFileSize: STRICT_MAX_FILE_SIZE, // 1 MB limit
      keepExtensions: true,
      allowEmptyFiles: false,
    });

    [parsedFields, parsedFiles] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });
  } catch (formError: any) {
    console.error('[Upload API Error] Formidable parsing failed:', formError);
    const isExceeded =
      formError?.code === 1009 ||
      formError?.httpCode === 413 ||
      formError?.message?.toLowerCase().includes('maxfilesize');

    res.statusCode = isExceeded ? 400 : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: isExceeded
          ? 'File size exceeds the strict 1 MB limit (1,048,576 bytes). Please resize or compress your file.'
          : `Multipart form parse error: ${formError.message}`,
        code: isExceeded ? 'FILE_TOO_LARGE' : 'FORM_PARSE_ERROR',
        details: formError.message,
      })
    );
    return;
  }

  const fileItem = Array.isArray(parsedFiles.file) ? parsedFiles.file[0] : parsedFiles.file;
  if (!fileItem || !fileItem.filepath) {
    console.error('[Upload API Error] No valid file found in request payload');
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'No file received. Ensure form-data contains field "file".',
        code: 'NO_FILE_PROVIDED',
      })
    );
    return;
  }

  console.log('[Upload API] Received File:', {
    name: fileItem.originalFilename,
    sizeBytes: fileItem.size,
    mimeType: fileItem.mimetype,
  });

  if (fileItem.size > STRICT_MAX_FILE_SIZE) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: `File size exceeds the strict 1 MB limit (${fileItem.size} bytes received. Max allowed is 1,048,576 bytes).`,
        code: 'FILE_TOO_LARGE',
        receivedBytes: fileItem.size,
        maxBytes: STRICT_MAX_FILE_SIZE,
      })
    );
    return;
  }

  // -------------------------------------------------------------
  // STEP 3: Authenticate & Upload to Google Drive
  // -------------------------------------------------------------
  try {
    console.log('[Upload API] Initializing Google Drive JWT client...');
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: cleanedPrivateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const customName = Array.isArray(parsedFields.name) ? parsedFields.name[0] : parsedFields.name;
    const finalFileName = customName || fileItem.originalFilename || `upload-${Date.now()}`;
    const mimeType = fileItem.mimetype || 'application/octet-stream';

    console.log('[Upload API] Uploading stream to Google Drive folder:', folderId);
    const fileStream = fs.createReadStream(fileItem.filepath);

    const driveResponse = await drive.files.create({
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

    const fileId = driveResponse.data.id;
    if (!fileId) {
      throw new Error('Google Drive files.create did not return a valid file ID.');
    }

    console.log('[Upload API] File uploaded successfully to Google Drive. File ID:', fileId);

    // -------------------------------------------------------------
    // STEP 4: Set Permission (Anyone with link can view)
    // -------------------------------------------------------------
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
      console.log('[Upload API] Public read permission granted for file:', fileId);
    } catch (permError: any) {
      console.warn('[Upload API Warning] Could not set public permission on file:', permError?.message);
    }

    // -------------------------------------------------------------
    // STEP 5: Retrieve verified viewable link
    // -------------------------------------------------------------
    const fileMeta = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink',
    });

    const viewLink =
      fileMeta.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    const totalDurationMs = Date.now() - requestStartTime;
    console.log(`[Upload API Success] Completed in ${totalDurationMs}ms. ViewLink:`, viewLink);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        viewLink: viewLink,
        webViewLink: viewLink,
        fileId: fileId,
        fileName: fileMeta.data.name || finalFileName,
        folderId: folderId,
        durationMs: totalDurationMs,
      })
    );
  } catch (driveError: any) {
    console.error('[Upload API Error] Google Drive API operation failed:', driveError);

    let friendlyMessage = driveError?.message || 'An error occurred during Google Drive upload.';
    let errorCode = 'GOOGLE_DRIVE_API_ERROR';

    if (driveError?.message?.includes('invalid_grant') || driveError?.message?.includes('Invalid JWT')) {
      friendlyMessage =
        'Authentication Error: Invalid Google Service Account credentials or system clock mismatch. Please double-check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in Vercel.';
      errorCode = 'INVALID_SERVICE_ACCOUNT_CREDENTIALS';
    } else if (driveError?.code === 404 || driveError?.message?.includes('File not found')) {
      friendlyMessage = `Google Drive Folder "${folderId}" not found or not accessible. Make sure the folder exists and is shared with your Service Account email: ${clientEmail}`;
      errorCode = 'FOLDER_NOT_FOUND_OR_UNSHARED';
    } else if (driveError?.code === 403 || driveError?.message?.includes('insufficientFilePermissions')) {
      friendlyMessage = `Permission Denied: Your Google Service Account (${clientEmail}) does not have Editor access to folder "${folderId}". Please share the Google Drive folder with this email as Editor.`;
      errorCode = 'FOLDER_PERMISSION_DENIED';
    }

    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: friendlyMessage,
        code: errorCode,
        details: driveError?.response?.data || driveError?.message,
        targetFolderId: folderId,
        serviceAccountEmail: clientEmail,
      })
    );
  }
}
