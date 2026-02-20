import React, { useEffect, useRef, useState, memo } from 'react';
const maplibregl = (window as any).maplibregl;
import { MapChunk, PlaceDetails, Coordinates } from '../types';
import { RouteData } from '../services/mapService';
import PlaceDetailCard from './PlaceDetailCard';
import { AlertTriangle, Car } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from '../i18n';
import { env } from '../utils/env';

interface MapViewProps {
  mapChunks: MapChunk[];
  userLocation?: Coordinates;
  selectedPlace: PlaceDetails | null;
  onSelectPlace: (place: PlaceDetails | null) => void;
  routeData: RouteData | null;
  onNavigate?: (place: PlaceDetails) => void;
}

const MAPTILER_KEY = env.VITE_MAPTILER_KEY;

// In-memory geocoding cache
const geocodeCache = new Map<string, { lng: number; lat: number; place_name: string; id: string }>();

const MapView: React.FC<MapViewProps> = ({
  mapChunks,
  userLocation,
  selectedPlace,
  onSelectPlace,
  routeData,
  onNavigate
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTraffic, setShowTraffic] = useState(false);

  const { isDark } = useTheme();
  const { t } = useTranslation();

  const mapStyle = isDark
    ? `https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_KEY}`
    : `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`;

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const ml = (window as any).maplibregl;
    if (!ml) {
      setError(t('maplibre_not_found'));
      return;
    }

    const defaultCenter: [number, number] = userLocation
      ? [userLocation.longitude, userLocation.latitude]
      : [-122.4194, 37.7749];

    try {
      const map = new ml.Map({
        container: mapContainerRef.current,
        style: mapStyle,
        center: defaultCenter,
        zoom: 12,
        attributionControl: false
      });

      map.addControl(new ml.NavigationControl(), 'top-right');
      map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => setIsMapLoaded(true));
      map.on('error', (e: any) => {
        setError(`${t('map_error')}: ${e.error?.message || 'Unknown'}`);
      });

      mapInstanceRef.current = map;
    } catch (e: any) {
      setError(`${t('failed_create_map')}: ${e.message}`);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map style on theme change
  useEffect(() => {
    if (mapInstanceRef.current && isMapLoaded) {
      mapInstanceRef.current.setStyle(mapStyle);
    }
  }, [isDark]);

  // Handle grounding updates - geocode & place markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded || mapChunks.length === 0) return;

    const fetchAndPlotPlaces = async () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      const bounds = new maplibregl.LngLatBounds();
      let hasPoints = false;

      for (const chunk of mapChunks) {
        const query = `${chunk.title} ${chunk.address || ''}`;

        try {
          let feature: { lng: number; lat: number; place_name: string; id: string };

          if (geocodeCache.has(query)) {
            feature = geocodeCache.get(query)!;
          } else {
            const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=1`);
            const data = await response.json();
            if (!data.features || data.features.length === 0) continue;
            const f = data.features[0];
            feature = { lng: f.center[0], lat: f.center[1], place_name: f.place_name, id: f.id };
            geocodeCache.set(query, feature);
          }

          const { lng, lat } = feature;

          const place: PlaceDetails = {
            id: feature.id,
            name: chunk.title,
            formatted_address: feature.place_name || chunk.address || '',
            geometry: { location: { lat, lng } },
            website: chunk.uri
          };

          const el = document.createElement('div');
          el.className = 'marker';
          el.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#EA4335" stroke="#B31412" stroke-width="1"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>`;
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.cursor = 'pointer';

          const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([lng, lat])
            .addTo(mapInstanceRef.current!);

          el.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectPlace(place);
            mapInstanceRef.current?.flyTo({ center: [lng, lat], zoom: 15, essential: true });
          });

          markersRef.current.push(marker);
          bounds.extend([lng, lat]);
          hasPoints = true;
        } catch {
          // Geocoding failed for this chunk
        }
      }

      if (hasPoints && mapInstanceRef.current) {
        mapInstanceRef.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 400 },
          maxZoom: 16
        });
      }
    };

    fetchAndPlotPlaces();
  }, [mapChunks, isMapLoaded, onSelectPlace]);

  // Handle route display
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded || !routeData) return;

    const map = mapInstanceRef.current;

    if (map.getSource('route')) {
      (map.getSource('route') as any).setData(routeData.geometry);
    } else {
      map.addSource('route', { type: 'geojson', data: routeData.geometry });
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3b82f6', 'line-width': 6, 'line-opacity': 0.8 }
      });
    }

    const coordinates = routeData.geometry.coordinates;
    const bounds = coordinates.reduce((b: any, coord: any) => b.extend(coord), new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    map.fitBounds(bounds, { padding: 50 });
  }, [routeData, isMapLoaded]);

  // Handle traffic layer
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    const map = mapInstanceRef.current;
    const TOMTOM_KEY = env.VITE_TOMTOM_KEY;

    if (showTraffic) {
      if (!TOMTOM_KEY) return;
      if (!map.getSource('traffic-flow')) {
        map.addSource('traffic-flow', {
          type: 'raster',
          tiles: [`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`],
          tileSize: 256
        });
        map.addLayer({
          id: 'traffic-flow-layer',
          type: 'raster',
          source: 'traffic-flow',
          minzoom: 6,
          maxzoom: 22,
          paint: { 'raster-opacity': 0.7 }
        });
      } else {
        map.setLayoutProperty('traffic-flow-layer', 'visibility', 'visible');
      }
    } else {
      if (map.getLayer('traffic-flow-layer')) {
        map.setLayoutProperty('traffic-flow-layer', 'visibility', 'none');
      }
    }
  }, [showTraffic, isMapLoaded]);

  return (
    <div className="absolute inset-0 w-full h-full bg-gray-100 dark:bg-gray-900" aria-label={t('interactive_map')}>
      {!error && <div ref={mapContainerRef} className="w-full h-full" />}

      {/* Map Controls */}
      <div className="absolute top-4 right-14 flex flex-col gap-2 z-10">
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`p-2 rounded-lg shadow-md transition-colors ${showTraffic ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          title={t('toggle_traffic')}
          aria-label={t('toggle_traffic')}
        >
          <Car size={20} />
        </button>
      </div>

      {/* Loading State */}
      {!isMapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10 pointer-events-none">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-2 text-gray-500 dark:text-gray-400 font-medium">{t('loading_map')}</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10 p-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-md text-center border border-gray-200 dark:border-gray-700 relative z-20">
            <div className="mx-auto w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-2">{t('map_unavailable')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {selectedPlace && (
        <PlaceDetailCard
          place={selectedPlace}
          onClose={() => onSelectPlace(null)}
          onNavigate={() => onNavigate && onNavigate(selectedPlace)}
          userLocation={userLocation}
        />
      )}
    </div>
  );
};

export default memo(MapView);
