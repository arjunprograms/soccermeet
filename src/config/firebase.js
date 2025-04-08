// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC-CYThs7xpQv30clk0EyJ7eSBRZ5DfhTE",
    authDomain: "soccermeet-1383e.firebaseapp.com",
    projectId: "soccermeet-1383e",
    storageBucket: "soccermeet-1383e.firebasestorage.app",
    messagingSenderId: "610550831924",
    appId: "1:610550831924:web:d7b02118e89cbb4a49e361",
    measurementId: "G-0MWVXSB1BE"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };