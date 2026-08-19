import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth } from './firebase';

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const driveProvider = new GoogleAuthProvider();
GOOGLE_DRIVE_SCOPES.forEach(scope => {
  driveProvider.addScope(scope);
});

// Configure prompt to ensure consent screen if needed
driveProvider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token management (per security guidelines, never in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;
let authListeners: Array<(user: User | null, token: string | null) => void> = [];

export function subscribeToDriveAuth(listener: (user: User | null, token: string | null) => void) {
  authListeners.push(listener);
  // Immediately notify with current state
  listener(auth.currentUser, cachedAccessToken);
  return () => {
    authListeners = authListeners.filter(l => l !== listener);
  };
}

function notifyListeners(user: User | null, token: string | null) {
  authListeners.forEach(l => {
    try {
      l(user, token);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

// Initialize Auth listener on load
export const initDriveAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        notifyListeners(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // User is logged into Firebase, but no fresh token in this session yet
        notifyListeners(user, null);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      notifyListeners(null, null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google with Drive Scopes
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to obtain Google Drive OAuth access token from authorization prompt.');
    }

    cachedAccessToken = credential.accessToken;
    notifyListeners(result.user, cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Drive sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setDriveAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  notifyListeners(auth.currentUser, token);
};

export const isGoogleDriveConnected = (): boolean => {
  return Boolean(cachedAccessToken);
};

export const disconnectGoogleDrive = async () => {
  try {
    cachedAccessToken = null;
    notifyListeners(null, null);
    await auth.signOut();
  } catch (err) {
    console.error('Error signing out of Google Drive:', err);
  }
};
