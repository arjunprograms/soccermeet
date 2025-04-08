import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllGames } from '../../services/gameService';
import GameItem from './GameItem';

const GamesList = () => {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    skillLevel: 'all',
    status: 'all'
  });
  const [sortBy, setSortBy] = useState('date');
  
  useEffect(() => {
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
  }, [games, filter, sortBy]);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
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