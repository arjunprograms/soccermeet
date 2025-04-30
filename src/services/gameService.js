import { db } from "../config/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  orderBy
} from "firebase/firestore";

// Create a new game
export const createGame = async (gameData) => {
  try {
    const gamesRef = collection(db, "games");
    const docRef = await addDoc(gamesRef, {
      ...gameData,
      createdAt: new Date(),
      participants: [gameData.organizerId], // Add organizer as first participant
      pendingRequests: []
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating game:", error);
    throw error;
  }
};

// Get all games
export const getAllGames = async () => {
  try {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    
    const games = [];
    querySnapshot.forEach((doc) => {
      games.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return games;
  } catch (error) {
    console.error("Error getting games:", error);
    throw error;
  }
};

// Get game by ID
export const getGameById = async (gameId) => {
  try {
    const gameDoc = await getDoc(doc(db, "games", gameId));
    
    if (gameDoc.exists()) {
      return {
        id: gameDoc.id,
        ...gameDoc.data()
      };
    } else {
      throw new Error("Game not found");
    }
  } catch (error) {
    console.error("Error getting game:", error);
    throw error;
  }
};

// Get games created by a user
export const getGamesByOrganizer = async (organizerId) => {
  try {
    const gamesRef = collection(db, "games");
    const q = query(gamesRef, where("organizerId", "==", organizerId));
    const querySnapshot = await getDocs(q);
    
    const games = [];
    querySnapshot.forEach((doc) => {
      games.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return games;
  } catch (error) {
    console.error("Error getting games by organizer:", error);
    throw error;
  }
};

// Update game details
export const updateGame = async (gameId, gameData) => {
  try {
    const gameRef = doc(db, "games", gameId);
    await updateDoc(gameRef, gameData);
    return true;
  } catch (error) {
    console.error("Error updating game:", error);
    throw error;
  }
};

// Delete a game
export const deleteGame = async (gameId) => {
  try {
    await deleteDoc(doc(db, "games", gameId));
    return true;
  } catch (error) {
    console.error("Error deleting game:", error);
    throw error;
  }
};

// Increment user's game participation count
export const incrementUserGameCount = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const currentCount = userDoc.data().gamesCount || 0;
      await updateDoc(userRef, {
        gamesCount: currentCount + 1
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error incrementing game count:", error);
    throw error;
  }
};