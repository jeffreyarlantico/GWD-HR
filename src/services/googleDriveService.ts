import { getDriveAccessToken } from './googleDriveAuth';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  description?: string;
  owners?: Array<{
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  }>;
}

export interface DriveListResponse {
  files: DriveFileItem[];
  nextPageToken?: string;
}

export const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const DISTRICT_ROOT_FOLDER_NAME = 'Guimba West District HRIS';
const DISTRICT_DEFAULT_SUBFOLDERS = [
  '201 Personnel Records & Appointments',
  'Special Orders & Service Credits',
  'Leave Applications & Records',
  'District Reports & Backups',
  'School Documents'
];

// Helper to make authenticated Google Drive API calls
async function callDriveApi(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected. Please sign in with your Google account.');
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errJson = await res.json();
      errorDetail = errJson.error?.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(`Google Drive API Error (${res.status}): ${errorDetail}`);
  }

  return res;
}

// List files and folders with flexible query
export async function listDriveFiles(params: {
  folderId?: string;
  searchQuery?: string;
  mimeTypeFilter?: 'all' | 'folders' | 'documents' | 'spreadsheets' | 'images' | 'pdfs';
  pageSize?: number;
  pageToken?: string;
  orderBy?: string;
}): Promise<DriveListResponse> {
  const {
    folderId = 'root',
    searchQuery = '',
    mimeTypeFilter = 'all',
    pageSize = 30,
    pageToken,
    orderBy = 'folder,modifiedTime desc,name'
  } = params;

  const queryParts: string[] = ['trashed = false'];

  if (folderId) {
    queryParts.push(`'${folderId}' in parents`);
  }

  if (searchQuery.trim()) {
    const escaped = searchQuery.replace(/'/g, "\\'");
    queryParts.push(`(name contains '${escaped}' or fullText contains '${escaped}')`);
  }

  if (mimeTypeFilter === 'folders') {
    queryParts.push(`mimeType = '${FOLDER_MIME_TYPE}'`);
  } else if (mimeTypeFilter === 'pdfs') {
    queryParts.push(`mimeType = 'application/pdf'`);
  } else if (mimeTypeFilter === 'spreadsheets') {
    queryParts.push(`(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType = 'text/csv')`);
  } else if (mimeTypeFilter === 'documents') {
    queryParts.push(`(mimeType = 'application/vnd.google-apps.document' or mimeType = 'application/pdf' or mimeType = 'application/msword' or mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')`);
  } else if (mimeTypeFilter === 'images') {
    queryParts.push(`mimeType contains 'image/'`);
  }

  const q = queryParts.join(' and ');
  const urlParams = new URLSearchParams({
    q,
    pageSize: String(pageSize),
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners, description)',
    orderBy,
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });

  if (pageToken) {
    urlParams.set('pageToken', pageToken);
  }

  const response = await callDriveApi(`files?${urlParams.toString()}`);
  return await response.json();
}

// Get file metadata
export async function getDriveFileMetadata(fileId: string): Promise<DriveFileItem> {
  const response = await callDriveApi(`files/${fileId}?fields=id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,iconLink,thumbnailLink,parents,owners,description&supportsAllDrives=true`);
  return await response.json();
}

// Create a new folder
export async function createDriveFolder(folderName: string, parentFolderId?: string): Promise<DriveFileItem> {
  const metadata: Record<string, any> = {
    name: folderName.trim(),
    mimeType: FOLDER_MIME_TYPE,
  };

  if (parentFolderId && parentFolderId !== 'root') {
    metadata.parents = [parentFolderId];
  }

  const response = await callDriveApi('files?supportsAllDrives=true', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(metadata),
  });

  return await response.json();
}

// Upload a binary or text file to Google Drive using multipart upload
export async function uploadFileToGoogleDrive(params: {
  name: string;
  file: Blob | File;
  mimeType?: string;
  parentFolderId?: string;
  description?: string;
}): Promise<DriveFileItem> {
  const token = getDriveAccessToken();
  if (!token) {
    throw new Error('Google Drive is not connected.');
  }

  const { name, file, mimeType = file.type || 'application/octet-stream', parentFolderId, description } = params;

  const metadata: Record<string, any> = {
    name: name.trim(),
    description: description || 'Uploaded via Guimba West District HRIS',
  };

  if (parentFolderId && parentFolderId !== 'root') {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataContentType = 'application/json; charset=UTF-8';
  const fileArrayBuffer = await file.arrayBuffer();

  const preBody = `${delimiter}Content-Type: ${metadataContentType}\r\n\r\n${JSON.stringify(metadata)}${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`;
  const postBody = closeDelimiter;

  const preBuffer = new TextEncoder().encode(preBody);
  const postBuffer = new TextEncoder().encode(postBody);

  const totalLength = preBuffer.byteLength + fileArrayBuffer.byteLength + postBuffer.byteLength;
  const combinedBuffer = new Uint8Array(totalLength);

  combinedBuffer.set(preBuffer, 0);
  combinedBuffer.set(new Uint8Array(fileArrayBuffer), preBuffer.byteLength);
  combinedBuffer.set(postBuffer, preBuffer.byteLength + fileArrayBuffer.byteLength);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: combinedBuffer,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Upload to Google Drive failed: ${errorText}`);
  }

  return await res.json();
}

// Upload base64 data URL to Google Drive
export async function uploadDataUrlToDrive(
  dataUrl: string, 
  fileName: string, 
  parentFolderId?: string,
  description?: string
): Promise<DriveFileItem> {
  const mimeTypeMatch = dataUrl.match(/^data:([^;]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'application/octet-stream';
  
  const byteString = atob(dataUrl.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ia], { type: mimeType });

  return await uploadFileToGoogleDrive({
    name: fileName,
    file: blob,
    mimeType,
    parentFolderId,
    description,
  });
}

// Delete file from Google Drive (Mandatory user confirmation required in UI before calling this)
export async function deleteDriveFile(fileId: string): Promise<boolean> {
  await callDriveApi(`files/${fileId}?supportsAllDrives=true`, {
    method: 'DELETE',
  });
  return true;
}

// Locate or initialize standard Guimba West District Folders in user's Drive
export async function ensureDistrictFoldersStructure(): Promise<{
  rootFolder: DriveFileItem;
  subfolders: Record<string, DriveFileItem>;
}> {
  // Check if root district folder exists
  const existingRootRes = await listDriveFiles({
    folderId: 'root',
    searchQuery: DISTRICT_ROOT_FOLDER_NAME,
    mimeTypeFilter: 'folders',
  });

  let rootFolder = existingRootRes.files.find(f => f.name === DISTRICT_ROOT_FOLDER_NAME);

  if (!rootFolder) {
    rootFolder = await createDriveFolder(DISTRICT_ROOT_FOLDER_NAME, 'root');
  }

  // Check subfolders
  const subfoldersRes = await listDriveFiles({
    folderId: rootFolder.id,
    mimeTypeFilter: 'folders',
  });

  const subfoldersMap: Record<string, DriveFileItem> = {};

  for (const expectedName of DISTRICT_DEFAULT_SUBFOLDERS) {
    let sub = subfoldersRes.files.find(f => f.name === expectedName);
    if (!sub) {
      sub = await createDriveFolder(expectedName, rootFolder.id);
    }
    subfoldersMap[expectedName] = sub;
  }

  return {
    rootFolder,
    subfolders: subfoldersMap,
  };
}

// Export District Data (JSON or CSV) directly to District Reports folder in Drive
export async function exportDistrictDataToDrive(
  dataContent: string,
  fileName: string,
  mimeType: 'text/csv' | 'application/json' | 'text/plain',
  targetFolderId?: string
): Promise<DriveFileItem> {
  let folderId = targetFolderId;
  
  if (!folderId) {
    try {
      const structure = await ensureDistrictFoldersStructure();
      folderId = structure.subfolders['District Reports & Backups']?.id || structure.rootFolder.id;
    } catch {
      folderId = 'root';
    }
  }

  const blob = new Blob([dataContent], { type: mimeType });
  return await uploadFileToGoogleDrive({
    name: fileName,
    file: blob,
    mimeType,
    parentFolderId: folderId,
    description: `Exported from Guimba West District HRIS on ${new Date().toLocaleString()}`,
  });
}
