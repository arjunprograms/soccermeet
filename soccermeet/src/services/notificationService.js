import { db, auth } from "../config/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  doc,
  Timestamp
} from "firebase/firestore";

// Create a notification
export const createNotification = async (userId, data) => {
  try {
    const notificationsRef = collection(db, "notifications");
    await addDoc(notificationsRef, {
      userId,
      ...data,
      read: false,
      createdAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Get notifications for current user
export const getUserNotifications = async () => {
  try {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef, 
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    
    const notifications = [];
    querySnapshot.forEach((doc) => {
      notifications.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return notifications;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    if (!auth.currentUser) throw new Error("User not authenticated");
    
    const notificationsRef = collection(db, "notifications");
    const q = query(
      notificationsRef, 
      where("userId", "==", auth.currentUser.uid),
      where("read", "==", false)
    );
    
    const querySnapshot = await getDocs(q);
    
    const updatePromises = [];
    querySnapshot.forEach((document) => {
      const notificationRef = doc(db, "notifications", document.id);
      updatePromises.push(updateDoc(notificationRef, { read: true }));
    });
    
    await Promise.all(updatePromises);
    
    return true;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};