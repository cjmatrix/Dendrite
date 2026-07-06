import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import api from "./axios";


const firebaseConfig = {
  apiKey: "AIzaSyDE8kfpyTtPTHruj_oARWO8o704TCLQTrc",
  authDomain: "dendrites-26809.firebaseapp.com",
  projectId: "dendrites-26809",
  storageBucket: "dendrites-26809.firebasestorage.app",
  messagingSenderId: "748031437612",
  appId: "1:748031437612:web:04e5c579955d1c72dcda89",
};

export const app = initializeApp(firebaseConfig);


export const messaging = getMessaging(app);

export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
     
      const currentToken = await getToken(messaging, {
        vapidKey: "BNYA7qzDS14ow16Ca1_SHK_qKh4fEwOwN8-Kck3Vx3Ed2iBVRYnD7tAjRYRkncVPmX_2sjq86mhWAlWcLazWPNA",
      });
      if (currentToken) {
        console.log("FCM Token Generated!");
       
        await api.post("/auth/fcm-token", { fcmToken: currentToken });
      } else {
        console.log("No registration token available.");
      }
    } else {
      console.log("Notification permission denied!");
    }
  } catch (error) {
    console.error("An error occurred while retrieving or sending FCM token:", error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      resolve(payload);
    });
  });
