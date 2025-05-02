// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
let auth = null;
let db = null;
let storage = null;

try {
  console.log("Firebase initialization starting...");
  
  // Log environment variables existence (not values for security)
  console.log("Environment variables check:");
  console.log("API_KEY exists:", !!process.env.REACT_APP_FIREBASE_API_KEY);
  console.log("AUTH_DOMAIN exists:", !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN);
  console.log("PROJECT_ID exists:", !!process.env.REACT_APP_FIREBASE_PROJECT_ID);
  console.log("STORAGE_BUCKET exists:", !!process.env.REACT_APP_FIREBASE_STORAGE_BUCKET);
  console.log("MESSAGING_SENDER_ID exists:", !!process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID);
  console.log("APP_ID exists:", !!process.env.REACT_APP_FIREBASE_APP_ID);
  console.log("MEASUREMENT_ID exists:", !!process.env.REACT_APP_FIREBASE_MEASUREMENT_ID);
  
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export { auth, db, storage };