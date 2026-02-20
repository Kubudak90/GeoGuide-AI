import { useState, useEffect, useCallback } from 'react';
import { PlaceDetails } from '../types';

interface UseFavoritesReturn {
  favorites: PlaceDetails[];
  toggleFavorite: (place: PlaceDetails) => void;
  isFavorite: (place: PlaceDetails) => boolean;
}

export const useFavorites = (): UseFavoritesReturn => {
  const [favorites, setFavorites] = useState<PlaceDetails[]>(() => {
    try {
      const saved = localStorage.getItem('favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((place: PlaceDetails) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.name === place.name);
      if (exists) {
        return prev.filter((p) => p.name !== place.name);
      }
      return [...prev, place];
    });
  }, []);

  const isFavorite = useCallback(
    (place: PlaceDetails) => favorites.some((p) => p.name === place.name),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
};
