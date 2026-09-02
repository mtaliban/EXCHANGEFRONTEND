// Firebase Cloud Messaging Service Worker
// Hii inashikilia push notifications za Firebase

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config — badilisha na config yako ya Firebase
// Unaweza kuipata kutoka Firebase Console → Project Settings → Web config
const firebaseConfig = {
  apiKey: 'AIzaSyBxrmq0BGIrBQzKv0BLGEXKc8Tv1GVxX-c',
  authDomain: 'kubadilishana.firebaseapp.com',
  projectId: 'kubadilishana',
  storageBucket: 'kubadilishana.appspot.com',
  messagingSenderId: '123456789',  // Badilisha na sender ID yako
  appId: '1:123456789:web:abcdef123456',  // Badilisha na app ID yako
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve Firebase Messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Background message:', payload);

  const notificationTitle = payload.notification?.title || 'Kubadilishana';
  const notificationOptions = {
    body: payload.notification?.body || 'Una taarifa mpya!',
    icon: '/icon-192.png',
    badge: '/favicon-32x32.png',
    tag: payload.data?.tag || 'kubadilishana-notification',
    renotify: true,
    data: {
      url: payload.data?.url || '/dashboard',
      ...payload.data,
    },
    actions: [
      { action: 'open', title: 'Fungua' },
      { action: 'dismiss', title: 'Funga' },
    ],
    vibrate: [200, 100, 200],
    // Custom data for the app
    ...payload.notification,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification click:', event.notification.tag);
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
