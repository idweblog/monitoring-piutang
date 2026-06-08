/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// Safe dynamic-like glob import to prevent Vite build-time crash if firebase-applet-config.json is deleted or gitignored
const configFiles = (import.meta as any).glob('../firebase-applet-config.json', { eager: true });
const configKeys = Object.keys(configFiles);
const firebaseConfigJson: any = configKeys.length > 0 ? (configFiles[configKeys[0]] as any).default : {};

// Support environment variables (safe for GitHub/local development via .env)
// with fallback to AI Studio's auto-generated firebase-applet-config.json
const rawApiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || '';
const rawProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || '';

const firebaseConfig = {
  apiKey: rawApiKey || 'AIzaSyPlaceholderKeyForUnconfiguredApplet',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || 'unconfigured-app.firebaseapp.com',
  projectId: rawProjectId || 'unconfigured-firebase-project-id',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || 'unconfigured-app.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '1234567890',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '1:1234567890:web:abcdef123456',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || '(default)'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId === '(default)' ? undefined : firebaseConfig.firestoreDatabaseId);
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
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isFirebaseConfigured = rawProjectId !== '' && rawProjectId !== 'unconfigured-firebase-project-id' && rawProjectId !== 'your-project-id';

// Connection check validation as mandated by the Firebase Skill Guidelines
async function testConnection() {
  if (!isFirebaseConfigured) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Successfully pinged the cloud Firestore database instance');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration. The client is offline.");
    }
  }
}
testConnection();
