import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../../services/gameService';
import { auth } from '../../config/firebase';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from '@reach/combobox';
import '@reach/combobox/styles.css';

const libraries = ['places'];
const mapContainerStyle = {
  width: '100%',
  height: '300px',
  marginBottom: '20px',
};

const CreateGame = () => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    coordinates: null,
    maxPlayers: 10,
    skillLevel: 'all',
    description: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 33.8366, lng: -117.9143 }); // Default to Buena Park
  const navigate = useNavigate();
  
  // Load Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'maxPlayers' ? parseInt(value) : value
    });
  };
  
  const onMapClick = useCallback((event) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat: event.latLng.lat(), lng: event.latLng.lng() } }, (results, status) => {
      if (status === "OK" && results[0]) {
        setFormData({
          ...formData,
          location: results[0].formatted_address,
          coordinates: {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
          }
        });
      }
    });
  }, [formData]);
  
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
    
    if (!formData.coordinates) {
      setError('Please select a location on the map');
      setLoading(false);
      return;
    }
    
    try {
      // Combine date and time into a single timestamp
      const timestamp = new Date(`${formData.date}T${formData.time}`);
      
      const gameData = {
        title: formData.title,
        date: timestamp,
        location: formData.location,
        coordinates: formData.coordinates,
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

  // Places Autocomplete component
  const PlacesAutocomplete = () => {
    const {
      ready,
      value,
      suggestions: { status, data },
      setValue,
      clearSuggestions,
    } = usePlacesAutocomplete({
      requestOptions: {
        componentRestrictions: { country: 'us' },
        types: ['park', 'establishment']
      },
      debounce: 300,
    });

    const handleInput = (e) => {
      setValue(e.target.value);
    };

    const handleSelect = async (address) => {
      setValue(address, false);
      clearSuggestions();

      try {
        const results = await getGeocode({ address });
        const { lat, lng } = await getLatLng(results[0]);
        setFormData({
          ...formData,
          location: address,
          coordinates: { lat, lng }
        });
        setMapCenter({ lat, lng });
      } catch (error) {
        console.error("Error selecting location:", error);
      }
    };

    return (
      <div className="places-autocomplete">
        <Combobox onSelect={handleSelect}>
          <ComboboxInput
            value={value || formData.location}
            onChange={handleInput}
            disabled={!ready}
            placeholder="Search for parks or soccer fields"
            className="location-input"
          />
          <ComboboxPopover>
            <ComboboxList>
              {status === "OK" &&
                data.map(({ id, description }) => (
                  <ComboboxOption key={id} value={description} />
                ))}
            </ComboboxList>
          </ComboboxPopover>
        </Combobox>
      </div>
    );
  };
  
  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading maps...</div>;
  
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
          <PlacesAutocomplete />
          <div className="map-container">
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              zoom={14}
              center={mapCenter}
              onClick={onMapClick}
            >
              {formData.coordinates && (
                <Marker position={formData.coordinates} />
              )}
            </GoogleMap>
            <p className="map-help">Click on the map to set the game location or search above</p>
          </div>
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