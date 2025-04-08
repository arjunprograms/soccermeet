import { db, auth } from "../config/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  Timestamp,
  onSnapshot
} from "firebase/firestore";

// Send a message to a game chat
export const sendGameMessage = async (gameId, message) => {
  try {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const messagesRef = collection(db, "messages");
    await addDoc(messagesRef, {
      gameId,
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || auth.currentUser.email,
      text: message,
      createdAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

// Get all messages for a game
export const getGameMessages = async (gameId) => {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef, 
      where("gameId", "==", gameId),
      orderBy("createdAt", "asc")
    );
    
    const querySnapshot = await getDocs(q);
    
    const messages = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return messages;
  } catch (error) {
    console.error("Error getting messages:", error);
    throw error;
  }
};

// Subscribe to real-time messages for a game
export const subscribeToGameMessages = (gameId, callback) => {
  try {
    const messagesRef = collection(db, "messages");
    const q = query(
      messagesRef, 
      where("gameId", "==", gameId),
      orderBy("createdAt", "asc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(messages);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error("Error subscribing to messages:", error);
    throw error;
  }
};