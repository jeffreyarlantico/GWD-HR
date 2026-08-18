import type { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import { google } from 'googleapis';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false, // Disables standard body parser so formidable can stream multipart form data
  },
};

// Helper to set CORS headers
function setCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
}

// Fallback folder ID
const DEFAULT_FOLDER_ID = '1oHwkVipP50ixdFSTFDHScld7VZtv9eHb';

export default async function handler(req: IncomingMessage & { body?: any; query?: any }, res: ServerResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed. Only POST requests are supported.' }));
    return;
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;

  if (!clientEmail || !rawKey) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error:
          'Google Service Account credentials are missing. Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in your environment variables.',
      })
    );
    return;
  }

  try {
    // 1. Initialize Google Auth with Service Account
    const privateKey = rawKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 2. Parse Multipart Form with formidable
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB server limit (client enforces 1MB strict)
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fFields, fFiles) => {
        if (err) reject(err);
        else resolve([fFields, fFiles]);
      });
    });

    // Extract file item (formidable returns File | File[])
    const fileItem = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!fileItem || !fileItem.filepath) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No file provided in form data field "file".' }));
      return;
    }

    // Extract custom filename or metadata if provided
    const customName = Array.isArray(fields.name) ? fields.name[0] : fields.name;
    const finalFileName = customName || fileItem.originalFilename || `upload-${Date.now()}`;
    const mimeType = fileItem.mimetype || 'application/octet-stream';

    // 3. Upload File to Google Drive Folder
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
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, size',
    });

    const fileId = driveResponse.data.id;
    if (!fileId) {
      throw new Error('Google Drive API did not return a valid file ID.');
    }

    // 4. Set Public Viewing Permissions (Anyone with link can view)
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permErr) {
      console.warn('Warning: Could not set public permissions on uploaded file:', permErr);
    }

    // 5. Retrieve final viewable webViewLink
    const fileDetails = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, iconLink',
    });

    const webViewLink =
      fileDetails.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        message: 'File successfully uploaded to Google Drive folder.',
        fileId: fileId,
        fileName: fileDetails.data.name,
        webViewLink: webViewLink,
        webContentLink: fileDetails.data.webContentLink,
        thumbnailLink: fileDetails.data.thumbnailLink,
        folderId: folderId,
      })
    );
  } catch (error: any) {
    console.error('Error uploading file to Google Drive:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: error.message || 'An unexpected error occurred while uploading to Google Drive.',
        details: error.toString(),
      })
    );
  }
}
