export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  groundingMetadata?: GroundingMetadata;
  isLoading?: boolean;
  places?: Place[]; // New field for structured place data
}

export interface Place {
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  short_description: string;
  website: string | null;
  category: string;
}

export interface GroundingMetadata {
  searchChunks?: SearchChunk[];
  mapChunks?: MapChunk[];
}

export interface SearchChunk {
  uri: string;
  title: string;
  source?: string;
}

export interface MapChunk {
  uri: string;
  title: string;
  address?: string;
  snippet?: string;
  placeId?: string;
}

export enum ModelType {
  MAPS_SEARCH = 'gemini-2.5-flash',
  REASONING = 'gemini-3-pro-preview'
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Generic Place Types (replaces Google specific types)
export interface PlaceDetails {
  id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  // Optional fields that might not be available in simple geocoding
  rating?: number;
  user_ratings_total?: number;
  photos?: string[]; // Array of URLs
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    relative_time_description: string;
    profile_photo_url: string;
  }>;
  website?: string;
  price_level?: number;
  isOpenNow?: boolean; // Simplified from opening_hours method
}
