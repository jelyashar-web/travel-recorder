import { useState, useEffect, useCallback, useRef } from 'react';
import { Recording } from '../types';

const DB_NAME = 'TravelRecorderDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

export function useRecordingStorage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          setError('Failed to open database');
          setIsLoading(false);
        };

        request.onsuccess = () => {
          dbRef.current = request.result;
          loadRecordings();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('isEmergency', 'isEmergency', { unique: false });
          }
        };
      } catch (err) {
        setError('Database initialization failed');
        setIsLoading(false);
      }
    };

    initDB();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  // Load all recordings
  const loadRecordings = useCallback(async () => {
    if (!dbRef.current) return;

    try {
      setIsLoading(true);
      const transaction = dbRef.current.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.index('timestamp').openCursor(null, 'prev');

      const loaded: Recording[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          loaded.push(cursor.value);
          cursor.continue();
        } else {
          setRecordings(loaded);
          setIsLoading(false);
        }
      };

      request.onerror = () => {
        setError('Failed to load recordings');
        setIsLoading(false);
      };
    } catch (err) {
      setError('Failed to load recordings');
      setIsLoading(false);
    }
  }, []);

  // Save recording
  const saveRecording = useCallback(async (recording: Recording): Promise<boolean> => {
    if (!dbRef.current) {
      console.error('Database not initialized');
      return false;
    }

    try {
      return new Promise((resolve) => {
        const transaction = dbRef.current!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Store the recording data
        const request = store.put(recording);

        request.onsuccess = () => {
          setRecordings(prev => [recording, ...prev]);
          resolve(true);
        };

        request.onerror = () => {
          setError('Failed to save recording');
          resolve(false);
        };
      });
    } catch (err) {
      setError('Failed to save recording');
      return false;
    }
  }, []);

  // Delete recording
  const deleteRecording = useCallback(async (id: string): Promise<boolean> => {
    if (!dbRef.current) return false;

    try {
      return new Promise((resolve) => {
        const transaction = dbRef.current!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        const request = store.delete(id);

        request.onsuccess = () => {
          setRecordings(prev => {
            const recording = prev.find(r => r.id === id);
            if (recording) {
              URL.revokeObjectURL(recording.url);
            }
            return prev.filter(r => r.id !== id);
          });
          resolve(true);
        };

        request.onerror = () => {
          resolve(false);
        };
      });
    } catch (err) {
      return false;
    }
  }, []);

  // Clear old recordings (keep only last N or within X days)
  const clearOldRecordings = useCallback(async (maxCount?: number, maxAgeDays?: number): Promise<number> => {
    if (!dbRef.current) return 0;

    try {
      const now = Date.now();
      const maxAge = maxAgeDays ? maxAgeDays * 24 * 60 * 60 * 1000 : null;
      
      const toDelete: string[] = [];
      
      recordings.forEach((rec, index) => {
        // Skip emergency recordings
        if (rec.isEmergency) return;
        
        // Check age
        if (maxAge && (now - rec.timestamp) > maxAge) {
          toDelete.push(rec.id);
          return;
        }
        
        // Check count
        if (maxCount && index >= maxCount) {
          toDelete.push(rec.id);
        }
      });

      // Delete in parallel
      await Promise.all(toDelete.map(id => deleteRecording(id)));
      
      return toDelete.length;
    } catch (err) {
      return 0;
    }
  }, [recordings, deleteRecording]);

  // Get storage stats
  const getStorageStats = useCallback(() => {
    const totalSize = recordings.reduce((acc, rec) => acc + (rec.blob?.size || 0), 0);
    const emergencyCount = recordings.filter(r => r.isEmergency).length;
    const uploadedCount = recordings.filter(r => r.uploaded).length;

    return {
      count: recordings.length,
      emergencyCount,
      uploadedCount,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    };
  }, [recordings]);

  return {
    recordings,
    isLoading,
    error,
    saveRecording,
    deleteRecording,
    loadRecordings,
    clearOldRecordings,
    getStorageStats,
  };
}
