import React, { useEffect, useRef, useState } from 'react';
// import maplibregl from 'maplibre-gl'; // Using CDN
const maplibregl = (window as any).maplibregl;
import { MapChunk, PlaceDetails, Coordinates } from '../types';
import { RouteData } from '../services/mapService';
import PlaceDetailCard from './PlaceDetailCard';
import { AlertTriangle, Map as MapIcon, Car, Layers } from 'lucide-react';

interface MapViewProps {
  mapChunks: MapChunk[];
  userLocation?: Coordinates;
  selectedPlace: PlaceDetails | null;
  onSelectPlace: (place: PlaceDetails | null) => void;
  routeData: RouteData | null;
  onNavigate?: (place: PlaceDetails) => void;
}

// User provided MapTiler Key
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

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

  // 1. Initialize MapLibre Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const maplibregl = (window as any).maplibregl;
    if (!maplibregl) {
      console.error("MapLibre not found on window");
      setError("MapLibre library not found");
      return;
    }

    const defaultCenter: [number, number] = userLocation
      ? [userLocation.longitude, userLocation.latitude]
      : [-122.4194, 37.7749];

    try {
      console.log("Initializing Map...");
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`,
        center: defaultCenter,
        zoom: 12,
        attributionControl: false
      });

      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right');

      map.on('load', () => {
        console.log("Map loaded successfully");
        setIsMapLoaded(true);
      });

      map.on('error', (e: any) => {
        console.error("Map Error:", e);
        setError("Map error: " + (e.error?.message || "Unknown error"));
      });

      mapInstanceRef.current = map;

    } catch (e: any) {
      console.error("Error creating map:", e);
      setError("Failed to create map: " + e.message);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Handle Grounding Updates (Geocode & Place Markers)
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
          const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_KEY}&limit=1`);
          const data = await response.json();

          if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const [lng, lat] = feature.center;

            const place: PlaceDetails = {
              id: feature.id,
              name: chunk.title,
              formatted_address: feature.place_name || chunk.address || '',
              geometry: {
                location: { lat, lng }
              },
              website: chunk.uri
            };

            const el = document.createElement('div');
            el.className = 'marker';
            el.innerHTML = `
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#EA4335" stroke="#B31412" stroke-width="1"/>
                        <circle cx="12" cy="9" r="2.5" fill="white"/>
                      </svg>
                    `;
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.cursor = 'pointer';

            const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
              .setLngLat([lng, lat])
              .addTo(mapInstanceRef.current!);

            el.addEventListener('click', (e) => {
              e.stopPropagation();
              onSelectPlace(place);
              mapInstanceRef.current?.flyTo({
                center: [lng, lat],
                zoom: 15,
                essential: true
              });
            });

            markersRef.current.push(marker);
            bounds.extend([lng, lat]);
            hasPoints = true;
          }
        } catch (err) {
          console.warn(`Failed to geocode ${query}:`, err);
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

  // 3. Handle Route Display
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded || !routeData) return;

    const map = mapInstanceRef.current;

    if (map.getSource('route')) {
      (map.getSource('route') as any).setData(routeData.geometry);
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: routeData.geometry
      });

      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 6,
          'line-opacity': 0.8
        }
      });
    }

    // Fit bounds to route
    const coordinates = routeData.geometry.coordinates;
    const bounds = coordinates.reduce((bounds: any, coord: any) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
      padding: 50
    });

  }, [routeData, isMapLoaded]);

  // 4. Handle Traffic Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    const map = mapInstanceRef.current;
    const TOMTOM_KEY = import.meta.env.VITE_TOMTOM_KEY;

    if (showTraffic) {
      if (!TOMTOM_KEY) {
        console.warn("TomTom API Key missing for traffic layer");
        return;
      }

      if (!map.getSource('traffic-flow')) {
        // Add TomTom Traffic Flow Source
        map.addSource('traffic-flow', {
          type: 'raster',
          tiles: [
            `https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`
          ],
          tileSize: 256
        });

        // Add Layer
        map.addLayer({
          id: 'traffic-flow-layer',
          type: 'raster',
          source: 'traffic-flow',
          minzoom: 6,
          maxzoom: 22,
          paint: {
            'raster-opacity': 0.7
          }
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
    <div className="absolute inset-0 w-full h-full bg-gray-100">
      {/* Map Container */}
      {!error && <div ref={mapContainerRef} className="w-full h-full" />}

      {/* Map Controls */}
      <div className="absolute top-4 right-14 flex flex-col gap-2 z-10">
        <button
          onClick={() => setShowTraffic(!showTraffic)}
          className={`p-2 rounded-lg shadow-md transition-colors ${showTraffic ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
          title="Toggle Traffic"
        >
          <Car size={20} />
        </button>
      </div>

      {/* Loading State */}
      {!isMapLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 pointer-events-none">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          <span className="ml-2 text-gray-500 font-medium">Loading Map...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10 p-8">
          <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-lg max-w-md text-center border border-gray-200 relative z-20">
            <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-2">Map Unavailable</h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {error}
            </p>
          </div>
        </div>
      )}

      {selectedPlace && (
        <PlaceDetailCard
          place={selectedPlace}
          onClose={() => onSelectPlace(null)}
          onNavigate={() => onNavigate && onNavigate(selectedPlace)}
        />
      )}
    </div>
  );
};

export default MapView;
