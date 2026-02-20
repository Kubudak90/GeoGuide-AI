import { Coordinates } from '../types';

export interface RouteData {
    geometry: GeoJSON.LineString;
    duration: number; // seconds
    distance: number; // meters
}

type TransportProfile = 'driving' | 'walking' | 'cycling';

export const getDirections = async (
    start: Coordinates,
    end: Coordinates,
    mode: TransportProfile = 'driving'
): Promise<RouteData | null> => {
    try {
        const startStr = `${start.longitude},${start.latitude}`;
        const endStr = `${end.longitude},${end.latitude}`;

        // OSRM supports: car, foot, bike profiles
        const profileMap: Record<TransportProfile, string> = {
            driving: 'car',
            walking: 'foot',
            cycling: 'bike',
        };
        const profile = profileMap[mode] || 'car';

        const url = `https://router.project-osrm.org/route/v1/${profile}/${startStr};${endStr}?overview=full&geometries=geojson&alternatives=true`;

        const response = await fetch(url);
        if (!response.ok) {
            console.error('Routing request failed', response.statusText);
            return null;
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                geometry: route.geometry,
                duration: route.duration,
                distance: route.distance,
            };
        }

        return null;
    } catch (error) {
        console.error('Error fetching directions:', error);
        return null;
    }
};
