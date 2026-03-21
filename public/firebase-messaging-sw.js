// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.10.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// These values are from your firebase-applet-config.json
firebase.initializeApp({
  apiKey: "AIzaSyDe7kOxBJkHMyTRgwel0oZ9VD6Je7k2iTo",
  authDomain: "healthy-garage-473512-r2.firebaseapp.com",
  projectId: "healthy-garage-473512-r2",
  storageBucket: "healthy-garage-473512-r2.firebasestorage.app",
  messagingSenderId: "935977043463",
  appId: "1:935977043463:web:8f0a23f68b6fe9c2f94ca2"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

// Generic push event for web-push
self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = { title: 'Alif Laila', body: event.data.text() };
  }

  const title = data.title || 'Alif Laila';
  const options = {
    body: data.body || 'New notification',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url || '/'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
