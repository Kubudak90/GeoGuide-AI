import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * @returns boolean indicating if user is online
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Internet connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.warn('⚠️ Lost internet connection');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
