// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import logger from '../services/logger.js'


// Firebase SDKs are imported as needed
// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration (loaded from environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasValidConfig = Object.values(firebaseConfig).every(Boolean);

let db = null;
let auth = null;

if (hasValidConfig) {
  const firebaseApp = initializeApp(firebaseConfig);
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
} else {
  logger.firestore.warn('Missing configuration. Firestore/Auth features are disabled until environment variables are set.')
}

export { db, auth }