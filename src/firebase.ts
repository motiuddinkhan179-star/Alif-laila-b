import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

// Use environment variables if available (for Vercel/Production), otherwise fallback to applet config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with long polling to avoid connection issues in some environments
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// Connection test
async function testConnection() {
  try {
    console.log("Testing Firestore connection to database:", firebaseConfig.firestoreDatabaseId);
    await getDocFromServer(doc(db, '_connection_test_', 'test'));
    console.log("Firestore connection successful");
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        // A permission error actually proves we ARE connected to the backend
        console.log("Firestore connection verified (received permission response)");
      } else if (error.message.includes('offline')) {
        console.error("Firestore connection test failed: The client is offline or the database is unavailable.");
      } else {
        console.error("Firestore connection test failed:", error.message);
      }
    }
  }
}
testConnection();
