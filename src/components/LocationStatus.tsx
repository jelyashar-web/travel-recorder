import { MapPin, Navigation, AlertCircle, Compass } from 'lucide-react';
import { GeoLocation } from '../types';

interface LocationStatusProps {
  location: GeoLocation | null;
  isTracking: boolean;
  speedLimit: number;
}

export function LocationStatus({ location, isTracking, speedLimit }: LocationStatusProps) {
  const isSpeeding = location?.speed !== null && location!.speed! > speedLimit;

  if (!location) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium">ממתין ל-GPS...</p>
            <p className="text-sm text-gray-500">וודא שה-GPS מופעל</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 border ${
      isSpeeding 
        ? 'bg-red-500/10 border-red-500/50' 
        : 'bg-gray-800/50 border-gray-700'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            isTracking ? 'bg-green-500/20' : 'bg-gray-700'
          }`}>
            <Navigation className={`w-5 h-5 ${isTracking ? 'text-green-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              GPS {isTracking ? 'פעיל' : 'לא פעיל'}
              {isSpeeding && (
                <span className="text-red-400 text-sm animate-pulse">⚠️ חריגת מהירות!</span>
              )}
            </p>
            <p className="text-sm text-gray-400">
              דיוק: {Math.round(location.accuracy)} מטר
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Speed */}
          <div className={`text-center px-3 py-2 rounded-lg ${
            isSpeeding ? 'bg-red-500/20' : 'bg-gray-700/50'
          }`}>
            <div className={`text-2xl font-bold font-mono ${
              isSpeeding ? 'text-red-400' : 'text-white'
            }`}>
              {location.speed !== null ? Math.round(location.speed) : '--'}
            </div>
            <div className="text-xs text-gray-400">קמ"ש</div>
          </div>

          {/* Heading */}
          {location.heading !== null && (
            <div className="text-center px-3 py-2 rounded-lg bg-gray-700/50">
              <div className="text-2xl font-bold">
                <Compass 
                  className="w-6 h-6 mx-auto" 
                  style={{ transform: `rotate(${location.heading}deg)` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {Math.round(location.heading)}°
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coordinates */}
      <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>lat: {location.latitude.toFixed(5)}</span>
          <span>lng: {location.longitude.toFixed(5)}</span>
        </div>
        {location.altitude !== null && (
          <span>גובה: {Math.round(location.altitude)} מ'</span>
        )}
      </div>

      {/* Speeding warning */}
      {isSpeeding && (
        <div className="mt-3 p-2 bg-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>מהירות מעל המותר ({speedLimit} קמ"ש)</span>
        </div>
      )}
    </div>
  );
}
