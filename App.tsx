import React, { useState, useCallback, useRef } from 'react';
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
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const { location, locationError } = useLocation();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { showToast } = useToast();
  const { t } = useTranslation();

  // Use refs for values needed in stable callbacks to avoid stale closures
  const selectedPlaceRef = useRef(selectedPlace);
  selectedPlaceRef.current = selectedPlace;
  const transportModeRef = useRef(transportMode);
  transportModeRef.current = transportMode;
  const locationRef = useRef(location);
  locationRef.current = location;

  const handleToggleFavorite = useCallback((place: PlaceDetails) => {
    const wasFavorite = isFavorite(place);
    toggleFavorite(place);
    showToast(
      wasFavorite ? t('removed_from_favorites') : t('added_to_favorites'),
      wasFavorite ? 'info' : 'success'
    );
  }, [toggleFavorite, isFavorite, showToast, t]);

  // Stable callback - reads latest state from refs
  const handleNavigate = useCallback(async () => {
    const place = selectedPlaceRef.current;
    const loc = locationRef.current;
    if (!place) return;
    if (!loc) {
      showToast(t('enable_location'), 'warning');
      return;
    }

    setIsRouteLoading(true);
    const route = await getDirections(
      loc,
      { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng },
      transportModeRef.current
    );
    setIsRouteLoading(false);

    if (route) {
      setRouteData(route);
      showToast(t('route_calculated'), 'success');
    } else {
      showToast(t('route_not_found'), 'error');
    }
  }, [showToast, t]);

  const handleModeChange = useCallback(async (mode: TransportMode) => {
    setTransportMode(mode);
    const place = selectedPlaceRef.current;
    const loc = locationRef.current;
    if (place && loc) {
      setIsRouteLoading(true);
      const route = await getDirections(
        loc,
        { latitude: place.geometry.location.lat, longitude: place.geometry.location.lng },
        mode
      );
      setIsRouteLoading(false);
      if (route) {
        setRouteData(route);
      }
    }
  }, []);

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
        onNavigate={handleNavigate}
        mapChunks={mapChunks}
        routeData={routeData}
        isRouteLoading={isRouteLoading}
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
