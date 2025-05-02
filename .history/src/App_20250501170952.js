import React, { useState, useEffect } from 'react';
import './App.css';
import AppRouter from './AppRouter';
import { auth, db, storage } from './config/firebase';

function App() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      console.log("App initialization starting...");
      
      // Check if Firebase is properly initialized
      if (!auth || !db || !storage) {
        throw new Error("Firebase services not fully initialized");
      }
      
      console.log("Firebase services available, app ready");
      setLoading(false);
    } catch (initError) {
      console.error("App initialization error:", initError);
      setError(initError.message);
      setLoading(false);
    }
  }, []);

  // Error state - show a user-friendly error message
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '600px',
        margin: '50px auto',
        textAlign: 'center',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#e53e3e' }}>SoccerMeet</h1>
        <p>We're having trouble connecting to our services.</p>
        <p>Please try again later or contact support if the issue persists.</p>
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#f7fafc', 
          borderRadius: '4px',
          fontSize: '14px',
          color: '#718096'
        }}>
          Error details: {error}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>
          <h1>SoccerMeet</h1>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Your original app structure
  return (
    <div className="App">
      <header className="App-header">
        <h1>SoccerMeet</h1>
      </header>
      <main>
        <AppRouter />
      </main>
    </div>
  );
}

export default App;