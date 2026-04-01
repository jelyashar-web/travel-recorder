import { useState, useEffect, useCallback } from 'react';
import { Recording } from '../types';

export interface DrivingStats {
  // General stats
  totalRecordings: number;
  totalDrivingTime: number; // in seconds
  totalDistance: number; // in km (estimated)
  
  // Speed stats
  avgSpeed: number;
  maxSpeed: number;
  speedingEvents: number;
  
  // Time stats
  totalRecordingTime: number;
  longestRecording: number;
  
  // Weekly stats
  thisWeekRecordings: number;
  thisWeekDrivingTime: number;
  thisWeekDistance: number;
  
  // Emergency stats
  emergencyRecordings: number;
  
  // History for charts
  dailyStats: DailyStat[];
}

export interface DailyStat {
  date: string;
  recordings: number;
  drivingTime: number;
  avgSpeed: number;
  maxSpeed: number;
}

const STORAGE_KEY = 'dashcam-statistics';

export function useStatistics(recordings: Recording[], speedLimit: number) {
  const [stats, setStats] = useState<DrivingStats>({
    totalRecordings: 0,
    totalDrivingTime: 0,
    totalDistance: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    speedingEvents: 0,
    totalRecordingTime: 0,
    longestRecording: 0,
    thisWeekRecordings: 0,
    thisWeekDrivingTime: 0,
    thisWeekDistance: 0,
    emergencyRecordings: 0,
    dailyStats: []
  });

  const calculateStats = useCallback(() => {
    if (recordings.length === 0) return;

    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    // Calculate basic stats
    let totalSpeed = 0;
    let speedCount = 0;
    let maxSpeed = 0;
    let speedingEvents = 0;
    let totalDrivingTime = 0;
    let longestRecording = 0;
    let emergencyCount = 0;

    // Daily stats map
    const dailyMap = new Map<string, {
      recordings: number;
      drivingTime: number;
      speeds: number[];
      maxSpeed: number;
    }>();

    // Weekly stats
    let weekRecordings = 0;
    let weekDrivingTime = 0;

    recordings.forEach(recording => {
      const date = new Date(recording.timestamp);
      const dateKey = date.toISOString().split('T')[0];
      
      // Recording time
      totalDrivingTime += recording.duration / 1000;
      if (recording.duration > longestRecording) {
        longestRecording = recording.duration;
      }

      // Emergency count
      if (recording.isEmergency) {
        emergencyCount++;
      }

      // Weekly stats
      if (recording.timestamp >= oneWeekAgo) {
        weekRecordings++;
        weekDrivingTime += recording.duration / 1000;
      }

      // Speed analysis
      if (recording.location?.speed) {
        const speed = recording.location.speed;
        totalSpeed += speed;
        speedCount++;
        if (speed > maxSpeed) maxSpeed = speed;
        if (speed > speedLimit) speedingEvents++;
      }

      // Daily aggregation
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { recordings: 0, drivingTime: 0, speeds: [], maxSpeed: 0 });
      }
      const day = dailyMap.get(dateKey)!;
      day.recordings++;
      day.drivingTime += recording.duration / 1000;
      if (recording.location?.speed) {
        day.speeds.push(recording.location.speed);
        if (recording.location.speed > day.maxSpeed) {
          day.maxSpeed = recording.location.speed;
        }
      }
    });

    // Calculate daily stats array (last 14 days)
    const dailyStats: DailyStat[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * oneDay);
      const key = d.toISOString().split('T')[0];
      const day = dailyMap.get(key);
      
      dailyStats.push({
        date: key,
        recordings: day?.recordings || 0,
        drivingTime: day?.drivingTime || 0,
        avgSpeed: day?.speeds.length 
          ? Math.round(day.speeds.reduce((a, b) => a + b, 0) / day.speeds.length)
          : 0,
        maxSpeed: day?.maxSpeed || 0
      });
    }

    // Estimated distance (avg speed * time)
    const avgSpeed = speedCount > 0 ? Math.round(totalSpeed / speedCount) : 0;
    const totalDistance = avgSpeed > 0 
      ? Math.round((totalDrivingTime / 3600) * avgSpeed * 10) / 10
      : 0;

    const newStats: DrivingStats = {
      totalRecordings: recordings.length,
      totalDrivingTime,
      totalDistance,
      avgSpeed,
      maxSpeed,
      speedingEvents,
      totalRecordingTime: totalDrivingTime,
      longestRecording,
      thisWeekRecordings: weekRecordings,
      thisWeekDrivingTime: weekDrivingTime,
      thisWeekDistance: avgSpeed > 0 
        ? Math.round((weekDrivingTime / 3600) * avgSpeed * 10) / 10
        : 0,
      emergencyRecordings: emergencyCount,
      dailyStats
    };

    setStats(newStats);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...newStats,
      lastUpdated: Date.now()
    }));
  }, [recordings, speedLimit]);

  // Calculate stats when recordings change
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Format time helper
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}ש ${mins}ד`;
    return `${mins} דקות`;
  };

  // Export stats
  const exportStats = useCallback(() => {
    const data = {
      ...stats,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashcam-stats-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats]);

  // Reset stats
  const resetStats = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStats({
      totalRecordings: 0,
      totalDrivingTime: 0,
      totalDistance: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      speedingEvents: 0,
      totalRecordingTime: 0,
      longestRecording: 0,
      thisWeekRecordings: 0,
      thisWeekDrivingTime: 0,
      thisWeekDistance: 0,
      emergencyRecordings: 0,
      dailyStats: []
    });
  }, []);

  return {
    stats,
    formatDuration,
    exportStats,
    resetStats
  };
}
