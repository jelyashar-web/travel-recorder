import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  Camera, Square, RefreshCw, 
  VideoOff, AlertTriangle, Gauge, Moon, Sun,
  Car, Radar, Volume2, VolumeX, Zap
} from 'lucide-react';
import { Recording, GeoLocation, AppSettings } from '../types';
import { useObjectDetection } from '../hooks/useObjectDetection';
import { useSpeedCameras } from '../hooks/useSpeedCameras';
import { ADASWarnings } from './ADASWarnings';
import { ParkingAssistant } from './ParkingAssistant';
import { SpeedCameraAlert } from './SpeedCameraAlert';
import { DistanceVisualizer } from './DistanceVisualizer';

interface CameraRecorderProps {
  onRecordingComplete: (data: Recording, isEmergency: boolean) => void;
  currentLocation: GeoLocation | null;
  isLocationActive: boolean;
  currentSpeed: number | null;
  speedLimit: number;
  settings: AppSettings;
  isEmergency: boolean;
  onEmergencyStart: () => void;
}

const QUALITY_SETTINGS = {
  low: { width: 640, height: 480 },
  medium: { width: 1280, height: 720 },
  high: { width: 1920, height: 1080 },
};

export function CameraRecorder({ 
  onRecordingComplete, 
  currentLocation, 
  currentSpeed,
  speedLimit,
  settings,
  isEmergency,
  onEmergencyStart,
}: CameraRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isMuted] = useState(false);
  const [isVideoEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const hour = new Date().getHours();
    return hour < 6 || hour >= 18;
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // ADAS states
  const [isADASActive, setIsADASActive] = useState(true);
  const [isParkingMode, setIsParkingMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled] = useState(true);

  // Object detection hook
  const {
    isLoading: isModelLoading,
    detectedObjects,
    fps,
    hasDanger,
    hasWarning,
  } = useObjectDetection({
    enabled: isADASActive && isStreamActive,
    videoRef,
    canvasRef,
    warningDistance: 15,
    dangerDistance: 8,
  });

  // Speed cameras hook
  const {
    nearestCamera,
    cameraCount,
  } = useSpeedCameras({
    location: currentLocation,
    enabled: isADASActive,
    searchRadius: 5000,
  });

  // Check speeding
  const isSpeeding = currentSpeed !== null && currentSpeed > speedLimit;

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const quality = QUALITY_SETTINGS[settings.recordingQuality];
      
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: quality.width },
          height: { ideal: quality.height },
          frameRate: { ideal: 30 },
        },
        audio: !isMuted,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreamActive(true);
    } catch (err) {
      setError('לא ניתן לגשת למצלמה');
      console.error('Camera error:', err);
    }
  }, [facingMode, isMuted, settings.recordingQuality]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreamActive(false);
  }, []);

  // Start recording
  const startRecording = useCallback((emergency = false) => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const duration = Date.now() - startTimeRef.current;

      onRecordingComplete({
        id: crypto.randomUUID(),
        blob,
        url,
        timestamp: Date.now(),
        duration,
        location: currentLocation,
        uploaded: false,
        isEmergency: emergency || isEmergency,
      }, emergency || isEmergency);
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    startTimeRef.current = Date.now();
    setIsRecording(true);
  }, [currentLocation, isEmergency, onRecordingComplete]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingTime(0);
  }, []);

  // Toggle facing mode
  const toggleFacingMode = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Toggle ADAS
  const toggleADAS = useCallback(() => {
    setIsADASActive(prev => !prev);
  }, []);

  // Toggle parking mode
  const toggleParkingMode = useCallback(() => {
    setIsParkingMode(prev => !prev);
  }, []);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordingTime(elapsed);

        if (elapsed >= settings.maxRecordingDuration * 60) {
          stopRecording();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, settings.maxRecordingDuration, stopRecording]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black overflow-hidden">
      {/* Full screen video */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />
        
        {/* Detection canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ objectFit: 'cover' }}
        />

        {!isVideoEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <VideoOff className="w-20 h-20 text-gray-600" />
          </div>
        )}

        {/* Distance Visualizer */}
        <DistanceVisualizer
          detectedObjects={detectedObjects}
          isParkingMode={isParkingMode}
          currentSpeed={currentSpeed}
        />

        {/* ADAS Warnings */}
        <ADASWarnings
          detectedObjects={detectedObjects}
          isParkingMode={isParkingMode}
          soundEnabled={soundEnabled}
          vibrationEnabled={vibrationEnabled}
          onSoundToggle={() => setSoundEnabled(prev => !prev)}
        />

        {/* Parking Assistant */}
        <ParkingAssistant
          isActive={isParkingMode}
          detectedObjects={detectedObjects}
          canvasRef={canvasRef}
        />

        {/* Speed Camera Alert */}
        <SpeedCameraAlert
          camera={nearestCamera}
          currentSpeed={currentSpeed}
          soundEnabled={soundEnabled}
        />

        {/* Top Status Bar - Mobile Optimized */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent">
          <div className="flex items-center justify-between">
            {/* Left - Time & Recording */}
            <div className="flex items-center gap-2">
              {isRecording && (
                <div className="flex items-center gap-1.5 bg-red-500/90 px-2 py-1 rounded-full">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  <span className="text-white text-xs font-mono font-bold">
                    {formatTime(recordingTime)}
                  </span>
                </div>
              )}
              <div className="bg-black/50 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-white text-sm font-mono font-bold">
                  {currentTime.toLocaleTimeString('he-IL', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Right - Speed & Status */}
            <div className="flex items-center gap-2">
              {currentSpeed !== null && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  isSpeeding ? 'bg-red-500/90' : 'bg-green-500/80'
                }`}>
                  <Gauge className="w-4 h-4 text-white" />
                  <span className="text-white text-lg font-bold font-mono">
                    {Math.round(currentSpeed)}
                  </span>
                  <span className="text-white/80 text-xs">קמ"ש</span>
                </div>
              )}
              
              {cameraCount > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/80">
                  <Camera className="w-4 h-4 text-white" />
                  <span className="text-white text-xs font-bold">{cameraCount}</span>
                </div>
              )}

              {isADASActive && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  hasDanger ? 'bg-red-500/90 animate-pulse' : 
                  hasWarning ? 'bg-orange-500/90' : 'bg-cyan-500/80'
                }`}>
                  <Radar className="w-4 h-4 text-white" />
                  {fps > 0 && <span className="text-white text-xs">{fps}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Alert Overlay */}
        {hasDanger && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500/90 px-4 py-2 rounded-full animate-pulse z-20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">סכנה קדמית!</span>
            </div>
          </div>
        )}

        {/* Speeding Warning */}
        {isSpeeding && !isParkingMode && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-orange-500/90 px-4 py-2 rounded-full animate-pulse z-20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">חריגת מהירות!</span>
            </div>
          </div>
        )}

        {/* Bottom Controls - Mobile Optimized */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Quick Actions Row */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <button
              onClick={toggleFacingMode}
              disabled={isRecording}
              className="p-3 rounded-full bg-gray-700/80 backdrop-blur-sm hover:bg-gray-600 
                       transition-all disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full backdrop-blur-sm transition-all active:scale-95 ${
                isDarkMode ? 'bg-indigo-600' : 'bg-gray-700/80 hover:bg-gray-600'
              }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-white" /> : <Moon className="w-5 h-5 text-white" />}
            </button>

            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className={`p-3 rounded-full backdrop-blur-sm transition-all active:scale-95 ${
                soundEnabled ? 'bg-green-600' : 'bg-gray-700/80'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
            </button>

            <button
              onClick={toggleADAS}
              className={`p-3 rounded-full backdrop-blur-sm transition-all active:scale-95 ${
                isADASActive ? 'bg-cyan-600' : 'bg-gray-700/80'
              }`}
            >
              <Radar className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={toggleParkingMode}
              className={`p-3 rounded-full backdrop-blur-sm transition-all active:scale-95 ${
                isParkingMode ? 'bg-yellow-600' : 'bg-gray-700/80'
              }`}
            >
              <Car className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            {isRecording ? (
              <button 
                onClick={stopRecording} 
                className="flex items-center gap-2 px-8 py-4 bg-red-500 rounded-2xl font-bold
                         shadow-lg shadow-red-500/30 active:scale-95 transition-transform"
              >
                <Square className="w-6 h-6 fill-white" />
                <span className="text-white text-lg">עצור</span>
              </button>
            ) : (
              <button
                onClick={() => startRecording(false)}
                disabled={!isStreamActive}
                className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 
                         rounded-2xl font-bold shadow-lg shadow-blue-500/30 
                         active:scale-95 transition-transform disabled:opacity-50"
              >
                <div className="w-5 h-5 bg-white rounded-full" />
                <span className="text-white text-lg">הקלט</span>
              </button>
            )}

            <button
              onClick={onEmergencyStart}
              disabled={isEmergency}
              className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 
                       rounded-2xl font-bold shadow-lg shadow-red-500/30 
                       active:scale-95 transition-transform disabled:opacity-50"
            >
              <Zap className="w-6 h-6 text-white" />
              <span className="text-white">SOS</span>
            </button>
          </div>
        </div>

        {/* Model loading indicator */}
        {isModelLoading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                        bg-black/80 backdrop-blur-sm px-6 py-4 rounded-2xl z-30">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-cyan-400 text-sm font-medium">טוען AI...</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
            <div className="text-center p-6 max-w-xs">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-6 text-lg">{error}</p>
              <button 
                onClick={startCamera} 
                className="px-6 py-3 bg-blue-500 rounded-xl font-bold text-white
                         hover:bg-blue-600 transition-colors"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
