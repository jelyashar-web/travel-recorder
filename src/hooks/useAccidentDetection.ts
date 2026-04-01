import { useState, useEffect, useCallback, useRef } from 'react';
import { AccidentData, AppSettings, GeoLocation } from '../types';

const SENSITIVITY_THRESHOLDS = {
  low: 25,     // m/s²
  medium: 20,
  high: 15,
};

interface UseAccidentDetectionProps {
  settings: AppSettings;
  location: GeoLocation | null;
  onAccident: (data: AccidentData) => void;
}

export function useAccidentDetection({ settings, location, onAccident }: UseAccidentDetectionProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastAcceleration, setLastAcceleration] = useState({ x: 0, y: 0, z: 0 });
  const lastAlertRef = useRef<number>(0);
  const locationRef = useRef<GeoLocation | null>(location);

  // Keep location ref up to date
  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!settings.accidentDetection) return;

    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;

    const { x, y, z } = acceleration;
    setLastAcceleration({ x: x || 0, y: y || 0, z: z || 0 });

    const magnitude = Math.sqrt(
      Math.pow(x || 0, 2) + 
      Math.pow(y || 0, 2) + 
      Math.pow(z || 0, 2)
    );

    const threshold = SENSITIVITY_THRESHOLDS[settings.accidentSensitivity];
    const now = Date.now();

    // Check 5 seconds passed since last alert
    if (magnitude > threshold && now - lastAlertRef.current > 5000) {
      lastAlertRef.current = now;
      
      const severity: AccidentData['severity'] = 
        magnitude > threshold + 10 ? 'high' : 
        magnitude > threshold + 5 ? 'medium' : 'low';

      onAccident({
        timestamp: now,
        location: locationRef.current, // Use current location from ref
        acceleration: { x: x || 0, y: y || 0, z: z || 0 },
        severity,
      });
    }
  }, [settings.accidentDetection, settings.accidentSensitivity, onAccident]);

  const startMonitoring = useCallback(() => {
    if (typeof window !== 'undefined' && 'DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', handleMotion);
      setIsMonitoring(true);
    }
  }, [handleMotion]);

  const stopMonitoring = useCallback(() => {
    window.removeEventListener('devicemotion', handleMotion);
    setIsMonitoring(false);
  }, [handleMotion]);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    isMonitoring,
    lastAcceleration,
    startMonitoring,
    stopMonitoring,
  };
}

export type { UseAccidentDetectionProps };
