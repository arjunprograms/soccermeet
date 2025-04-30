import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '8px'
};

const defaultCenter = {
  lat: 34.0522, // Default to Los Angeles
  lng: -118.2437
};

function MapView({ location, address }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyDHnJPix7q53OnUaO5F4YEh-i_0QV0Y0wQ"
  });

  const [map, setMap] = React.useState(null);
  const [center, setCenter] = React.useState(defaultCenter);

  React.useEffect(() => {
    // If a location object is provided with coordinates
    if (location && location.lat && location.lng) {
      setCenter({ lat: location.lat, lng: location.lng });
      return;
    }
    
    // If an address string is provided, geocode it
    if (address && isLoaded && window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) {
          const { lat, lng } = results[0].geometry.location;
          setCenter({ lat: lat(), lng: lng() });
        }
      });
    }
  }, [location, address, isLoaded]);

  const onLoad = React.useCallback(function callback(map) {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(function callback(map) {
    setMap(null);
  }, []);

  return isLoaded ? (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Marker position={center} />
      </GoogleMap>
    </div>
  ) : <div className="loading-map">Loading map...</div>;
}

export default React.memo(MapView);