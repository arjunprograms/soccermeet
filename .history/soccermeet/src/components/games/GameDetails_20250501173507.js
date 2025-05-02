import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGameById, updateGame } from '../../services/gameService';
import { auth } from '../../config/firebase';
import LeaveGameButton from './LeaveGameButton';
import { createNotification } from '../../services/notificationService';
import { GoogleMap, useLoadScript, StreetViewPanorama, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  marginBottom: '20px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const GameDetails = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [showStreetView, setShowStreetView] = useState(true);
  
  // Load Google Maps
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });
  
  useEffect(() => {
    const fetchGameDetails = async () => {
      try {
        const gameData = await getGameById(gameId);
        setGame(gameData);
        
        // Check if current user has a pending request
        if (gameData.pendingRequests && gameData.pendingRequests.includes(auth.currentUser.uid)) {
          setJoinRequestSent(true);
        }
      } catch (error) {
        setError('Error fetching game details: ' + error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameDetails();
  }, [gameId]);
  
  const handleJoinRequest = async () => {
    try {
      if (!game) return;
      
      // Add current user to pending requests
      const pendingRequests = game.pendingRequests || [];
      pendingRequests.push(auth.currentUser.uid);
      
      await updateGame(gameId, { pendingRequests });
      
      // Create notification for game organizer
      await createNotification(game.organizerId, {
        type: "join_request",
        title: "New Join Request",
        message: `${auth.currentUser.email} has requested to join your game "${game.title}"`,
        gameId: gameId
      });
      
      setJoinRequestSent(true);
      setGame({
        ...game,
        pendingRequests
      });
    } catch (error) {
      setError('Error sending join request: ' + error.message);
      console.error(error);
    }
  };
  
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Date not specified';
    
    // If timestamp is a Firestore timestamp, convert to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString() + ' at ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getGameStatus = () => {
    if (!game || !game.date) return 'unknown';
    
    const gameDate = game.date.toDate ? game.date.toDate() : new Date(game.date);
    const now = new Date();
    
    // If game is more than 3 hours in the past, consider it completed
    if (gameDate < new Date(now.getTime() - 3 * 60 * 60 * 1000)) {
      return 'completed';
    }
    
    // If game is within 30 minutes (past or future), it's ongoing
    if (Math.abs(gameDate - now) < 30 * 60 * 1000) {
      return 'ongoing';
    }
    
    // If game is in the future, it's upcoming
    if (gameDate > now) {
      return 'upcoming';
    }
    
    return 'unknown';
  };
  
  // Toggle between Street View and Map View
  const toggleView = () => {
    setShowStreetView(!showStreetView);
  };
  
  // Get directions to the location
  const getDirectionsUrl = () => {
    if (!game || !game.coordinates) return '';
    
    const { lat, lng } = game.coordinates;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };
  
  if (loadError) return <div>Error loading maps</div>;
  if (loading) return <div>Loading game details...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!game) return <div>Game not found</div>;
  
  const isOrganizer = game.organizerId === auth.currentUser.uid;
  const isParticipant = game.participants && game.participants.includes(auth.currentUser.uid);
  const isFull = game.participants && game.participants.length >= game.maxPlayers;
  const status = getGameStatus();
  
  return (
    <div className="game-details-container">
      <h2>{game.title}</h2>
      
      <div className="game-info">
        <div className={`game-status-badge ${status}`}>
          {status === 'upcoming' && 'Upcoming'}
          {status === 'ongoing' && 'In Progress'}
          {status === 'completed' && 'Completed'}
          {status === 'unknown' && 'Status Unknown'}
        </div>
        
        <p><strong>When:</strong> {formatDateTime(game.date)}</p>
        <p><strong>Where:</strong> {game.location}</p>
        
        {isLoaded && game.coordinates && (
          <div className="location-view">
            <div className="map-controls">
              <button 
                onClick={toggleView}
                className="view-toggle-btn"
              >
                {showStreetView ? 'Show Map View' : 'Show Street View'}
              </button>
              <a 
                href={getDirectionsUrl()} 
                target="_blank" 
                rel="noopener noreferrer"
                className="directions-btn"
              >
                Get Directions
              </a>
            </div>
            
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={game.coordinates}
              zoom={16}
            >
              {showStreetView ? (
                <StreetViewPanorama
                  position={game.coordinates}
                  visible={true}
                  options={{
                    enableCloseButton: false,
                    addressControl: true,
                    fullscreenControl: false,
                    imageDateControl: false
                  }}
                />
              ) : (
                <Marker position={game.coordinates} />
              )}
            </GoogleMap>
          </div>
        )}
        
        <p><strong>Skill Level:</strong> {game.skillLevel}</p>
        <p><strong>Players:</strong> {game.participants ? game.participants.length : 1} / {game.maxPlayers}</p>
        <p><strong>Organizer:</strong> {game.organizerEmail}</p>
        
        {game.description && (
          <div className="game-description">
            <h3>Description</h3>
            <p>{game.description}</p>
          </div>
        )}
      </div>
      
      <div className="game-actions">
        {isOrganizer ? (
          <>
            <Link to={`/games/${gameId}/manage`} className="manage-game-btn">
              Manage Game
            </Link>
          </>
        ) : isParticipant ? (
          <LeaveGameButton 
            game={game} 
            onLeaveSuccess={() => {
              setGame({
                ...game,
                participants: game.participants.filter(id => id !== auth.currentUser.uid)
              });
            }} 
          />
        ) : joinRequestSent ? (
          <button className="request-sent-btn" disabled>
            Request Sent
          </button>
        ) : isFull ? (
          <button className="game-full-btn" disabled>
            Game is Full
          </button>
        ) : status === 'completed' ? (
          <button className="game-completed-btn" disabled>
            Game Completed
          </button>
        ) : (
          <button onClick={handleJoinRequest} className="join-game-btn">
            Request to Join
          </button>
        )}
        
        <Link to="/games" className="back-btn">
          Back to Games
        </Link>
      </div>
    </div>
  );
};

export default GameDetails;