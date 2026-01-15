import { Coordinates } from '../types';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';

export interface RouteData {
    geometry: any; // GeoJSON geometry
    duration: number; // seconds
    distance: number; // meters
}

// Wikipedia photo cache
const photoCache = new Map<string, string | null>();

export const getWikipediaPhoto = async (placeName: string): Promise<string | null> => {
    // Check cache first
    if (photoCache.has(placeName)) {
        return photoCache.get(placeName) || null;
    }

    try {
        // Search Wikipedia for the place
        const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&format=json&origin=*`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (!searchData.query?.search?.length) {
            photoCache.set(placeName, null);
            return null;
        }

        const pageTitle = searchData.query.search[0].title;

        // Get page images
        const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=600&origin=*`;
        const imageResponse = await fetch(imageUrl);
        const imageData = await imageResponse.json();

        const pages = imageData.query?.pages;
        if (!pages) {
            photoCache.set(placeName, null);
            return null;
        }

        const page = Object.values(pages)[0] as any;
        const thumbnail = page?.thumbnail?.source || null;

        photoCache.set(placeName, thumbnail);
        return thumbnail;
    } catch (error) {
        console.error("Error fetching Wikipedia photo:", error);
        photoCache.set(placeName, null);
        return null;
    }
};

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
