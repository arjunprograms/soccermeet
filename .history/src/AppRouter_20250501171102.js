import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Profile from './components/profile/Profile';
import CreateGame from './components/games/CreateGame';
import GamesList from './components/games/GamesList';
import GameDetails from './components/games/GameDetails';
import GameManagement from './components/games/GameManagement';
import NotificationList from './components/notifications/NotificationList';
import Navbar from './components/layout/Navbar';

const AppRouter = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      console.log("AppRouter: Setting up auth listener");
      
      if (!auth) {
        throw new Error("Firebase auth not available in AppRouter");
      }
      
      const unsubscribe = onAuthStateChanged(
        auth, 
        (user) => {
          console.log("Auth state changed:", user ? "User logged in" : "No user");
          setCurrentUser(user);
          setLoading(false);
        },
        (authError) => {
          console.error("Auth state change error:", authError);
          setError(authError.message);
          setLoading(false);
        }
      );
      
      return () => unsubscribe();
    } catch (setupError) {
      console.error("Auth setup error:", setupError);
      setError(setupError.message);
      setLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '600px',
        margin: '20px auto',
        textAlign: 'center',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2>Authentication Error</h2>
        <p>We encountered a problem with authentication services.</p>
        <p style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: '#f7fafc', 
          borderRadius: '4px',
          color: '#e53e3e',
          fontSize: '14px'
        }}>
          Error details: {error}
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh'
      }}>
        <div>
          <h2>SoccerMeet</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/profile" /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/profile" /> : <Register />} />
        <Route path="/profile" element={currentUser ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/games" element={currentUser ? <GamesList /> : <Navigate to="/login" />} />
        <Route path="/create-game" element={currentUser ? <CreateGame /> : <Navigate to="/login" />} />
        <Route path="/games/:gameId" element={currentUser ? <GameDetails /> : <Navigate to="/login" />} />
        <Route path="/games/:gameId/manage" element={currentUser ? <GameManagement /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={currentUser ? <NotificationList /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={currentUser ? "/games" : "/login"} />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;