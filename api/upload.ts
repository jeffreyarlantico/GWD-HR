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

const STRICT_MAX_FILE_SIZE = 1048576; // Strict 1 MB limit (1,048,576 bytes)
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

export default async function handler(
  req: IncomingMessage & { body?: any; query?: any },
  res: ServerResponse
) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed. POST is required.' }));
    return;
  }

  // 1. Read Environment Variables
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;

  if (!clientEmail || !rawPrivateKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error:
          'Google Service Account credentials missing. Please configure GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in Vercel Environment Variables.',
      })
    );
    return;
  }

  try {
    // 2. Initialize Google Drive API with Service Account credentials
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 3. Parse Multipart Form using formidable
    const form = formidable({
      maxFileSize: STRICT_MAX_FILE_SIZE, // Rejects files larger than 1MB at parser level
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, parsedFields, parsedFiles) => {
        if (err) {
          reject(err);
        } else {
          resolve([parsedFields, parsedFiles]);
        }
      });
    });

    const fileItem = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!fileItem || !fileItem.filepath) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No file provided in form field "file".' }));
      return;
    }

    // Server-side strict file size verification (1 MB limit)
    if (fileItem.size > STRICT_MAX_FILE_SIZE) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: `File size exceeds the strict 1 MB limit (${fileItem.size} bytes received. Max allowed is 1,048,576 bytes).`,
        })
      );
      return;
    }

    const customName = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const finalFileName = customName || fileItem.originalFilename || `upload-${Date.now()}`;
    const mimeType = fileItem.mimetype || 'application/octet-stream';

    // 4. Upload file directly to the Google Drive Folder
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
      throw new Error('Failed to retrieve file ID from Google Drive response.');
    }

    // 5. Grant public read permission (anyone with link can view)
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.warn('Warning: Could not set public permissions on uploaded file:', permError);
    }

    // 6. Retrieve viewable link
    const fileMeta = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink',
    });

    const viewLink =
      fileMeta.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        viewLink: viewLink,
        webViewLink: viewLink,
        fileId: fileId,
        fileName: fileMeta.data.name,
        folderId: folderId,
      })
    );
  } catch (error: any) {
    console.error('Error handling upload in /api/upload:', error);
    
    // Check if error was formidable size limit
    const isSizeError = error?.code === 1009 || error?.message?.toLowerCase().includes('maxfilesize');
    res.statusCode = isSizeError ? 400 : 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: isSizeError 
          ? 'File size exceeds the strict 1 MB limit (1,048,576 bytes).' 
          : (error.message || 'An error occurred during Google Drive upload.'),
      })
    );
  }
}
