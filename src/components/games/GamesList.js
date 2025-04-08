import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllGames } from '../../services/gameService';
import GameItem from './GameItem';

const GamesList = () => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [filter, setFilter] = useState({
    skillLevel: 'all',
    status: 'all',
    maxDistance: 0 // 0 means no limit
  });
  const [sortBy, setSortBy] = useState('date');
  
  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
    
    const fetchGames = async () => {
      try {
        const gamesData = await getAllGames();
        setGames(gamesData);
        setFilteredGames(gamesData);
      } catch (error) {
        setError('Error fetching games: ' + error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
  }, []);
  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Haversine formula to calculate distance between two points
    const R = 3958.8; // Radius of the Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in miles
  };
  
  useEffect(() => {
    // Apply filters and sorting
    let result = [...games];
    
    // Filter by skill level
    if (filter.skillLevel !== 'all') {
      result = result.filter(game => 
        game.skillLevel === filter.skillLevel || game.skillLevel === 'all'
      );
    }
    
    // Filter by status
    if (filter.status !== 'all') {
      const now = new Date();
      
      if (filter.status === 'upcoming') {
        result = result.filter(game => {
          const gameDate = game.date.toDate ? game.date.toDate() : new Date(game.date);
          return gameDate > now;
        });
      } else if (filter.status === 'past') {
        result = result.filter(game => {
          const gameDate = game.date.toDate ? game.date.toDate() : new Date(game.date);
          return gameDate < now;
        });
      }
    }
    
    // Filter by distance
    if (filter.maxDistance > 0 && userCoordinates) {
      result = result.filter(game => {
        if (!game.coordinates) return true; // Include games without coordinates
        
        const distance = calculateDistance(
          userCoordinates.lat, 
          userCoordinates.lng, 
          game.coordinates.lat, 
          game.coordinates.lng
        );
        
        return distance <= filter.maxDistance;
      });
    }
    
    // Sort games
    result.sort((a, b) => {
      const dateA = a.date.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date.toDate ? b.date.toDate() : new Date(b.date);
      
      if (sortBy === 'date') {
        return dateA - dateB; // Ascending by date
      } else if (sortBy === 'players') {
        const playersA = a.participants ? a.participants.length : 0;
        const playersB = b.participants ? b.participants.length : 0;
        return playersB - playersA; // Descending by player count
      }
      
      return 0;
    });
    
    setFilteredGames(result);
  }, [games, filter, sortBy, userCoordinates]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: name === 'maxDistance' ? parseInt(value) : value
    }));
  };
  
  if (loading) return <div>Loading games...</div>;
  if (error) return <div className="error-message">{error}</div>;
  
  return (
    <div className="games-list-container">
      <div className="games-header">
        <h2>Available Games</h2>
        <Link to="/create-game" className="create-game-btn">+ Create Game</Link>
      </div>
      
      <div className="filter-bar">
        <div className="filter-group">
          <label>Skill Level</label>
          <select 
            name="skillLevel" 
            value={filter.skillLevel}
            onChange={handleFilterChange}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Status</label>
          <select 
            name="status" 
            value={filter.status}
            onChange={handleFilterChange}
          >
            <option value="all">All Games</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Max Distance (miles)</label>
          <select 
            name="maxDistance" 
            value={filter.maxDistance}
            onChange={handleFilterChange}
          >
            <option value="0">Any Distance</option>
            <option value="5">Within 5 miles</option>
            <option value="10">Within 10 miles</option>
            <option value="25">Within 25 miles</option>
            <option value="50">Within 50 miles</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sort By</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Date</option>
            <option value="players">Player Count</option>
          </select>
        </div>
      </div>
      
      {filteredGames.length === 0 ? (
        <div className="no-games-message">
          <p>No games match your filters.</p>
          <p>Try adjusting your filters or create a new game!</p>
        </div>
      ) : (
        <div className="games-grid">
          {filteredGames.map(game => (
            <GameItem key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  );
};

export default GamesList;