import React, { useEffect, useState, useCallback, useRef } from 'react';
import { AlertTriangle, Car, PersonStanding, Zap, Volume2, VolumeX } from 'lucide-react';
import { DetectedObject } from '../hooks/useObjectDetection';

interface ADASWarningsProps {
  detectedObjects: DetectedObject[];
  isParkingMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onSoundToggle: () => void;
}

type WarningType = 'collision' | 'proximity' | 'approaching' | 'pedestrian' | null;

interface ActiveWarning {
  type: WarningType;
  message: string;
  object: DetectedObject | null;
}

export const ADASWarnings: React.FC<ADASWarningsProps> = ({
  detectedObjects,
  isParkingMode,
  soundEnabled,
  vibrationEnabled,
  onSoundToggle,
}) => {
  const [activeWarning, setActiveWarning] = useState<ActiveWarning>({ type: null, message: '', object: null });
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const lastBeepRef = useRef(0);
  const lastVibrationRef = useRef(0);

  // Initialize audio context
  useEffect(() => {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    setAudioContext(ctx);
    return () => {
      ctx.close();
    };
  }, []);

  // Play different warning sounds based on urgency
  const playWarningSound = useCallback((type: WarningType) => {
    if (!soundEnabled || !audioContext) return;

    const now = Date.now();
    
    // Don't play sounds too frequently
    const minInterval = type === 'collision' ? 200 : type === 'approaching' ? 500 : 1000;
    if (now - lastBeepRef.current < minInterval) return;
    lastBeepRef.current = now;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    switch (type) {
      case 'collision':
        // Rapid high-pitched alarm
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        
        // Second beep for urgency
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
        gain2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
        osc2.start(audioContext.currentTime + 0.2);
        osc2.stop(audioContext.currentTime + 0.35);
        break;

      case 'approaching':
        // Warning tone - increasing pitch
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(660, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
        break;

      case 'pedestrian':
        // Distinctive tone for pedestrians
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
        break;

      case 'proximity':
        // Gentle warning beep
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        break;
    }
  }, [soundEnabled, audioContext]);

  // Vibrate device
  const vibrate = useCallback((pattern: number | number[]) => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    
    const now = Date.now();
    if (now - lastVibrationRef.current < 500) return; // Don't vibrate too often
    lastVibrationRef.current = now;
    
    navigator.vibrate(pattern);
  }, [vibrationEnabled]);

  // Analyze and set warnings
  useEffect(() => {
    if (detectedObjects.length === 0) {
      setActiveWarning({ type: null, message: '', object: null });
      return;
    }

    const dangers = detectedObjects.filter(obj => obj.dangerLevel === 'danger');
    const warnings = detectedObjects.filter(obj => obj.dangerLevel === 'warning');
    
    let newWarning: ActiveWarning = { type: null, message: '', object: null };

    // Priority 1: Collision danger (closest object is very close)
    const frontCollision = dangers.find(obj => 
      ['car', 'truck', 'bus', 'scooter'].includes(obj.class) && (obj.distance || 100) < 10
    );
    if (frontCollision && !isParkingMode) {
      const objName = frontCollision.class === 'scooter' ? 'קורקינט' : 'רכב';
      newWarning = {
        type: 'collision',
        message: `⚠️ סכנת התנגשות! ${objName} ב-${Math.round(frontCollision.distance || 0)} מטר`,
        object: frontCollision,
      };
      playWarningSound('collision');
      vibrate([200, 100, 200]);
    }

    // Priority 2: Fast approaching object
    else if (!newWarning.type) {
      const approachingObj = detectedObjects.find(obj => 
        obj.approaching && obj.relativeSpeed && obj.relativeSpeed > 15 && (obj.distance || 100) < 20
      );
      if (approachingObj && !isParkingMode) {
        const objName = approachingObj.class === 'scooter' ? 'קורקינט מתקרב' :
                       approachingObj.class === 'motorcycle' ? 'אופנוע מתקרב' :
                       approachingObj.class === 'car' ? 'רכב מתקרב' : 'עצם מתקרב';
        newWarning = {
          type: 'approaching',
          message: `⚡ ${objName} במהירות ${Math.round(approachingObj.relativeSpeed || 0)} קמ"ש!`,
          object: approachingObj,
        };
        playWarningSound('approaching');
        vibrate(300);
      }
    }

    // Priority 3: Pedestrian danger
    else if (!newWarning.type) {
      const pedestrianDanger = dangers.find(obj => obj.class === 'person');
      if (pedestrianDanger) {
        newWarning = {
          type: 'pedestrian',
          message: `🚶 הולך רגל ב-${Math.round(pedestrianDanger.distance || 0)} מטר!`,
          object: pedestrianDanger,
        };
        playWarningSound('pedestrian');
        vibrate([100, 50, 100, 50, 100]);
      }
    }

    // Priority 4: General proximity warning
    else if (!newWarning.type && warnings.length > 0) {
      const closestWarning = warnings[0];
      newWarning = {
        type: 'proximity',
        message: `⚡ התקרבות ל${closestWarning.class === 'scooter' ? 'קורקינט' : closestWarning.class === 'car' ? 'רכב' : 'עצם'}`,
        object: closestWarning,
      };
      playWarningSound('proximity');
    }

    if (newWarning.type !== activeWarning.type || 
        (newWarning.object && activeWarning.object && 
         Math.abs((newWarning.object.distance || 0) - (activeWarning.object.distance || 0)) > 2)) {
      setActiveWarning(newWarning);
    }
  }, [detectedObjects, isParkingMode, activeWarning.type, activeWarning.object, playWarningSound, vibrate]);

  // Auto-clear warning when safe
  useEffect(() => {
    if (!activeWarning.type) return;

    const timer = setTimeout(() => {
      if (!detectedObjects.some(obj => obj.dangerLevel !== 'safe')) {
        setActiveWarning({ type: null, message: '', object: null });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeWarning.type, detectedObjects]);

  return (
    <>
      {/* Sound toggle button */}
      <button
        onClick={onSoundToggle}
        className="absolute top-20 right-4 z-50 p-3 rounded-full bg-black/50 backdrop-blur-sm 
                   hover:bg-black/70 active:scale-95 transition-all"
        title={soundEnabled ? 'כבה צלילים' : 'הפעל צלילים'}
      >
        {soundEnabled ? (
          <Volume2 className="w-5 h-5 text-white" />
        ) : (
          <VolumeX className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Main warning overlay */}
      {activeWarning.type && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div 
            className={`animate-in zoom-in duration-200 pointer-events-auto
                       ${activeWarning.type === 'collision' 
                         ? 'bg-red-600/95 animate-pulse border-4 border-red-400' 
                         : activeWarning.type === 'approaching'
                         ? 'bg-orange-500/95 border-4 border-orange-400'
                         : activeWarning.type === 'pedestrian'
                         ? 'bg-yellow-500/95 border-4 border-yellow-400'
                         : 'bg-blue-500/90 border-2 border-blue-400'}
                       backdrop-blur-md rounded-3xl px-8 py-6 flex flex-col items-center 
                       gap-4 shadow-2xl max-w-sm mx-4`}
          >
            <div className={`p-5 rounded-full ${
              activeWarning.type === 'collision' ? 'bg-red-800' :
              activeWarning.type === 'approaching' ? 'bg-orange-700' :
              activeWarning.type === 'pedestrian' ? 'bg-yellow-700' :
              'bg-blue-700'
            } ${activeWarning.type === 'collision' ? 'animate-bounce' : ''}`}>
              {activeWarning.type === 'collision' ? (
                <AlertTriangle className="w-12 h-12 text-white" />
              ) : activeWarning.type === 'approaching' ? (
                <Zap className="w-12 h-12 text-white" />
              ) : activeWarning.type === 'pedestrian' ? (
                <PersonStanding className="w-12 h-12 text-white" />
              ) : (
                <Car className="w-10 h-10 text-white" />
              )}
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-white mb-2 leading-tight">
                {activeWarning.message}
              </p>
              
              {activeWarning.object && (
                <p className="text-white/90 text-lg">
                  מרחק: <span className="font-bold text-3xl">{Math.round(activeWarning.object.distance || 0)}</span> מטר
                </p>
              )}

              {activeWarning.object?.approaching && activeWarning.object?.relativeSpeed && (
                <p className="text-white/80 text-sm mt-1">
                  נוסע לקראתך ב-{Math.round(activeWarning.object.relativeSpeed)} קמ"ש
                </p>
              )}
            </div>

            {activeWarning.type === 'collision' && (
              <p className="text-white text-xl font-bold animate-pulse">
                עצור מיד!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Side warning list */}
      <div className="absolute left-3 top-1/3 flex flex-col gap-2 z-30 max-w-[120px]">
        {detectedObjects
          .filter(obj => obj.dangerLevel !== 'safe')
          .slice(0, 3)
          .map((obj, idx) => {
            const objName = obj.class === 'scooter' ? 'קורקינט' :
                           obj.class === 'motorcycle' ? 'אופנוע' :
                           obj.class === 'bicycle' ? 'אופניים' :
                           obj.class === 'person' ? 'הולך רגל' :
                           obj.class === 'car' ? 'רכב' :
                           obj.class === 'truck' ? 'משאית' :
                           obj.class === 'bus' ? 'אוטובוס' : obj.class;
            
            return (
              <div
                key={`${obj.class}-${idx}`}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg backdrop-blur-sm
                           ${obj.dangerLevel === 'danger' 
                             ? 'bg-red-500/90 animate-pulse' 
                             : 'bg-orange-500/80'}`}
              >
                {obj.class === 'person' ? (
                  <PersonStanding className="w-4 h-4 text-white" />
                ) : obj.class === 'scooter' ? (
                  <Zap className="w-4 h-4 text-white" />
                ) : (
                  <Car className="w-4 h-4 text-white" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-white text-xs font-bold truncate">{objName}</span>
                  <span className="text-white/90 text-xs font-mono">
                    {Math.round(obj.distance || 0)}מ'
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default ADASWarnings;
