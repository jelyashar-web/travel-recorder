import { useState, useRef, useCallback, useEffect } from 'react';

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number];
  distance?: number;
  dangerLevel?: 'safe' | 'warning' | 'danger';
  approaching?: boolean; // Is object getting closer
  relativeSpeed?: number; // Relative speed in km/h
}

interface UseObjectDetectionProps {
  enabled: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onObjectDetected?: (objects: DetectedObject[]) => void;
  warningDistance?: number;
  dangerDistance?: number;
}

// Object dimensions in meters for distance estimation
const OBJECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  person: { width: 0.5, height: 1.7 },
  car: { width: 1.8, height: 1.5 },
  truck: { width: 2.5, height: 2.8 },
  bus: { width: 2.5, height: 3.0 },
  motorcycle: { width: 0.8, height: 1.2 },
  bicycle: { width: 0.6, height: 1.0 },
  'traffic light': { width: 0.3, height: 0.8 },
  'stop sign': { width: 0.6, height: 0.6 },
  // Scooter/E-scooter estimates
  scooter: { width: 0.5, height: 1.1 },
  'electric scooter': { width: 0.5, height: 1.1 },
};

// Focal length (calibrate per device ideally)
const FOCAL_LENGTH = 700;

// Track objects for speed calculation
interface TrackedObject {
  id: number;
  class: string;
  lastDistance: number;
  lastTimestamp: number;
  framesTracked: number;
}

// Dynamically import TensorFlow.js
let tfModule: typeof import('@tensorflow/tfjs') | null = null;
let cocoSsdModule: typeof import('@tensorflow-models/coco-ssd') | null = null;

async function loadTensorFlowModules() {
  if (!tfModule) {
    tfModule = await import('@tensorflow/tfjs');
  }
  if (!cocoSsdModule) {
    cocoSsdModule = await import('@tensorflow-models/coco-ssd');
  }
  return { tf: tfModule, cocoSsd: cocoSsdModule };
}

export function useObjectDetection({
  enabled,
  videoRef,
  canvasRef,
  onObjectDetected,
  warningDistance = 15,
  dangerDistance = 8,
}: UseObjectDetectionProps) {
  const [model, setModel] = useState<import('@tensorflow-models/coco-ssd').ObjectDetection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [fps, setFps] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef(Date.now());
  const frameCountRef = useRef(0);
  const trackedObjectsRef = useRef<Map<number, TrackedObject>>(new Map());
  const objectIdCounterRef = useRef(0);

  // Load the model
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    
    async function loadModel() {
      setIsLoading(true);
      try {
        const { tf, cocoSsd } = await loadTensorFlowModules();
        await tf.ready();
        
        // Use more accurate model
        const loadedModel = await cocoSsd.load({
          base: 'mobilenet_v2', // More accurate than lite_mobilenet_v2
        });
        
        if (!cancelled) {
          setModel(loadedModel);
          console.log('✅ ADAS AI model loaded successfully');
        }
      } catch (error) {
        console.error('Failed to load detection model:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  // Calculate distance using multiple methods for better accuracy
  const calculateDistance = useCallback((bbox: [number, number, number, number], className: string): number => {
    const [, , widthInPixels, heightInPixels] = bbox;
    const dims = OBJECT_DIMENSIONS[className] || { width: 1.5, height: 1.5 };
    
    // Calculate based on width
    const distanceFromWidth = (FOCAL_LENGTH * dims.width) / widthInPixels;
    
    // Calculate based on height
    const distanceFromHeight = (FOCAL_LENGTH * dims.height) / heightInPixels;
    
    // Average both methods for better accuracy
    const avgDistance = (distanceFromWidth + distanceFromHeight) / 2;
    
    // Clamp to realistic range
    return Math.max(1.5, Math.min(150, avgDistance));
  }, []);

  const getDangerLevel = useCallback((distance: number, relativeSpeed?: number): DetectedObject['dangerLevel'] => {
    // Adjust thresholds based on relative speed
    const effectiveDangerDist = relativeSpeed && relativeSpeed > 10 
      ? dangerDistance + (relativeSpeed * 0.3) 
      : dangerDistance;
    const effectiveWarningDist = relativeSpeed && relativeSpeed > 10 
      ? warningDistance + (relativeSpeed * 0.5) 
      : warningDistance;

    if (distance <= effectiveDangerDist) return 'danger';
    if (distance <= effectiveWarningDist) return 'warning';
    return 'safe';
  }, [dangerDistance, warningDistance]);

  // Track object and calculate relative speed
  const trackObject = useCallback((className: string, distance: number): { approaching: boolean; relativeSpeed: number } => {
    // Track by distance and class similarity
    const distanceTolerance = 5; // meters
    const now = Date.now();
    
    // Find existing tracked object by proximity
    let trackedObj: TrackedObject | undefined;
    
    for (const [, obj] of trackedObjectsRef.current) {
      if (obj.class === className && Math.abs(obj.lastDistance - distance) < distanceTolerance) {
        trackedObj = obj;
        break;
      }
    }
    
    if (!trackedObj) {
      // Create new tracked object
      const newId = objectIdCounterRef.current++;
      trackedObjectsRef.current.set(newId, {
        id: newId,
        class: className,
        lastDistance: distance,
        lastTimestamp: now,
        framesTracked: 1,
      });
      return { approaching: false, relativeSpeed: 0 };
    }
    
    // Calculate relative speed
    const timeDiff = (now - trackedObj.lastTimestamp) / 1000; // seconds
    const distanceDiff = trackedObj.lastDistance - distance; // meters (positive = getting closer)
    
    let relativeSpeed = 0;
    if (timeDiff > 0 && trackedObj.framesTracked > 3) {
      relativeSpeed = (distanceDiff / timeDiff) * 3.6; // Convert to km/h
    }
    
    const approaching = distanceDiff > 0.2; // Getting closer by more than 20cm
    
    // Update tracked object
    trackedObj.lastDistance = distance;
    trackedObj.lastTimestamp = now;
    trackedObj.framesTracked++;
    
    // Cleanup old tracked objects
    for (const [id, obj] of trackedObjectsRef.current) {
      if (now - obj.lastTimestamp > 5000) { // Remove if not seen for 5 seconds
        trackedObjectsRef.current.delete(id);
      }
    }
    
    return { approaching, relativeSpeed: Math.abs(relativeSpeed) };
  }, []);

  const detect = useCallback(async () => {
    if (!model || !videoRef.current || !canvasRef.current || !enabled) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.readyState !== 4) {
      animationRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      // Detect with higher confidence threshold for precision
      const predictions = await model.detect(video);
      
      // Extended list including scooters
      const relevantClasses = [
        'car', 'truck', 'bus', 'person', 'motorcycle', 'bicycle', 
        'traffic light', 'stop sign'
      ];
      
      // Also check for scooter-like objects (often detected as motorcycle or person)
      const processedObjects: DetectedObject[] = predictions
        .filter(pred => {
          // High confidence threshold for precision
          if (pred.score < 0.6) return false;
          
          // Check if it's a relevant class
          if (relevantClasses.includes(pred.class)) return true;
          
          // Scooter detection: small motorcycle with high aspect ratio
          if (pred.class === 'motorcycle' || pred.class === 'person') {
            const [, , width, height] = pred.bbox;
            const aspectRatio = height / width;
            // Scooters/personal mobility devices have specific aspect ratios
            if (aspectRatio > 1.5 && aspectRatio < 3 && pred.score > 0.65) {
              return true;
            }
          }
          
          return false;
        })
        .map(pred => {
          const distance = calculateDistance(pred.bbox, pred.class);
          const { approaching, relativeSpeed } = trackObject(pred.class, distance);
          
          return {
            class: pred.class === 'motorcycle' && distance < 8 ? 'scooter' : pred.class,
            score: pred.score,
            bbox: pred.bbox,
            distance,
            dangerLevel: getDangerLevel(distance, relativeSpeed),
            approaching,
            relativeSpeed,
          };
        })
        .sort((a, b) => (a.distance || 150) - (b.distance || 150));

      setDetectedObjects(processedObjects);
      onObjectDetected?.(processedObjects);

      // Draw on canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        processedObjects.forEach((obj, index) => {
          const [x, y, width, height] = obj.bbox;
          
          // Color scheme based on danger
          let color = '#22c55e'; // Green - safe
          let lineWidth = 2;
          let glowColor = 'rgba(34, 197, 94, 0.5)';
          
          if (obj.dangerLevel === 'warning') {
            color = '#f59e0b'; // Orange
            lineWidth = 3;
            glowColor = 'rgba(245, 158, 11, 0.5)';
          } else if (obj.dangerLevel === 'danger') {
            color = '#ef4444'; // Red
            lineWidth = 4;
            glowColor = 'rgba(239, 68, 68, 0.5)';
          }

          // Draw glow effect for danger
          if (obj.dangerLevel !== 'safe') {
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 20;
          }

          // Draw bounding box with rounded corners
          ctx.strokeStyle = color;
          ctx.lineWidth = lineWidth;
          ctx.lineJoin = 'round';
          ctx.strokeRect(x, y, width, height);
          ctx.shadowBlur = 0;

          // Draw label background
          const label = obj.class === 'scooter' ? 'קורקינט' : 
                       obj.class === 'motorcycle' ? 'אופנוע' :
                       obj.class === 'bicycle' ? 'אופניים' :
                       obj.class === 'person' ? 'הולך רגל' :
                       obj.class === 'car' ? 'רכב' :
                       obj.class === 'truck' ? 'משאית' :
                       obj.class === 'bus' ? 'אוטובוס' :
                       obj.class === 'traffic light' ? 'רמזור' :
                       obj.class === 'stop sign' ? 'תמרור עצור' : obj.class;
          
          const distanceText = `${Math.round(obj.distance || 0)}מ`;
          const fullLabel = `${label} ${distanceText}`;
          
          ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
          const textMetrics = ctx.measureText(fullLabel);
          const padding = 8;
          const labelHeight = 26;
          
          // Label background
          ctx.fillStyle = color;
          ctx.roundRect(x, y - labelHeight - 4, textMetrics.width + padding * 2, labelHeight, 6);
          ctx.fill();

          // Label text
          ctx.fillStyle = '#000';
          ctx.fillText(fullLabel, x + padding, y - 10);

          // Draw approaching indicator
          if (obj.approaching && obj.relativeSpeed && obj.relativeSpeed > 5) {
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 14px system-ui';
            const speedText = `↗ ${Math.round(obj.relativeSpeed)} קמ"ש`;
            ctx.fillText(speedText, x + padding, y + height + 18);
          }

          // Draw priority number for closest objects
          if (index < 3 && obj.dangerLevel !== 'safe') {
            ctx.beginPath();
            ctx.arc(x + width - 15, y + 15, 12, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText((index + 1).toString(), x + width - 15, y + 19);
            ctx.textAlign = 'left';
          }
        });
      }

      // FPS calculation
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
    } catch (e) {
      console.error('Detection error:', e);
    }

    animationRef.current = requestAnimationFrame(detect);
  }, [model, videoRef, canvasRef, enabled, calculateDistance, getDangerLevel, trackObject, onObjectDetected]);

  useEffect(() => {
    if (enabled && model) {
      detect();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [enabled, model, detect]);

  return {
    isLoading,
    detectedObjects,
    fps,
    hasDanger: detectedObjects.some(obj => obj.dangerLevel === 'danger'),
    hasWarning: detectedObjects.some(obj => obj.dangerLevel === 'warning'),
    closestObject: detectedObjects[0] || null,
  };
}
