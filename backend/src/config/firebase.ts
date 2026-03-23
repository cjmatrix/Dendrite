import admin from "firebase-admin";
import serviceAccount from "../../new.json";

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
    console.log("🔥 Firebase Admin Initialized successfully.");
  }
} catch (error) {
  console.warn("⚠️ Firebase Admin Initialization Failed:");
  console.error(error);
}

export default admin;
