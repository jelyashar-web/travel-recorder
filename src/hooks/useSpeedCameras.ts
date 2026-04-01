import { useState, useEffect, useCallback, useRef } from 'react';
import { GeoLocation } from '../types';

export interface SpeedCamera {
  id: string;
  lat: number;
  lon: number;
  type: 'fixed' | 'mobile' | 'redlight' | 'average';
  maxSpeed?: number;
  direction?: number;
  distance: number; // meters from current position
  bearing: number; // degrees from current position
}

interface UseSpeedCamerasProps {
  location: GeoLocation | null;
  enabled: boolean;
  searchRadius?: number; // meters, default 5000
}

// Overpass API query for speed cameras
const buildOverpassQuery = (lat: number, lon: number, radius: number) => `
  [out:json][timeout:25];
  (
    node["highway"="speed_camera"](around:${radius},${lat},${lon});
    node["enforcement"="speed"](around:${radius},${lat},${lon});
    node["enforcement"="maxspeed"](around:${radius},${lat},${lon});
    node["enforcement"="traffic_signals"](around:${radius},${lat},${lon});
    way["highway"="speed_camera"](around:${radius},${lat},${lon});
  );
  out body;
`;

// Calculate distance between two coordinates in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Calculate bearing between two coordinates
const calculateBearing = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
            Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return (θ * 180 / Math.PI + 360) % 360;
};

// Determine camera type from OSM tags
const getCameraType = (tags: Record<string, string>): SpeedCamera['type'] => {
  if (tags.enforcement === 'traffic_signals') return 'redlight';
  if (tags['speed_camera:type'] === 'average') return 'average';
  if (tags['speed_camera:type'] === 'mobile') return 'mobile';
  return 'fixed';
};

export function useSpeedCameras({
  location,
  enabled,
  searchRadius = 5000,
}: UseSpeedCamerasProps) {
  const [cameras, setCameras] = useState<SpeedCamera[]>([]);
  const [nearestCamera, setNearestCamera] = useState<SpeedCamera | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<{ lat: number; lon: number } | null>(null);
  const cacheRef = useRef<Map<string, SpeedCamera[]>>(new Map());

  const fetchCameras = useCallback(async (lat: number, lon: number) => {
    // Check if we already fetched recently (within 100m)
    if (lastFetchRef.current) {
      const dist = calculateDistance(
        lastFetchRef.current.lat, lastFetchRef.current.lon,
        lat, lon
      );
      if (dist < 100 && cacheRef.current.has(`${lat.toFixed(3)},${lon.toFixed(3)}`)) {
        return;
      }
    }

    // Check cache
    const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
    if (cacheRef.current.has(cacheKey)) {
      setCameras(cacheRef.current.get(cacheKey)!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const query = buildOverpassQuery(lat, lon, searchRadius);
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch camera data');
      }

      const data = await response.json();

      const processedCameras: SpeedCamera[] = data.elements
        .filter((el: { type: string }) => el.type === 'node')
        .map((el: { id: number; lat: number; lon: number; tags?: Record<string, string> }) => ({
          id: el.id.toString(),
          lat: el.lat,
          lon: el.lon,
          type: getCameraType(el.tags || {}),
          maxSpeed: el.tags?.['maxspeed'] ? parseInt(el.tags['maxspeed']) : undefined,
          direction: el.tags?.['direction'] ? parseInt(el.tags['direction']) : undefined,
          distance: calculateDistance(lat, lon, el.lat, el.lon),
          bearing: calculateBearing(lat, lon, el.lat, el.lon),
        }))
        .sort((a: SpeedCamera, b: SpeedCamera) => a.distance - b.distance);

      setCameras(processedCameras);
      cacheRef.current.set(cacheKey, processedCameras);
      lastFetchRef.current = { lat, lon };
    } catch (err) {
      console.error('Error fetching speed cameras:', err);
      setError('לא ניתן לטעון נתוני מצלמות');
    } finally {
      setIsLoading(false);
    }
  }, [searchRadius]);

  // Update nearest camera when location changes
  useEffect(() => {
    if (!location || !enabled) {
      setNearestCamera(null);
      return;
    }

    fetchCameras(location.latitude, location.longitude);

    // Find nearest camera in front of vehicle
    const relevantCameras = cameras.filter(cam => {
      // Only cameras within 1km
      if (cam.distance > 1000) return false;
      
      // Check if camera is roughly in front (within 60 degrees of heading)
      if (location.heading !== null && location.heading !== undefined) {
        const bearingDiff = Math.abs(cam.bearing - location.heading);
        const normalizedDiff = Math.min(bearingDiff, 360 - bearingDiff);
        return normalizedDiff < 60;
      }
      
      return true;
    });

    setNearestCamera(relevantCameras[0] || null);
  }, [location, cameras, enabled, fetchCameras]);

  // Periodic refresh
  useEffect(() => {
    if (!enabled || !location) return;

    const interval = setInterval(() => {
      fetchCameras(location.latitude, location.longitude);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [enabled, location, fetchCameras]);

  return {
    cameras,
    nearestCamera,
    isLoading,
    error,
    cameraCount: cameras.length,
  };
}
