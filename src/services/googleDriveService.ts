import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Helper to create Google Drive Auth Provider with full required Drive scopes and consent prompt
export const createGoogleDriveProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive');
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  provider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
  provider.setCustomParameters({
    prompt: 'consent select_account',
    access_type: 'offline'
  });
  return provider;
};

// In-memory token storage (DO NOT store in localStorage/sessionStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  iconLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: Array<{ displayName: string; emailAddress: string; photoLink?: string }>;
  parents?: string[];
  thumbnailLink?: string;
}

export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Cached token lost upon page reload, need re-auth for Drive API calls
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const provider = createGoogleDriveProvider();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive access token from Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';
    
    // Gracefully handle user cancellation / closed popup without treating it as an application crash
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/popup-blocked' ||
      errorMessage.includes('popup-closed-by-user') ||
      errorMessage.includes('cancelled-popup-request') ||
      errorMessage.includes('popup-closed')
    ) {
      console.info('Google sign-in popup was closed or dismissed by the user.');
      return null;
    }

    console.error('Google Drive sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setDriveAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogleDrive = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Helper to inspect Drive API response and handle scope/expiry issues
const handleDriveResponseError = async (response: Response): Promise<never> => {
  const errorData = await response.json().catch(() => ({}));
  const rawMsg = errorData?.error?.message || `${response.status} ${response.statusText}`;
  
  if (
    response.status === 401 || 
    response.status === 403 || 
    rawMsg.toLowerCase().includes('insufficient') ||
    rawMsg.toLowerCase().includes('permission') ||
    rawMsg.toLowerCase().includes('credentials')
  ) {
    cachedAccessToken = null;
    throw new Error('Google Drive access requires permission approval or your session has expired. Please connect or re-authorize Google Drive.');
  }

  throw new Error(`Google Drive API error: ${rawMsg}`);
};

// ==========================================
// GOOGLE DRIVE API V3 METHODS
// ==========================================

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

export const listGoogleDriveFiles = async (options: {
  folderId?: string;
  searchQuery?: string;
  pageSize?: number;
  pageToken?: string;
  mimeTypeFilter?: string;
  orderBy?: string;
}): Promise<{ files: DriveFileItem[]; nextPageToken?: string }> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please connect Google Drive first.');
  }

  const queryParts: string[] = ['trashed = false'];

  if (options.folderId) {
    queryParts.push(`'${options.folderId}' in parents`);
  }

  if (options.searchQuery && options.searchQuery.trim()) {
    const escaped = options.searchQuery.replace(/'/g, "\\'");
    queryParts.push(`name contains '${escaped}'`);
  }

  if (options.mimeTypeFilter) {
    if (options.mimeTypeFilter === 'folder') {
      queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
    } else if (options.mimeTypeFilter === 'document') {
      queryParts.push("mimeType != 'application/vnd.google-apps.folder'");
    } else if (options.mimeTypeFilter === 'pdf') {
      queryParts.push("mimeType = 'application/pdf'");
    } else if (options.mimeTypeFilter === 'spreadsheet') {
      queryParts.push("(mimeType = 'application/vnd.google-apps.spreadsheet' or mimeType contains 'spreadsheet' or mimeType contains 'excel')");
    }
  }

  const q = queryParts.join(' and ');
  const params = new URLSearchParams({
    q,
    pageSize: String(options.pageSize || 50),
    fields: 'nextPageToken, files(id, name, mimeType, size, iconLink, webViewLink, webContentLink, createdTime, modifiedTime, owners, parents, thumbnailLink)',
    orderBy: options.orderBy || 'folder,modifiedTime desc'
  });

  if (options.pageToken) {
    params.append('pageToken', options.pageToken);
  }

  const response = await fetch(`${DRIVE_API_BASE}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return await handleDriveResponseError(response);
  }

  const data = await response.json();
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken
  };
};

export const createDriveFolder = async (folderName: string, parentFolderId?: string): Promise<DriveFileItem> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please connect Google Drive first.');
  }

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!response.ok) {
    return await handleDriveResponseError(response);
  }

  return await response.json();
};

export const uploadFileToDrive = async (
  file: File | Blob,
  fileName: string,
  parentFolderId?: string,
  mimeType?: string
): Promise<DriveFileItem> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please connect Google Drive first.');
  }

  const metadata: { name: string; parents?: string[]; mimeType?: string } = {
    name: fileName
  };

  if (mimeType) {
    metadata.mimeType = mimeType;
  }

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  // Use multipart upload
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', file);

  const response = await fetch(`${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  if (!response.ok) {
    return await handleDriveResponseError(response);
  }

  return await response.json();
};

export const deleteDriveFile = async (fileId: string): Promise<boolean> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please connect Google Drive first.');
  }

  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok && response.status !== 204) {
    return await handleDriveResponseError(response);
  }

  return true;
};

export const HRIS_ROOT_FOLDER_NAME = 'DepEd Guimba West HRIS Documents';

export const STANDARD_HRIS_SUBFOLDERS = [
  'Appointment Papers',
  'Special Orders',
  'Promotion Documents',
  'Leave Records & Medical Certificates',
  'Profile Photos',
  'Certificates & Service Records',
  'Cloud Backups',
  'General Documents'
] as const;

export const getOrCreateHRISFolder = async (folderName: string, parentFolderId?: string): Promise<string> => {
  const { files } = await listGoogleDriveFiles({
    folderId: parentFolderId,
    searchQuery: folderName,
    mimeTypeFilter: 'folder'
  });

  const existing = files.find(f => f.name.toLowerCase() === folderName.toLowerCase() && f.mimeType === 'application/vnd.google-apps.folder');
  if (existing) {
    return existing.id;
  }

  const created = await createDriveFolder(folderName, parentFolderId);
  return created.id;
};

export const getOrCreateHRISRootFolder = async (): Promise<{ id: string; name: string }> => {
  const rootFolderId = await getOrCreateHRISFolder(HRIS_ROOT_FOLDER_NAME);
  return { id: rootFolderId, name: HRIS_ROOT_FOLDER_NAME };
};

export const initializeHRISFolderStructure = async (): Promise<string> => {
  const rootFolderId = await getOrCreateHRISFolder(HRIS_ROOT_FOLDER_NAME);
  
  // Ensure the primary subdirectories exist
  for (const subfolder of STANDARD_HRIS_SUBFOLDERS) {
    try {
      await getOrCreateHRISFolder(subfolder, rootFolderId);
    } catch (e) {
      console.warn(`Could not verify subfolder ${subfolder}:`, e);
    }
  }

  return rootFolderId;
};

export const getOrCreateHRISBackupFolder = async (): Promise<string> => {
  const rootFolderId = await getOrCreateHRISFolder(HRIS_ROOT_FOLDER_NAME);
  return await getOrCreateHRISFolder('Cloud Backups', rootFolderId);
};

export const uploadHRDocumentToDrive = async (
  file: File | Blob,
  fileName: string,
  category: 'Appointment' | 'SpecialOrder' | 'Promotion' | 'Leave' | 'Certificate' | 'ProfilePhoto',
  identifier?: string
): Promise<DriveFileItem> => {
  const rootFolderId = await getOrCreateHRISFolder(HRIS_ROOT_FOLDER_NAME);
  
  let subfolderName = 'General Documents';
  if (category === 'Appointment') subfolderName = 'Appointment Papers';
  else if (category === 'SpecialOrder') subfolderName = 'Special Orders';
  else if (category === 'Promotion') subfolderName = 'Promotion Documents';
  else if (category === 'Leave') subfolderName = 'Leave Records & Medical Certificates';
  else if (category === 'ProfilePhoto') subfolderName = 'Profile Photos';
  else if (category === 'Certificate') subfolderName = 'Certificates & Service Records';

  const categoryFolderId = await getOrCreateHRISFolder(subfolderName, rootFolderId);
  
  // Format fileName with timestamp and optional identifier (e.g. Employee Number / SO Number)
  const cleanId = identifier ? `${identifier.replace(/[^a-zA-Z0-9_-]/g, '_')}_` : '';
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFileName = `${category}_${cleanId}${dateStr}_${fileName}`;

  return await uploadFileToDrive(file, finalFileName, categoryFolderId);
};

export const exportHRISToDriveBackup = async (
  dataset: any,
  backupNamePrefix = 'Guimba_West_HRIS_Backup'
): Promise<DriveFileItem> => {
  const folderId = await getOrCreateHRISBackupFolder();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${backupNamePrefix}_${dateStr}.json`;

  const jsonBlob = new Blob([JSON.stringify(dataset, null, 2)], {
    type: 'application/json'
  });

  return await uploadFileToDrive(jsonBlob, fileName, folderId, 'application/json');
};

export const downloadDriveFileContent = async (fileId: string): Promise<string> => {
  const token = await getDriveAccessToken();
  if (!token) {
    throw new Error('Not authenticated with Google Drive. Please connect Google Drive first.');
  }

  const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    return await handleDriveResponseError(response);
  }

  return await response.text();
};
