import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';
import defaultConfig from '../../firebase-applet-config.json';

// Helper to safely read environment variables across Vite (import.meta.env) and CRA/Vercel (process.env)
const readEnv = (viteKey: string, craKey?: string, fallback: string = ''): string => {
  // Check Vite client-side environment
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
      return String(import.meta.env[viteKey]).trim();
    }
  } catch {
    // import.meta may not be available in non-ESM environments
  }

  // Check Node / Vercel / CRA process.env
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[viteKey]) {
        return String(process.env[viteKey]).trim();
      }
      if (craKey && process.env[craKey]) {
        return String(process.env[craKey]).trim();
      }
    }
  } catch {
    // process may not be available in browser sandbox
  }

  return fallback;
};

// Database ID configuration
const rawDbId = readEnv(
  'VITE_FIREBASE_FIRESTORE_DATABASE_ID',
  'REACT_APP_FIREBASE_FIRESTORE_DATABASE_ID',
  (defaultConfig as any)?.firestoreDatabaseId || ''
);

// Firebase configuration with environment variable overrides for Vercel/production deployment
const firebaseConfig = {
  apiKey: readEnv('VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY', defaultConfig.apiKey || ''),
  authDomain: readEnv('VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN', defaultConfig.authDomain || ''),
  projectId: readEnv('VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID', defaultConfig.projectId || ''),
  storageBucket: readEnv('VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET', defaultConfig.storageBucket || ''),
  messagingSenderId: readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', 'REACT_APP_FIREBASE_MESSAGING_SENDER_ID', defaultConfig.messagingSenderId || ''),
  appId: readEnv('VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID', defaultConfig.appId || ''),
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore
// If a specific non-default database ID is provided and is not '(default)', use it. Otherwise use default database.
export const db: Firestore = (rawDbId && rawDbId !== '(default)' && rawDbId !== '')
  ? getFirestore(app, rawDbId)
  : getFirestore(app);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('[Firestore Error]', JSON.stringify(errInfo, null, 2));
  throw new Error(errMessage);
}

// Test Connection on init
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.info('[Firebase] Connected to Firestore database successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Warning: Client appears offline or could not reach Firestore endpoint.');
    } else {
      console.info('[Firebase] Firestore initialized.');
    }
    return false;
  }
}

// Kick off connection check
testFirebaseConnection();
