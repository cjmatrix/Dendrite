// This script runs in the background to handle notifications when your app is closed or hidden

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');


const firebaseConfig = {
  apiKey: "AIzaSyDE8kfpyTtPTHruj_oARWO8o704TCLQTrc",
  authDomain: "dendrites-26809.firebaseapp.com",
  projectId: "dendrites-26809",
  storageBucket: "dendrites-26809.firebasestorage.app",
  messagingSenderId: "748031437612",
  appId: "1:748031437612:web:04e5c579955d1c72dcda89",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg', 
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
