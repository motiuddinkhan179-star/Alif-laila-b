import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import webpush from "web-push";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, onSnapshot, limit, orderBy, getDocs } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config from the provided file
const firebaseConfig = {
  apiKey: "AIzaSyDe7kOxBJkHMyTRgwel0oZ9VD6Je7k2iTo",
  authDomain: "healthy-garage-473512-r2.firebaseapp.com",
  projectId: "healthy-garage-473512-r2",
  storageBucket: "healthy-garage-473512-r2.firebasestorage.app",
  messagingSenderId: "935977043463",
  appId: "1:935977043463:web:8f0a23f68b6fe9c2f94ca2",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "ai-studio-10aeea43-96d6-4c5a-beb0-fcc6ab728e45");

// VAPID keys should be generated once and stored in environment variables
// For this demo, we'll generate them if they don't exist
const vapidKeys = webpush.generateVAPIDKeys();
const publicVapidKey = process.env.VITE_VAPID_PUBLIC_KEY || vapidKeys.publicKey;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY || vapidKeys.privateKey;

webpush.setVapidDetails(
  "mailto:example@yourdomain.com",
  publicVapidKey,
  privateVapidKey
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API to get the public VAPID key
  app.get("/api/vapid-public-key", (req, res) => {
    res.json({ publicKey: publicVapidKey });
  });

  // Secret key for server-side Firestore access
  const SERVER_SECRET = "alif-laila-push-secret-2026";

  // Listen to Firestore notifications and send push
  function startNotificationListener() {
    console.log("Starting Firestore listener for push notifications...");
    console.log("Using Database ID:", "ai-studio-10aeea43-96d6-4c5a-beb0-fcc6ab728e45");
    console.log("Using Server Secret:", SERVER_SECRET);
    
    const notificationsRef = collection(db, "notifications");
    
    // Use the secret key in the query to bypass permissions
    const q = query(
      notificationsRef,
      where("serverSecret", "==", SERVER_SECRET),
      orderBy("createdAt", "desc"),
      limit(1)
    );
    
    let initialLoad = true;
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log("Firestore snapshot received, size:", snapshot.size);
      if (initialLoad) {
        console.log("Initial load complete, skipping first batch");
        initialLoad = false;
        return;
      }

      snapshot.docChanges().forEach(async (change) => {
        if (change.type === "added") {
          const notification = change.doc.data();
          console.log("New notification detected for user:", notification.userId);

          try {
            // Fetch the user's profile to get their subscription
            // We use a query instead of getDoc to pass the serverSecret filter
            const usersRef = collection(db, "users");
            const userQuery = query(
              usersRef,
              where("uid", "==", notification.userId),
              where("serverSecret", "==", SERVER_SECRET),
              limit(1)
            );
            
            const userSnapshot = await getDocs(userQuery);
            
            if (!userSnapshot.empty) {
              const userData = userSnapshot.docs[0].data();
              const subscription = userData?.pushSubscription;

              if (subscription) {
                console.log("Sending push notification to user:", notification.userId);
                const payload = {
                  title: notification.title,
                  body: notification.message,
                  url: "/"
                };

                await webpush.sendNotification(subscription, JSON.stringify(payload));
                console.log("Push notification sent successfully");
              } else {
                console.log("User has no push subscription");
              }
            } else {
              console.log("User not found");
            }
          } catch (error) {
            console.error("Error processing push notification:", error);
          }
        }
      });
    }, (error) => {
      console.error("Firestore listener error:", error);
      // If it fails, try to restart after a delay
      console.log("Attempting to restart Firestore listener in 10 seconds...");
      setTimeout(() => {
        unsubscribe();
        startNotificationListener();
      }, 10000);
    });
  }

  startNotificationListener();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`VAPID Public Key: ${publicVapidKey}`);
  });
}

startServer();
