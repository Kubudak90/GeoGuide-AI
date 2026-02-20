import { useState, useEffect } from 'react';
import { Coordinates } from '../types';

interface UseLocationReturn {
  location: Coordinates | undefined;
  locationError: string | null;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<Coordinates | undefined>(undefined);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationError(null);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('Failed to get location');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return { location, locationError };
};
