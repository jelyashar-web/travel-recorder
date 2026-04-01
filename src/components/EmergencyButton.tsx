import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Shield, Send, X } from 'lucide-react';

interface EmergencyButtonProps {
  isActive: boolean;
  countdown: number;
  onActivate: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EmergencyButton({ 
  isActive, 
  countdown, 
  onActivate, 
  onCancel,
  onConfirm 
}: EmergencyButtonProps) {
  const [countdownValue, setCountdownValue] = useState(countdown);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isActive && countdownValue > 0) {
      const timer = setTimeout(() => {
        setCountdownValue(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isActive && countdownValue === 0) {
      onConfirm();
      setShowConfirm(false);
    }
  }, [isActive, countdownValue, onConfirm]);

  useEffect(() => {
    if (isActive) {
      setCountdownValue(countdown);
      setShowConfirm(true);
    } else {
      setShowConfirm(false);
      setCountdownValue(countdown);
    }
  }, [isActive, countdown]);

  const handleCancel = useCallback(() => {
    setShowConfirm(false);
    setCountdownValue(countdown);
    onCancel();
  }, [onCancel, countdown]);

  const handleImmediateConfirm = useCallback(() => {
    onConfirm();
    setShowConfirm(false);
  }, [onConfirm]);

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
        <div className="bg-gray-800 rounded-2xl max-w-md w-full p-6 text-center border-2 border-red-500 shadow-2xl shadow-red-500/20">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-white">מצב חירום!</h2>
          <p className="text-gray-400 mb-6">
            הקלטה ושליחה אוטומטית יתחילו בעוד <span className="text-red-400 font-bold text-xl">{countdownValue}</span> שניות
          </p>

          <div className="w-full bg-gray-700 rounded-full h-3 mb-6 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-red-500 to-orange-500 h-full transition-all duration-1000 ease-linear"
              style={{ width: `${(countdownValue / countdown) * 100}%` }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-colors font-medium"
            >
              <X className="w-5 h-5 inline-block ml-2" />
              ביטול
            </button>
            <button
              onClick={handleImmediateConfirm}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 rounded-xl transition-all font-bold flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              שלח מיד
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              הקלטת החירום תישמר ותשלח אוטומטית לאנשי הקשר
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onActivate}
      className="fixed bottom-6 left-6 z-40 w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 
                 rounded-full shadow-2xl shadow-red-500/50 flex items-center justify-center
                 hover:scale-110 transition-transform active:scale-95 group"
      title="SOS - מצב חירום"
    >
      <Shield className="w-8 h-8 text-white group-hover:animate-pulse" />
      <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full animate-ping" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full" />
    </button>
  );
}
