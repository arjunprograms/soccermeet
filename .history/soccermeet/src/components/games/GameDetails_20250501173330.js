import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGame } from '../../services/gameService';
import { auth } from '../../config/firebase';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

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
  
  const handleLocationSelect = async (address) => {
    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      
      setFormData({
        ...formData,
        location: address,
        coordinates: { lat, lng }
      });
    } catch (error) {
      console.error("Error selecting location:", error);
    }
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
    
    if (!formData.coordinates) {
      setError('Please select a valid location on the map');
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
  
  // Rest of your code with added Google Maps components
  // ...
}