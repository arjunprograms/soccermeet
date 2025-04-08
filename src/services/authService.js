import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut 
  } from "firebase/auth";
  import { auth, db } from "../config/firebase";
  import { doc, setDoc } from "firebase/firestore";
  
  // Register new user
  export const registerUser = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };
  
  // Login existing user
  export const loginUser = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };
  
  // Logout user
  export const logoutUser = () => {
    return signOut(auth);
  };
  
  // Create user profile in Firestore
  export const createUserProfile = async (userId, userData) => {
    try {
      await setDoc(doc(db, "users", userId), {
        username: userData.username || "",
        email: userData.email,
        location: userData.location || "",
        skillLevel: userData.skillLevel || "beginner",
        createdAt: new Date()
      });
    } catch (error) {
      throw error;
    }
  };