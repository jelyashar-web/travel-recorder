import React, { useEffect, useState } from 'react';
import { Camera, AlertCircle, Gauge, Navigation } from 'lucide-react';
import { SpeedCamera } from '../hooks/useSpeedCameras';

interface SpeedCameraAlertProps {
  camera: SpeedCamera | null;
  currentSpeed: number | null;
  soundEnabled: boolean;
}

export const SpeedCameraAlert: React.FC<SpeedCameraAlertProps> = ({
  camera,
  currentSpeed,
  soundEnabled,
}) => {
  const [showAlert, setShowAlert] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  const playBeep = () => {
    if (!soundEnabled || !audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 1200;
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  useEffect(() => {
    if (camera && camera.distance < 500) {
      setShowAlert(true);
      playBeep();
      
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [camera?.id, camera?.distance]);

  if (!camera) return null;

  const isSpeeding = currentSpeed && camera.maxSpeed && currentSpeed > camera.maxSpeed;
  const isVeryClose = camera.distance < 200;

  const getCameraTypeName = () => {
    switch (camera.type) {
      case 'redlight':
        return 'מצלמת רמזור';
      case 'mobile':
        return 'מכמונת ניידת';
      case 'average':
        return 'ממוצע מהירות';
      default:
        return 'מצלמת מהירות';
    }
  };

  return (
    <>
      {/* Persistent indicator */}
      <div className={`absolute top-20 right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-sm transition-all duration-300 ${
        isVeryClose 
          ? 'bg-red-500/90 animate-pulse' 
          : camera.distance < 400 
            ? 'bg-orange-500/80' 
            : 'bg-blue-500/70'
      }`}>
        <Camera className="w-5 h-5 text-white" />
        <div className="flex flex-col">
          <span className="text-white text-xs font-bold">{getCameraTypeName()}</span>
          <span className="text-white text-lg font-bold">
            {Math.round(camera.distance)}מ'
          </span>
        </div>
        {camera.maxSpeed && (
          <div className={`ml-2 px-2 py-1 rounded-lg ${
            isSpeeding ? 'bg-red-600' : 'bg-white/20'
          }`}>
            <span className="text-white text-sm font-bold">{camera.maxSpeed}</span>
          </div>
        )}
      </div>

      {/* Full screen alert when very close */}
      {showAlert && isVeryClose && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className={`${
            isSpeeding 
              ? 'bg-red-600/95 animate-pulse' 
              : 'bg-orange-500/95'
          } backdrop-blur-sm rounded-3xl px-10 py-8 flex flex-col items-center gap-6 shadow-2xl border-4 ${
            isSpeeding ? 'border-red-400' : 'border-orange-400'
          }`}>
            <div className={`p-6 rounded-full ${
              isSpeeding ? 'bg-red-800' : 'bg-orange-700'
            } animate-bounce`}>
              <Camera className="w-16 h-16 text-white" />
            </div>
            
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-2">
                מצלמה קדמית!
              </p>
              <p className="text-xl text-white/90">
                {Math.round(camera.distance)} מטרים
              </p>
            </div>

            {camera.maxSpeed && (
              <div className={`flex items-center gap-4 px-6 py-3 rounded-xl ${
                isSpeeding ? 'bg-red-800' : 'bg-white/20'
              }`}>
                <Gauge className="w-8 h-8 text-white" />
                <div className="text-center">
                  <p className="text-sm text-white/80">מהירות מותרת</p>
                  <p className="text-3xl font-bold text-white">{camera.maxSpeed} קמ"ש</p>
                </div>
                {isSpeeding && (
                  <AlertCircle className="w-8 h-8 text-white animate-pulse" />
                )}
              </div>
            )}

            {isSpeeding && (
              <p className="text-2xl font-bold text-white animate-pulse">
                האט מיד!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Direction indicator */}
      <div className="absolute top-32 right-4 z-20">
        <div 
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          style={{ transform: `rotate(${camera.bearing}deg)` }}
        >
          <Navigation className="w-6 h-6 text-cyan-400" />
        </div>
      </div>
    </>
  );
};

export default SpeedCameraAlert;
