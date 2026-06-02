// firebase.js — initialize Firebase and export the shared singletons.
// Config comes from Vite env vars (see .env.example).
//
// Demo mode: when no Firebase config is present (no .env), the app runs against
// an in-memory mock store (see demoStore.js) so the full UI is browsable with
// sample data and no backend. initializeApp/getAuth/getFirestore tolerate an
// empty config (they only error on network use), but getStorage throws without
// a bucket — so it's only created outside demo mode.

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// True when Firebase isn't configured — drive the in-memory demo backend.
export const IS_DEMO = !import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'teampulse-demo',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// In demo mode, skip Auth/Firestore SDK init to avoid config validation.
// Real code branches to the demo store instead of using these refs.
export const auth = IS_DEMO ? null : getAuth(app);
export const db = IS_DEMO ? null : getFirestore(app);
export const storage = IS_DEMO ? null : getStorage(app);

// The single department this deployment operates on.
export const DEPARTMENT_ID = import.meta.env.VITE_DEPARTMENT_ID || 'main';
