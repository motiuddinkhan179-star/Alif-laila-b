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
    image: data.image || null,
    data: data.url || '/',
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    actions: data.type === 'order' && data.orderId ? [
      { action: 'accept', title: 'Accept Order', icon: '/logo.png' },
      { action: 'reject', title: 'Reject Order', icon: '/logo.png' },
      ...(data.customerPhone ? [{ action: 'call', title: 'Call Customer', icon: '/logo.png' }] : [])
    ] : []
  };

  // Store metadata in data for click handling
  options.data = {
    url: data.url || '/',
    orderId: data.orderId,
    type: data.type,
    customerPhone: data.customerPhone
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click Received.');

  const notificationData = event.notification.data || {};
  const orderId = notificationData.orderId;
  const customerPhone = notificationData.customerPhone;
  const action = event.action;

  event.notification.close();

  if (action === 'call' && customerPhone) {
    event.waitUntil(
      clients.openWindow(`tel:${customerPhone}`)
    );
  } else if (action === 'accept' || action === 'reject') {
    const status = action === 'accept' ? 'accepted' : 'rejected';
    
    // Perform background action
    event.waitUntil(
      fetch('/api/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: orderId,
          status: status,
          secret: 'alif-laila-push-secret-2026'
        })
      }).then(response => {
        if (response.ok) {
          return self.registration.showNotification('Success', {
            body: `Order #${orderId.slice(-6).toUpperCase()} ${status} successfully.`,
            icon: '/logo.png'
          });
        } else {
          throw new Error('Failed to update order');
        }
      }).catch(err => {
        console.error('Background action failed:', err);
        // If background action fails, open the app as fallback
        return clients.openWindow(`/?action=${action}&orderId=${orderId}`);
      })
    );
  } else {
    // Default click behavior: open the app
    let targetUrl = notificationData.url || '/';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});
