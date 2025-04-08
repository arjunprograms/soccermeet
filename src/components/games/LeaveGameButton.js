import React, { useState } from 'react';
import { updateGame } from '../../services/gameService';
import { auth } from '../../config/firebase';

const LeaveGameButton = ({ game, onLeaveSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleLeaveGame = async () => {
    if (!window.confirm('Are you sure you want to leave this game?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Remove current user from participants
      const updatedParticipants = (game.participants || []).filter(
        id => id !== auth.currentUser.uid
      );
      
      await updateGame(game.id, { participants: updatedParticipants });
      
      if (onLeaveSuccess) {
        onLeaveSuccess();
      }
    } catch (error) {
      setError('Error leaving game: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      {error && <div className="error-message">{error}</div>}
      <button 
        className="leave-game-btn" 
        onClick={handleLeaveGame}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Leave Game'}
      </button>
    </>
  );
};

export default LeaveGameButton;