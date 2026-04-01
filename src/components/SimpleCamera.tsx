import { useRef, useState, useCallback, useEffect } from 'react';
import { Square, RefreshCw, AlertTriangle, Gauge, Sun, Moon, Radar } from 'lucide-react';
import { Recording, GeoLocation } from '../types';

interface SimpleCameraProps {
  currentSpeed: number | null;
  speedLimit: number;
  isEmergency: boolean;
  onEmergencyStart: () => void;
  onRecordingComplete: (recording: Recording, isEmergency: boolean) => void;
  currentLocation: GeoLocation | null;
}

export function SimpleCamera({ 
  currentSpeed,
  speedLimit,
  isEmergency,
  onEmergencyStart,
  onRecordingComplete,
  currentLocation,
}: SimpleCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const [isRecording, setIsRecording] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isADASActive, setIsADASActive] = useState(false);

  const isSpeeding = currentSpeed !== null && currentSpeed > speedLimit;

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsStreamActive(true);
    } catch (err) {
      setError('לא ניתן לגשת למצלמה - ודא שהרשאות נתונות');
      console.error('Camera error:', err);
    }
  }, [facingMode]);

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
    if (!streamRef.current) {
      console.error('No stream available');
      return;
    }

    chunksRef.current = [];
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm'
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

        const recording: Recording = {
          id: crypto.randomUUID(),
          blob,
          url,
          timestamp: Date.now(),
          duration,
          location: currentLocation,
          uploaded: false,
          isEmergency: emergency || isEmergency,
        };

        onRecordingComplete(recording, emergency || isEmergency);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('שגיאה בהתחלת ההקלטה');
    }
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
    const wasRecording = isRecording;
    if (isRecording) {
      stopRecording();
    }
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    // Restart camera with new facing mode
    setTimeout(() => {
      startCamera();
      if (wasRecording) {
        setTimeout(() => startRecording(), 500);
      }
    }, 100);
  }, [isRecording, startCamera, startRecording, stopRecording]);

  // Update time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      if (isRecording) {
        setRecordingTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => {
      stopRecording();
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle emergency trigger
  useEffect(() => {
    if (isEmergency && !isRecording) {
      startRecording(true);
    }
  }, [isEmergency, isRecording, startRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
      {/* Video */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isRecording && (
                  <div className="flex items-center gap-1.5 bg-red-600/90 px-3 py-1.5 rounded-full animate-pulse">
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    <span className="text-white text-sm font-mono font-bold">{formatTime(recordingTime)}</span>
                  </div>
                )}
                
                <div className="bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <span className="text-white text-sm font-mono font-bold">
                    {currentTime.toLocaleTimeString('he-IL', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentSpeed !== null && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm ${
                    isSpeeding ? 'bg-red-600 animate-pulse' : 'bg-green-600/90'
                  }`}>
                    <Gauge className="w-4 h-4 text-white" />
                    <span className="text-white text-xl font-bold font-mono">{Math.round(currentSpeed)}</span>
                    <span className="text-white/80 text-xs">קמ"ש</span>
                  </div>
                )}

                {isADASActive && (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-cyan-600/80 backdrop-blur-sm">
                    <Radar className="w-4 h-4 text-white animate-spin" style={{ animationDuration: '3s' }} />
                    <span className="text-white text-xs font-bold">ADAS</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Speed warning */}
          {isSpeeding && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-600/95 px-6 py-3 rounded-full animate-pulse shadow-lg shadow-red-500/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-white" />
                <span className="text-white font-bold text-lg">חריגת מהירות!</span>
              </div>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute top-1/2 left-4 transform -translate-y-1/2 flex flex-col gap-2">
              <div className="bg-black/60 backdrop-blur-sm p-2 rounded-lg text-center">
                <span className="text-white/60 text-xs">REC</span>
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mt-1 animate-pulse" />
              </div>
            </div>
          )}

          {/* Emergency overlay */}
          {isEmergency && (
            <div className="absolute inset-0 bg-red-500/30 animate-pulse flex items-center justify-center">
              <div className="bg-red-600/90 px-8 py-4 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-10 h-10 text-white animate-bounce" />
                  <span className="text-white text-2xl font-bold">מצב חירום!</span>
                </div>
              </div>
            </div>
          )}

          {/* Storage warning if recording too long */}
          {isRecording && recordingTime > 600 && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-yellow-600/90 px-4 py-2 rounded-full">
              <span className="text-white text-sm">{formatTime(recordingTime)} - הקלטה ארוכה</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="text-center p-6 max-w-xs">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-400 mb-6 text-lg font-bold">{error}</p>
              <button 
                onClick={startCamera} 
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white transition-colors shadow-lg"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!isStreamActive && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-400 text-sm">מפעיל מצלמה...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 flex items-center justify-center gap-3 flex-wrap bg-gray-800/90 backdrop-blur-sm">
        <button
          onClick={toggleFacingMode}
          disabled={isRecording}
          className="p-3 rounded-full bg-gray-700 hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          title="החלף מצלמה"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-full transition-all active:scale-95 ${isDarkMode ? 'bg-indigo-600 shadow-lg shadow-indigo-500/30' : 'bg-gray-700 hover:bg-gray-600'}`}
          title="מצב לילה"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setIsADASActive(!isADASActive)}
          className={`p-3 rounded-full transition-all active:scale-95 ${isADASActive ? 'bg-cyan-600 shadow-lg shadow-cyan-500/30' : 'bg-gray-700 hover:bg-gray-600'}`}
          title="ADAS"
        >
          <Radar className={`w-5 h-5 ${isADASActive ? 'animate-pulse' : ''}`} />
        </button>

        {isRecording ? (
          <button 
            onClick={stopRecording} 
            className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-500/30 active:scale-95 transition-all"
          >
            <Square className="w-5 h-5 fill-current" />
            <span>עצור הקלטה</span>
          </button>
        ) : (
          <button
            onClick={() => startRecording(false)}
            disabled={!isStreamActive}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
          >
            <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
            <span>התחל הקלטה</span>
          </button>
        )}

        <button
          onClick={onEmergencyStart}
          disabled={isEmergency}
          className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-red-500/30 active:scale-95 transition-all"
        >
          <AlertTriangle className="w-5 h-5" />
          <span>SOS</span>
        </button>
      </div>
    </div>
  );
}

export default SimpleCamera;
