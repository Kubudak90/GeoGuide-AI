import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import MapView from './components/MapView';
import { MapChunk, Coordinates, PlaceDetails } from './types';
import { getDirections, RouteData } from './services/mapService';

const App: React.FC = () => {
  const [mapChunks, setMapChunks] = useState<MapChunk[]>([]);
  const [location, setLocation] = useState<Coordinates | undefined>(undefined);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Lifted State
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  // Initialize Location on Mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
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
        }
      );
    } else {
      setLocationError("Unsupported");
    }
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
    <div className="relative w-full h-screen overflow-hidden bg-gray-100 font-sans">

      {/* Background Layer: Interactive Map */}
      <div className="absolute inset-0 z-0">
        <MapView
          mapChunks={mapChunks}
          userLocation={location}
          selectedPlace={selectedPlace}
          onSelectPlace={setSelectedPlace}
          routeData={routeData}
        />
      </div>

      {/* Foreground Layer: Chat Interface */}
      {/* Chat is absolutely positioned on top of the map */}
      <ChatInterface
        onMapChunksUpdate={setMapChunks}
        userLocation={location}
        locationError={locationError}
        selectedPlace={selectedPlace}
        onNavigate={() => selectedPlace && handleNavigate(selectedPlace)}
      />

    </div>
  );
};

export default App;
