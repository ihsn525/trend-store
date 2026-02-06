import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC2w5ta6HIIb1UKISWjIlOiuyR68JOCi-A",
  authDomain: "trendstore-e62ad.firebaseapp.com",
  projectId: "trendstore-e62ad",
  storageBucket: "trendstore-e62ad.firebasestorage.app",
  messagingSenderId: "982703346913",
  appId: "1:982703346913:web:1c37be4dedbf61d91553a0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);