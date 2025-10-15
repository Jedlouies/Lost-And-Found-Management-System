import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDp2VwzgN0WBsvwz484KEXgXFs_N8gt4cw",
  authDomain: "spotsync-e224d.firebaseapp.com",
  projectId: "spotsync-e224d",
  storageBucket: "spotsync-e224d.firebasestorage.app",
  messagingSenderId: "566544162507",
  appId: "1:566544162507:web:ca46b9c29817b5f058454e",
};

const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
export const storage = getStorage(app);
export { auth };
