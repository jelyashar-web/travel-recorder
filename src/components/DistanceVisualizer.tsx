import React from 'react';
import { DetectedObject } from '../hooks/useObjectDetection';

interface DistanceVisualizerProps {
  detectedObjects: DetectedObject[];
  isParkingMode: boolean;
  currentSpeed: number | null;
}

export const DistanceVisualizer: React.FC<DistanceVisualizerProps> = ({
  detectedObjects,
  isParkingMode,
  currentSpeed,
}) => {
  if (detectedObjects.length === 0) return null;

  // Filter only relevant objects in front
  const frontObjects = detectedObjects.filter(obj => {
    const [, y, , height] = obj.bbox;
    const centerY = y + height / 2;
    // Consider objects in the lower 60% of the frame as "in front"
    return centerY > (window.innerHeight * 0.4);
  });

  if (frontObjects.length === 0) return null;

  // Get closest object
  const closestObject = frontObjects[0];
  const distance = closestObject.distance || 100;

  // Calculate dynamic warning zones based on speed
  const getWarningZone = (dist: number, speed: number | null) => {
    // Adjust warning distances based on speed
    const dangerThreshold = speed && speed > 30 ? 12 : 8;
    const warningThreshold = speed && speed > 30 ? 25 : 15;

    if (dist <= dangerThreshold) return 'danger';
    if (dist <= warningThreshold) return 'warning';
    return 'safe';
  };

  const zone = getWarningZone(distance, currentSpeed);

  // Calculate arc radius based on distance (closer = larger arc)
  const getArcRadius = (dist: number) => {
    const maxRadius = Math.min(window.innerWidth, window.innerHeight) * 0.45;
    const minRadius = Math.min(window.innerWidth, window.innerHeight) * 0.15;
    // Invert: closer distance = larger radius
    const normalizedDist = Math.min(dist / 50, 1); // 0-1 where 0 is close
    return minRadius + (maxRadius - minRadius) * (1 - normalizedDist);
  };

  const arcRadius = getArcRadius(distance);

  // Color based on zone
  const getZoneColor = (z: string) => {
    switch (z) {
      case 'danger':
        return {
          stroke: '#ef4444',
          fill: 'rgba(239, 68, 68, 0.15)',
          glow: 'rgba(239, 68, 68, 0.4)',
        };
      case 'warning':
        return {
          stroke: '#f59e0b',
          fill: 'rgba(245, 158, 11, 0.1)',
          glow: 'rgba(245, 158, 11, 0.3)',
        };
      default:
        return {
          stroke: '#22c55e',
          fill: 'rgba(34, 197, 94, 0.05)',
          glow: 'rgba(34, 197, 94, 0.2)',
        };
    }
  };

  const colors = getZoneColor(zone);
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight;

  // Create arc path
  const createArcPath = (radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const angleInRadians = (angle - 90) * Math.PI / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians)
    };
  };

  // Dynamic lane lines based on object positions
  const getLaneLines = () => {
    return frontObjects.slice(0, 3).map((obj, index) => {
      const [x, y, width, height] = obj.bbox;
      const objCenterX = x + width / 2;
      const objBottomY = y + height;

      // Determine color based on danger level
      let lineColor = '#22c55e';
      let lineWidth = 2;
      if (obj.dangerLevel === 'warning') {
        lineColor = '#f59e0b';
        lineWidth = 3;
      } else if (obj.dangerLevel === 'danger') {
        lineColor = '#ef4444';
        lineWidth = 4;
      }

      return (
        <g key={`lane-${index}`}>
          {/* Line from bottom center to object */}
          <line
            x1={centerX}
            y1={centerY}
            x2={objCenterX}
            y2={objBottomY}
            stroke={lineColor}
            strokeWidth={lineWidth}
            strokeDasharray={obj.dangerLevel === 'danger' ? 'none' : '8,4'}
            opacity={0.8}
            className={obj.dangerLevel === 'danger' ? 'animate-pulse' : ''}
          />
          {/* Object indicator circle */}
          <circle
            cx={objCenterX}
            cy={objBottomY}
            r={8 + (3 - Math.min(index, 2)) * 4}
            fill={lineColor}
            opacity={0.6}
          />
          {/* Distance text */}
          <text
            x={objCenterX}
            y={objBottomY - 15}
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            stroke="black"
            strokeWidth="3"
            paintOrder="stroke"
          >
            {Math.round(obj.distance || 0)}m
          </text>
        </g>
      );
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        preserveAspectRatio="none"
      >
        {/* Distance zone arcs */}
        {!isParkingMode && (
          <>
            {/* Main warning arc */}
            <path
              d={createArcPath(arcRadius, -60, 60)}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={zone === 'danger' ? 6 : zone === 'warning' ? 4 : 2}
              opacity={zone === 'danger' ? 1 : 0.7}
              className={zone === 'danger' ? 'animate-pulse' : ''}
              filter={`drop-shadow(0 0 10px ${colors.glow})`}
            />
            
            {/* Secondary arcs for depth perception */}
            <path
              d={createArcPath(arcRadius * 0.7, -50, 50)}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={2}
              opacity={0.4}
              strokeDasharray="10,5"
            />
            
            <path
              d={createArcPath(arcRadius * 1.3, -70, 70)}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={1}
              opacity={0.3}
              strokeDasharray="5,10"
            />

            {/* Zone fill */}
            <path
              d={`${createArcPath(arcRadius, -60, 60)} L ${centerX} ${centerY} Z`}
              fill={colors.fill}
              opacity={0.3}
            />
          </>
        )}

        {/* Lane lines to detected objects */}
        {getLaneLines()}

        {/* Center guidance line */}
        <line
          x1={centerX}
          y1={centerY}
          x2={centerX}
          y2={centerY - 150}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={2}
          strokeDasharray="10,10"
        />

        {/* Side boundary lines */}
        <line
          x1={centerX - 80}
          y1={centerY}
          x2={centerX - 40}
          y2={centerY - 150}
          stroke={colors.stroke}
          strokeWidth={1}
          opacity={0.5}
        />
        <line
          x1={centerX + 80}
          y1={centerY}
          x2={centerX + 40}
          y2={centerY - 150}
          stroke={colors.stroke}
          strokeWidth={1}
          opacity={0.5}
        />
      </svg>

      {/* Speed-based distance indicator */}
      <div className="absolute bottom-36 left-1/2 -translate-x-1/2">
        <div 
          className={`px-4 py-2 rounded-full backdrop-blur-sm font-bold text-white text-lg
                     transition-all duration-300 ${
            zone === 'danger' ? 'bg-red-500/90 scale-110 animate-pulse' :
            zone === 'warning' ? 'bg-orange-500/90' :
            'bg-green-500/70'
          }`}
        >
          {Math.round(distance)} מטר
          {currentSpeed && currentSpeed > 30 && (
            <span className="text-sm mr-2 opacity-80">
              | {Math.round((distance / currentSpeed) * 3.6)} שניות
            </span>
          )}
        </div>
      </div>

      {/* Object count badge */}
      <div className="absolute top-24 left-4 bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <span className="text-white text-sm">
          {detectedObjects.length} עצמים
        </span>
      </div>

      {/* Collision time estimate */}
      {currentSpeed && currentSpeed > 10 && closestObject.dangerLevel !== 'safe' && (
        <div className={`absolute top-24 right-4 px-3 py-1.5 rounded-full font-bold
                       ${closestObject.dangerLevel === 'danger' 
                         ? 'bg-red-500/90 animate-pulse' 
                         : 'bg-orange-500/90'}`}>
          <span className="text-white text-sm">
            {Math.max(0, Math.round((distance / currentSpeed) * 3.6))} שניות להתנגשות
          </span>
        </div>
      )}
    </div>
  );
};

export default DistanceVisualizer;
