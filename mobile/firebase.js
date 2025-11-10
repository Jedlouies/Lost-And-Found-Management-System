// firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ✅ Config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
  // ✅ Default to correct region URL if not set
  databaseURL:
    process.env.EXPO_PUBLIC_DATABASE_URL,
};

// ✅ Initialize the app once
const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ✅ Initialize Firestore and Database
export const db = getFirestore(app);
export const realtimeDB = getDatabase(app);

// ✅ Initialize Auth safely (React Native persistence)
let authInstance;
try {
  authInstance = getAuth(app);
} catch {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
export const auth = authInstance;

// ✅ Initialize secondary auth safely
let secondaryApp: FirebaseApp;
try {
  secondaryApp = getApp("secondary");
} catch {
  secondaryApp = initializeApp(firebaseConfig, "secondary");
}

let secondaryAuthInstance;
try {
  secondaryAuthInstance = getAuth(secondaryApp);
} catch {
  secondaryAuthInstance = initializeAuth(secondaryApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}
export const secondaryAuth = secondaryAuthInstance;

// ✅ Default export
export default app;
