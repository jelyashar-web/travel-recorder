import React from 'react';
import { Car, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { DetectedObject } from '../hooks/useObjectDetection';

interface ParkingAssistantProps {
  isActive: boolean;
  detectedObjects: DetectedObject[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const ParkingAssistant: React.FC<ParkingAssistantProps> = ({
  isActive,
  detectedObjects,
}) => {
  if (!isActive) return null;

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Find objects behind (lower part of screen for rear camera)
  const rearObjects = detectedObjects.filter(obj => {
    const [, y, , height] = obj.bbox;
    const bottomY = y + height;
    // Objects in the lower 60% of screen
    return bottomY > screenHeight * 0.4;
  });

  const closestObject = rearObjects[0];
  const distance = closestObject?.distance || 100;

  // Calculate warning level
  const getWarningLevel = (dist: number) => {
    if (dist < 1.0) return { 
      level: 'critical', 
      color: '#ef4444', 
      bg: 'bg-red-500', 
      bars: 1,
      message: 'עצור מיד!' 
    };
    if (dist < 1.5) return { 
      level: 'danger', 
      color: '#ef4444', 
      bg: 'bg-red-500', 
      bars: 2,
      message: 'קרוב מאוד' 
    };
    if (dist < 2.5) return { 
      level: 'high', 
      color: '#f97316', 
      bg: 'bg-orange-500', 
      bars: 3,
      message: 'אטה' 
    };
    if (dist < 4) return { 
      level: 'medium', 
      color: '#eab308', 
      bg: 'bg-yellow-500', 
      bars: 4,
      message: 'התקרבות' 
    };
    return { 
      level: 'safe', 
      color: '#22c55e', 
      bg: 'bg-green-500', 
      bars: 5,
      message: 'בטוח' 
    };
  };

  const warning = getWarningLevel(distance);

  // Create parking guide lines
  const centerX = screenWidth / 2;
  const bottomY = screenHeight;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Dynamic grid lines for parking */}
      <svg 
        className="absolute inset-0 w-full h-full" 
        viewBox={`0 0 ${screenWidth} ${screenHeight}`}
        preserveAspectRatio="none"
      >
        {/* Center line */}
        <line 
          x1={centerX} 
          y1={0} 
          x2={centerX} 
          y2={bottomY} 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth="1" 
          strokeDasharray="10,10" 
        />
        
        {/* Trajectory curves */}
        <path
          d={`M ${centerX} ${bottomY} Q ${centerX - 120} ${bottomY - 100} ${centerX - 150} ${bottomY - 250}`}
          stroke={warning.color}
          strokeWidth={warning.level === 'critical' ? 4 : 2}
          fill="none"
          opacity={0.6}
        />
        <path
          d={`M ${centerX} ${bottomY} Q ${centerX + 120} ${bottomY - 100} ${centerX + 150} ${bottomY - 250}`}
          stroke={warning.color}
          strokeWidth={warning.level === 'critical' ? 4 : 2}
          fill="none"
          opacity={0.6}
        />

        {/* Distance arcs */}
        {warning.level !== 'safe' && (
          <>
            <path
              d={`M ${centerX - 100} ${bottomY - 20} Q ${centerX} ${bottomY - 80} ${centerX + 100} ${bottomY - 20}`}
              stroke={warning.color}
              strokeWidth="3"
              fill="none"
              className={warning.level === 'critical' ? 'animate-pulse' : ''}
            />
            <path
              d={`M ${centerX - 150} ${bottomY - 40} Q ${centerX} ${bottomY - 150} ${centerX + 150} ${bottomY - 40}`}
              stroke={warning.color}
              strokeWidth="2"
              fill="none"
              opacity={0.6}
              strokeDasharray="8,4"
            />
          </>
        )}

        {/* Side parking guides */}
        <line 
          x1={centerX - 100} 
          y1={bottomY} 
          x2={centerX - 80} 
          y2={bottomY - 200} 
          stroke="rgba(255,255,255,0.4)" 
          strokeWidth="2" 
        />
        <line 
          x1={centerX + 100} 
          y1={bottomY} 
          x2={centerX + 80} 
          y2={bottomY - 200} 
          stroke="rgba(255,255,255,0.4)" 
          strokeWidth="2" 
        />

        {/* Object indicators */}
        {rearObjects.slice(0, 2).map((obj, idx) => {
          const [x, y, w, h] = obj.bbox;
          const objCenterX = x + w / 2;
          const objBottomY = y + h;
          
          let objColor = '#22c55e';
          if (obj.dangerLevel === 'danger') objColor = '#ef4444';
          else if (obj.dangerLevel === 'warning') objColor = '#f59e0b';
          
          return (
            <g key={idx}>
              <line
                x1={centerX}
                y1={bottomY}
                x2={objCenterX}
                y2={objBottomY}
                stroke={objColor}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.8"
              />
              <circle
                cx={objCenterX}
                cy={objBottomY}
                r={15 + (2 - idx) * 5}
                fill={objColor}
                opacity="0.5"
              />
            </g>
          );
        })}
      </svg>

      {/* Side chevrons */}
      <div className="absolute bottom-32 left-4 text-white/50">
        <ChevronLeft className="w-8 h-8" />
        <ChevronLeft className="w-8 h-8 -mt-4" />
        <ChevronLeft className="w-8 h-8 -mt-4" />
      </div>
      <div className="absolute bottom-32 right-4 text-white/50">
        <ChevronRight className="w-8 h-8" />
        <ChevronRight className="w-8 h-8 -mt-4" />
        <ChevronRight className="w-8 h-8 -mt-4" />
      </div>

      {/* Center distance indicator */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20">
        {/* Distance bars */}
        <div className="flex gap-1 items-end h-20">
          {[1, 2, 3, 4, 5].map((bar) => (
            <div
              key={bar}
              className={`w-5 rounded-t-lg transition-all duration-300 ${
                bar <= warning.bars
                  ? warning.level === 'critical' || warning.level === 'danger'
                    ? 'bg-red-500 animate-pulse h-5'
                    : warning.level === 'high'
                    ? 'bg-orange-500 h-8'
                    : warning.level === 'medium'
                    ? 'bg-yellow-500 h-12'
                    : 'bg-green-500 h-16'
                  : 'bg-gray-600/50 h-5'
              }`}
              style={{
                height: bar <= warning.bars 
                  ? `${16 + (bar * 4)}px` 
                  : '20px'
              }}
            />
          ))}
        </div>

        {/* Distance display */}
        <div className={`px-6 py-3 rounded-2xl ${warning.bg} shadow-lg backdrop-blur-sm`}>
          <span className={`text-4xl font-bold text-white`}>
            {distance < 100 ? distance.toFixed(1) : '--'}
          </span>
          <span className="text-white/80 text-lg mr-1">מטר</span>
        </div>

        {/* Warning message */}
        {warning.level !== 'safe' && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${warning.bg} 
                          shadow-lg ${warning.level === 'critical' ? 'animate-pulse' : ''}`}>
            <AlertTriangle className="w-5 h-5 text-white" />
            <span className="text-white font-bold text-lg">{warning.message}</span>
          </div>
        )}
      </div>

      {/* Corner markers */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-4 border-t-4 border-white/60 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-12 h-12 border-r-4 border-t-4 border-white/60 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-4 border-b-4 border-white/60 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-4 border-b-4 border-white/60 rounded-br-lg" />

      {/* Parking mode badge */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 
                    bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-20">
        <Car className="w-6 h-6 text-white" />
        <span className="text-white font-bold text-lg">מצב חנייה</span>
      </div>

      {/* Object count */}
      {rearObjects.length > 0 && (
        <div className="absolute top-28 left-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg">
          <span className="text-white text-sm">
            {rearObjects.length} עצמים מאחור
          </span>
        </div>
      )}
    </div>
  );
};

export default ParkingAssistant;
