import { useState, useEffect, useCallback, useRef } from 'react';
import { GeoLocation } from '../types';

export function useLocation() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Браузер не поддерживает GPS');
      return;
    }

    setError(null);
    setIsTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        // Обновлять местоположение только раз в секунду
        if (now - lastUpdateRef.current < 1000) return;
        lastUpdateRef.current = now;

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          altitude: position.coords.altitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed ? position.coords.speed * 3.6 : null, // конвертация в км/ч
          heading: position.coords.heading,
          timestamp: position.timestamp,
        });
      },
      (err) => {
        setError('Ошибка доступа к местоположению: ' + err.message);
        setIsTracking(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking,
  };
}
