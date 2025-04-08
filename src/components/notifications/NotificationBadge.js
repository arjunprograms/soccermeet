import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserNotifications } from '../../services/notificationService';

const NotificationBadge = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifications = await getUserNotifications();
        const unread = notifications.filter(notification => !notification.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchNotifications();
    
    // Refresh the unread count every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <div className="notification-badge-container">
      <Link to="/notifications" className="notification-link">
        Notifications
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </Link>
    </div>
  );
};

export default NotificationBadge;