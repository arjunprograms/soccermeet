import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../../services/gameService';
import { auth } from '../../config/firebase';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import MapView from '../maps/MapView';

const CreateGame = () => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    maxPlayers: 10,
    skillLevel: 'all',
    description: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDHnJPix7q53OnUaO5F4YEh-i_0QV0Y0wQ"
  });
  
  const geocodeAddress = async (address) => {
    if (!isLoaded || !window.google) return null;
    
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          const { lat, lng } = results[0].geometry.location;
          resolve({ lat: lat(), lng: lng() });
        } else {
          resolve(null); // Resolve with null instead of rejecting to avoid errors
        }
      });
    });
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
    setError('');
    setLoading(true);
    
    // Validate date
    const gameDate = new Date(`${formData.date}T${formData.time}`);
    const now = new Date();
    
    if (gameDate < now) {
      setError('Game date and time cannot be in the past');
      setLoading(false);
      return;
    }
    
    try {
      // Try to geocode the location
      let coordinates = null;
      if (formData.location) {
        coordinates = await geocodeAddress(formData.location);
      }
      
      // Combine date and time into a single timestamp
      const timestamp = new Date(`${formData.date}T${formData.time}`);
      
      const gameData = {
        title: formData.title,
        date: timestamp,
        location: formData.location,
        coordinates: coordinates, // Add coordinates
        maxPlayers: formData.maxPlayers,
        skillLevel: formData.skillLevel,
        description: formData.description,
        organizerId: auth.currentUser.uid,
        organizerEmail: auth.currentUser.email
      };
      
      await createGame(gameData);
      navigate('/games');
    } catch (error) {
      setError('Failed to create game: ' + error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="create-game-container">
      <h2>Create a New Game</h2>
      
      {error && <p className="error-message">{error}</p>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Game Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Casual Sunday Game"
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
            placeholder="Park or field name"
            required
          />
        </div>
        
        {formData.location && (
          <div className="location-preview">
            <h3>Location Preview</h3>
            <MapView address={formData.location} />
          </div>
        )}
        
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
            placeholder="Any additional details about the game"
            rows="3"
          />
        </div>
        
        <button type="submit" disabled={loading}>
          {loading ? 'Creating Game...' : 'Create Game'}
        </button>
      </form>
    </div>
  );
};

export default CreateGame;