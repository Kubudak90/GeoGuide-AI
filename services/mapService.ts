import { Coordinates } from '../types';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

export interface RouteData {
    geometry: any; // GeoJSON geometry
    duration: number; // seconds
    distance: number; // meters
}

export const getDirections = async (start: Coordinates, end: Coordinates): Promise<RouteData | null> => {
    try {
        const startStr = `${start.longitude},${start.latitude}`;
        const endStr = `${end.longitude},${end.latitude}`;

        // Using OSRM public demo server (free, no key required)
        // Note: MapTiler routing requires a specific plan/endpoint.
        const url = `https://router.project-osrm.org/route/v1/driving/${startStr};${endStr}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error("Routing request failed", response.statusText);
            return null;
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                geometry: route.geometry,
                duration: route.duration,
                distance: route.distance
            };
        }

        return null;
    } catch (error) {
        console.error("Error fetching directions:", error);
        return null;
    }
};
