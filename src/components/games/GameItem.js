import React from 'react';
import { Link } from 'react-router-dom';

const GameItem = ({ game }) => {
  // Format date and time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Date not specified';
    
    // If timestamp is a Firestore timestamp, convert to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString() + ' at ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="game-item">
      <h3>{game.title}</h3>
      <p><strong>When:</strong> {formatDateTime(game.date)}</p>
      <p><strong>Where:</strong> {game.location}</p>
      <p><strong>Players:</strong> {game.participants ? game.participants.length : 1} / {game.maxPlayers}</p>
      <p><strong>Skill Level:</strong> {game.skillLevel}</p>
      
      {game.description && (
        <p className="game-description">{game.description}</p>
      )}
      
      <Link to={`/games/${game.id}`} className="view-game-btn">
        View Details
      </Link>
    </div>
  );
};

export default GameItem;