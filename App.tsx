import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import { MapChunk, Coordinates, PlaceDetails } from './types';
import { getDirections, RouteData } from './services/mapService';

const App: React.FC = () => {
  const [mapChunks, setMapChunks] = useState<MapChunk[]>([]);
  const [location, setLocation] = useState<Coordinates | undefined>(undefined);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Lifted State
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [favorites, setFavorites] = useState<PlaceDetails[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (place: PlaceDetails) => {
    setFavorites(prev => {
      const exists = prev.some(p => p.name === place.name); // Simple check by name for now
      if (exists) {
        return prev.filter(p => p.name !== place.name);
      } else {
        return [...prev, place];
      }
    });
  };

  const isFavorite = (place: PlaceDetails) => {
    return favorites.some(p => p.name === place.name);
  };

  // Initialize Location Watch on Mount
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationError("Unsupported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationError(null);
      },
      (error) => {
        console.warn("Location access denied or failed", error);
        setLocationError("Access denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  const handleNavigate = async (place: PlaceDetails) => {
    if (!location) {
      alert("Please enable location services to use navigation.");
      return;
    }

    const route = await getDirections(location, {
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng
    });

    if (route) {
      setRouteData(route);
    } else {
      alert("Could not find a route.");
    }
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-gray-100 font-sans">
      <ChatInterface
        onMapChunksUpdate={setMapChunks}
        userLocation={location}
        locationError={locationError}
        selectedPlace={selectedPlace}
        onNavigate={() => selectedPlace && handleNavigate(selectedPlace)}
        // Pass map state to ChatInterface
        mapChunks={mapChunks}
        routeData={routeData}
        onSelectPlace={setSelectedPlace}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
      />
    </div>
  );
};

export default App;
