import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../../config/firebase';
import { logoutUser } from '../../services/authService';
import NotificationBadge from '../notifications/NotificationBadge';

const Navbar = () => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  
  if (!auth.currentUser) {
    return null; // Don't show navbar if user is not logged in
  }
  
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">SoccerMeet</Link>
      </div>
      
      <div className="navbar-links">
        <Link to="/games">Games</Link>
        <Link to="/profile">Profile</Link>
        <NotificationBadge />
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;