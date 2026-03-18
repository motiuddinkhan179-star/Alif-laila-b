import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import appletConfig from '../firebase-applet-config.json';

// Use the provisioned applet config
const firebaseConfig = {
  apiKey: appletConfig.apiKey,
  authDomain: appletConfig.authDomain,
  projectId: appletConfig.projectId,
  storageBucket: appletConfig.storageBucket,
  messagingSenderId: appletConfig.messagingSenderId,
  appId: appletConfig.appId,
  firestoreDatabaseId: appletConfig.firestoreDatabaseId
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
