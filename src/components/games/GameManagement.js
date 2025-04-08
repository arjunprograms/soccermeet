import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGameById, updateGame, deleteGame, incrementUserGameCount } from '../../services/gameService';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { createNotification } from '../../services/notificationService';

const GameManagement = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    maxPlayers: 10,
    skillLevel: 'all',
    description: ''
  });
  
  useEffect(() => {
    const fetchGameAndUsers = async () => {
      try {
        const gameData = await getGameById(gameId);
        
        // Check if current user is the organizer
        if (gameData.organizerId !== auth.currentUser.uid) {
          setError("You don't have permission to manage this game");
          setLoading(false);
          return;
        }
        
        setGame(gameData);
        
        // Initialize form data
        const gameDate = gameData.date?.toDate ? gameData.date.toDate() : new Date(gameData.date);
        
        setFormData({
          title: gameData.title || '',
          date: gameDate.toISOString().split('T')[0],
          time: gameDate.toTimeString().substring(0, 5),
          location: gameData.location || '',
          maxPlayers: gameData.maxPlayers || 10,
          skillLevel: gameData.skillLevel || 'all',
          description: gameData.description || ''
        });
        
        // Fetch pending users' profiles
        const pendingProfiles = [];
        if (gameData.pendingRequests && gameData.pendingRequests.length > 0) {
          for (const userId of gameData.pendingRequests) {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              pendingProfiles.push({
                id: userId,
                ...userDoc.data()
              });
            }
          }
        }
        setPendingUsers(pendingProfiles);
        
        // Fetch participants' profiles
        const participantProfiles = [];
        if (gameData.participants && gameData.participants.length > 0) {
          for (const userId of gameData.participants) {
            if (userId !== auth.currentUser.uid) { // Skip the organizer
              const userDoc = await getDoc(doc(db, "users", userId));
              if (userDoc.exists()) {
                participantProfiles.push({
                  id: userId,
                  ...userDoc.data()
                });
              }
            }
          }
        }
        setParticipants(participantProfiles);
        
      } catch (error) {
        setError('Error fetching game details: ' + error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGameAndUsers();
  }, [gameId]);
  
  const handleApproveRequest = async (userId) => {
    try {
      if (!game) return;
      
      // Check if game is already full
      if (game.participants && game.participants.length >= game.maxPlayers) {
        setError('Game is already full');
        return;
      }
      
      // Increment the user's game count
      await incrementUserGameCount(userId);
      
      // Add to participants
      const updatedParticipants = [...(game.participants || [])];
      if (!updatedParticipants.includes(userId)) {
        updatedParticipants.push(userId);
      }
      
      // Remove from pending requests
      const updatedPendingRequests = (game.pendingRequests || []).filter(
        id => id !== userId
      );
      
      await updateGame(gameId, { 
        participants: updatedParticipants,
        pendingRequests: updatedPendingRequests
      });
      
      // Create notification for the approved user
      await createNotification(userId, {
        type: "request_approved",
        title: "Request Approved",
        message: `Your request to join "${game.title}" has been approved!`,
        gameId: gameId
      });
      
      // Update local state
      const approvedUser = pendingUsers.find(user => user.id === userId);
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      setParticipants([...participants, approvedUser]);
      
      setGame({
        ...game,
        participants: updatedParticipants,
        pendingRequests: updatedPendingRequests
      });
    } catch (error) {
      setError('Error approving request: ' + error.message);
      console.error(error);
    }
  };
  
  const handleRejectRequest = async (userId) => {
    try {
      if (!game) return;
      
      // Remove from pending requests
      const updatedPendingRequests = (game.pendingRequests || []).filter(
        id => id !== userId
      );
      
      await updateGame(gameId, { pendingRequests: updatedPendingRequests });
      
      // Create notification for the rejected user
      await createNotification(userId, {
        type: "request_rejected",
        title: "Request Not Approved",
        message: `Your request to join "${game.title}" was not approved`,
        gameId: gameId
      });
      
      // Update local state
      setPendingUsers(pendingUsers.filter(user => user.id !== userId));
      
      setGame({
        ...game,
        pendingRequests: updatedPendingRequests
      });
    } catch (error) {
      setError('Error rejecting request: ' + error.message);
      console.error(error);
    }
  };
  
  const handleRemoveParticipant = async (userId) => {
    try {
      if (!game) return;
      
      // Remove from participants
      const updatedParticipants = (game.participants || []).filter(
        id => id !== userId
      );
      
      await updateGame(gameId, { participants: updatedParticipants });
      
      // Update local state
      setParticipants(participants.filter(user => user.id !== userId));
      
      setGame({
        ...game,
        participants: updatedParticipants
      });
    } catch (error) {
      setError('Error removing participant: ' + error.message);
      console.error(error);
    }
  };
  
  const handleDeleteGame = async () => {
    if (window.confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      try {
        await deleteGame(gameId);
        navigate('/games');
      } catch (error) {
        setError('Error deleting game: ' + error.message);
        console.error(error);
      }
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'maxPlayers' ? parseInt(value) : value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate date
      const gameDate = new Date(`${formData.date}T${formData.time}`);
      const now = new Date();
      
      if (gameDate < now) {
        setError('Game date and time cannot be in the past');
        return;
      }
      
      // Combine date and time into a single timestamp
      const timestamp = new Date(`${formData.date}T${formData.time}`);
      
      const gameData = {
        title: formData.title,
        date: timestamp,
        location: formData.location,
        maxPlayers: formData.maxPlayers,
        skillLevel: formData.skillLevel,
        description: formData.description
      };
      
      await updateGame(gameId, gameData);
      
      // Update local state
      setGame({
        ...game,
        ...gameData
      });
      
      setEditing(false);
      setError('');
    } catch (error) {
      setError('Error updating game: ' + error.message);
      console.error(error);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!game) return <div>Game not found</div>;
  
  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Date not specified';
    
    // If timestamp is a Firestore timestamp, convert to JS Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleDateString() + ' at ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="game-management-container">
      <h2>Manage Game: {game.title}</h2>
      
      {editing ? (
        <div className="edit-game-form">
          <h3>Edit Game Details</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Game Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Maximum Players</label>
              <input
                type="number"
                name="maxPlayers"
                min="2"
                max="30"
                value={formData.maxPlayers}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Skill Level</label>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Description (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
              />
            </div>
            
            <div className="button-group">
              <button type="submit">Save Changes</button>
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="game-info">
            <p><strong>When:</strong> {formatDateTime(game.date)}</p>
            <p><strong>Where:</strong> {game.location}</p>
            <p><strong>Players:</strong> {game.participants ? game.participants.length : 1} / {game.maxPlayers}</p>
            <p><strong>Skill Level:</strong> {game.skillLevel}</p>
            
            {game.description && (
              <div className="game-description">
                <p><strong>Description:</strong> {game.description}</p>
              </div>
            )}
            
            <button onClick={() => setEditing(true)} className="edit-game-btn">
              Edit Game Details
            </button>
          </div>
          
          <div className="management-sections">
            <div className="pending-requests">
              <h3>Pending Requests ({pendingUsers.length})</h3>
              
              {pendingUsers.length === 0 ? (
                <p>No pending requests</p>
              ) : (
                <ul className="user-list">
                  {pendingUsers.map(user => (
                    <li key={user.id} className="user-item">
                      <div className="user-info">
                        <p><strong>{user.username}</strong></p>
                        <p>Skill Level: {user.skillLevel}</p>
                      </div>
                      <div className="user-actions">
                        <button 
                          className="approve-btn"
                          onClick={() => handleApproveRequest(user.id)}
                          disabled={game.participants && game.participants.length >= game.maxPlayers}
                        >
                          Approve
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => handleRejectRequest(user.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="participants-list">
              <h3>Participants ({(game.participants ? game.participants.length : 1)})</h3>
              
              <ul className="user-list">
                <li className="user-item organizer">
                  <div className="user-info">
                    <p><strong>You (Organizer)</strong></p>
                  </div>
                </li>
                
                {participants.map(user => (
                  <li key={user.id} className="user-item">
                    <div className="user-info">
                      <p><strong>{user.username}</strong></p>
                      <p>Skill Level: {user.skillLevel}</p>
                    </div>
                    <div className="user-actions">
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemoveParticipant(user.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
      
      <div className="management-actions">
        <Link to={`/games/${gameId}`} className="back-btn">
          Back to Game Details
        </Link>
        <button onClick={handleDeleteGame} className="delete-game-btn">
          Delete Game
        </button>
      </div>
    </div>
  );
};

export default GameManagement;