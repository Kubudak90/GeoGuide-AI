import React, { useState, useCallback } from 'react';
import ChatInterface from './components/ChatInterface';
import { MapChunk, PlaceDetails } from './types';
import { getDirections, RouteData } from './services/mapService';
import { useLocation } from './hooks/useLocation';
import { useFavorites } from './hooks/useFavorites';
import { useToast } from './contexts/ToastContext';
import { useTranslation } from './i18n';
import { TransportMode } from './components/RouteInfoPanel';

const App: React.FC = () => {
  const [mapChunks, setMapChunks] = useState<MapChunk[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');

  const { location, locationError } = useLocation();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { showToast } = useToast();
  const { t } = useTranslation();

  const handleToggleFavorite = useCallback((place: PlaceDetails) => {
    const wasFavorite = isFavorite(place);
    toggleFavorite(place);
    showToast(
      wasFavorite ? t('removed_from_favorites') : t('added_to_favorites'),
      wasFavorite ? 'info' : 'success'
    );
  }, [toggleFavorite, isFavorite, showToast, t]);

  const handleNavigate = useCallback(async (place: PlaceDetails) => {
    if (!location) {
      showToast(t('enable_location'), 'warning');
      return;
    }

    const route = await getDirections(
      location,
      { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng },
      transportMode
    );

    if (route) {
      setRouteData(route);
      showToast(t('route_calculated'), 'success');
    } else {
      showToast(t('route_not_found'), 'error');
    }
  }, [location, transportMode, showToast, t]);

  const handleModeChange = useCallback(async (mode: TransportMode) => {
    setTransportMode(mode);
    if (selectedPlace && location) {
      const route = await getDirections(
        location,
        { latitude: selectedPlace.geometry.location.lat, longitude: selectedPlace.geometry.location.lng },
        mode
      );
      if (route) {
        setRouteData(route);
      }
    }
  }, [selectedPlace, location]);

  const handleCancelRoute = useCallback(() => {
    setRouteData(null);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-gray-100 dark:bg-gray-950 font-sans">
      <ChatInterface
        onMapChunksUpdate={setMapChunks}
        userLocation={location}
        locationError={locationError}
        selectedPlace={selectedPlace}
        onNavigate={() => selectedPlace && handleNavigate(selectedPlace)}
        mapChunks={mapChunks}
        routeData={routeData}
        onSelectPlace={setSelectedPlace}
        favorites={favorites}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={isFavorite}
        transportMode={transportMode}
        onModeChange={handleModeChange}
        onCancelRoute={handleCancelRoute}
      />
    </div>
  );
};

export default App;
