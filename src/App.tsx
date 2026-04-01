import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, ShieldCheck, BarChart3, LogOut, Video,
  Cloud, AlertTriangle, Trash2, User, Upload, Wifi, WifiOff
} from 'lucide-react';

import { SimpleCamera } from './components/SimpleCamera';
import { RecordingList } from './components/RecordingList';
import { Settings as SettingsPanel } from './components/Settings';
import { EmergencyButton } from './components/EmergencyButton';
import { LocationStatus } from './components/LocationStatus';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { Statistics } from './components/Statistics';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { LandingPage } from './components/LandingPage';

import { useLocation } from './hooks/useLocation';
import { useSettings } from './hooks/useSettings';
import { useAccidentDetection } from './hooks/useAccidentDetection';
import { useStatistics } from './hooks/useStatistics';
import { useAuth } from './hooks/useAuth';
import { useRecordingStorage } from './hooks/useRecordingStorage';
import { useCloudUpload } from './hooks/useCloudUpload';

import { Recording, AccidentData } from './types';

function App() {
  const { i18n } = useTranslation();
  
  // Show landing page first
  const [showLanding, setShowLanding] = useState(() => {
    // Skip landing if already in app or came back
    return !localStorage.getItem('skip-landing');
  });
  
  // Auth - WITHOUT auto anonymous login
  const { 
    user, 
    loading: authLoading, 
    signOut, 
    isAnonymous, 
    isAuthenticated 
  } = useAuth();
  
  const [, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleEnterApp = () => {
    localStorage.setItem('skip-landing', 'true');
    setShowLanding(false);
  };

  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Hooks
  const { location, isTracking, startTracking, stopTracking } = useLocation();
  const { settings, isLoaded: settingsLoaded, updateSettings } = useSettings();
  const { stats, formatDuration, exportStats, resetStats } = useStatistics([], settings.speedLimit);
  
  // Cloud upload
  const { 
    uploadProgress, 
    uploadRecording, 
    uploadMultiple, 
    deleteCloudRecording,
    getUploadStatus 
  } = useCloudUpload(user?.id || null);

  // Local storage
  const { 
    recordings, 
    isLoading: storageLoading, 
    saveRecording, 
    deleteRecording, 
    clearOldRecordings,
    getStorageStats 
  } = useRecordingStorage();

  // Network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Show auth modal if not authenticated - NO AUTO LOGIN
  useEffect(() => {
    if (!authLoading && !user) {
      setShowAuthModal(true);
    } else if (user) {
      setShowAuthModal(false);
    }
  }, [authLoading, user]);

  // RTL direction
  useEffect(() => {
    const isRTL = i18n.language === 'he' || i18n.language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [i18n.language]);

  // Start GPS tracking
  useEffect(() => {
    if (settingsLoaded && user) {
      startTracking();
    }
    return () => stopTracking();
  }, [settingsLoaded, user, startTracking, stopTracking]);

  // Auto cleanup old recordings
  useEffect(() => {
    if (!settingsLoaded || !user) return;

    const cleanup = async () => {
      const deleted = await clearOldRecordings(50, 30);
      if (deleted > 0) {
        console.log(`נוקו ${deleted} הקלטות ישנות`);
      }
    };

    cleanup();
    const interval = setInterval(cleanup, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settingsLoaded, user, clearOldRecordings]);

  // Check storage
  useEffect(() => {
    const stats = getStorageStats();
    const sizeMB = parseFloat(stats.totalSizeMB);
    if (sizeMB > 500) {
      setShowStorageWarning(true);
    }
  }, [recordings, getStorageStats]);

  // Handle recording complete
  const handleRecordingComplete = useCallback(async (recording: Recording, isEmergencyRecording: boolean) => {
    const saved = await saveRecording(recording);
    
    if (saved) {
      // Auto-upload for emergency recordings (if online and not anonymous)
      if (isEmergencyRecording && settings.emergencyUploadImmediately && isOnline && !isAnonymous()) {
        await uploadRecording(recording);
      }
      
      // Auto-upload for regular recordings if setting enabled
      if (settings.autoUpload && isOnline && !isAnonymous()) {
        await uploadRecording(recording);
      }

      if (isEmergencyRecording) {
        setIsEmergency(false);
      }
    }
  }, [saveRecording, settings.emergencyUploadImmediately, settings.autoUpload, isOnline, isAnonymous, uploadRecording]);

  // Handle accident
  const handleAccident = useCallback((data: AccidentData) => {
    console.log('זוהתה תאונה!', data);
    if (settings.accidentDetection) {
      activateEmergency();
    }
  }, [settings.accidentDetection]);

  const { startMonitoring, stopMonitoring } = useAccidentDetection({ 
    settings, 
    location, 
    onAccident: handleAccident 
  });

  useEffect(() => {
    if (settings.accidentDetection && isTracking) {
      startMonitoring();
    }
    return () => stopMonitoring();
  }, [settings.accidentDetection, isTracking, startMonitoring, stopMonitoring]);

  // Handle delete
  const handleDelete = useCallback(async (id: string, cloudFilePath?: string) => {
    await deleteRecording(id);
    if (cloudFilePath) {
      await deleteCloudRecording(id, cloudFilePath);
    }
  }, [deleteRecording, deleteCloudRecording]);

  // Handle upload
  const handleUpload = useCallback(async (recording: Recording) => {
    if (!isOnline) {
      alert('אין חיבור לאינטרנט');
      return;
    }
    if (isAnonymous()) {
      alert('יש להתחבר כדי להעלות לענן');
      setShowAuthModal(true);
      return;
    }
    await uploadRecording(recording);
  }, [isOnline, isAnonymous, uploadRecording]);

  // Sync all to cloud
  const handleSyncAll = useCallback(async () => {
    if (!isOnline) {
      alert('אין חיבור לאינטרנט');
      return;
    }
    if (isAnonymous()) {
      alert('יש להתחבר כדי לסנכרן');
      setShowAuthModal(true);
      return;
    }

    const notUploaded = recordings.filter(r => !getUploadStatus(r.id).url);
    if (notUploaded.length === 0) {
      alert('כל ההקלטות כבר בענן');
      return;
    }

    const { success, failed } = await uploadMultiple(notUploaded);
    alert(`הועלו ${success} הקלטות בהצלחה${failed > 0 ? `, ${failed} נכשלו` : ''}`);
  }, [isOnline, isAnonymous, recordings, uploadMultiple, getUploadStatus]);

  // Emergency handlers
  const activateEmergency = useCallback(() => setIsEmergency(true), []);
  const cancelEmergency = useCallback(() => setIsEmergency(false), []);
  const confirmEmergency = useCallback(() => setIsEmergency(false), []);

  // Handle logout - CLEAR EVERYTHING
  const handleLogout = useCallback(async () => {
    await signOut();
    // Clear local recordings on logout
    setShowAuthModal(true);
  }, [signOut]);

  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  // Loading state
  if (authLoading || !settingsLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <div className="text-cyan-400 text-xl animate-pulse">טוען...</div>
        </div>
      </div>
    );
  }

  // If not logged in - show auth modal ONLY
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900">
        <AuthModal 
          isOpen={true} 
          onClose={() => {}} 
        />
      </div>
    );
  }

  const isRTL = i18n.language === 'he' || i18n.language === 'ar';
  const storageStats = getStorageStats();

  return (
    <div className={`min-h-screen bg-gray-900 text-white ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* User Profile Modal */}
      {showUserProfile && (
        <UserProfile 
          isOpen={showUserProfile} 
          onClose={() => setShowUserProfile(false)} 
        />
      )}

      {/* Storage Warning */}
      {showStorageWarning && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-600/90 backdrop-blur-sm px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>אזהרה: אחסון מלא ({storageStats.totalSizeMB} MB). מחק הקלטות ישנות.</span>
            </div>
            <button 
              onClick={() => setShowStorageWarning(false)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`sticky ${showStorageWarning ? 'top-12' : 'top-0'} z-30 bg-gray-800/90 backdrop-blur-lg border-b border-gray-700 transition-all`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">
                {settings.stealthMode ? settings.fakeAppName : 'מצלמת הדרך'}
              </h1>
              {!settings.stealthMode && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {isAuthenticated ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <User className="w-3 h-3" />
                      מחובר
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <User className="w-3 h-3" />
                      אורח
                    </span>
                  )}
                  {!isOnline && (
                    <span className="flex items-center gap-1 text-red-400">
                      <WifiOff className="w-3 h-3" />
                      offline
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            
            <button
              onClick={() => setIsStatsOpen(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors relative"
              title="סטטיסטיקות"
            >
              <BarChart3 className="w-5 h-5" />
              {recordings.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-500 rounded-full text-xs flex items-center justify-center">
                  {recordings.length > 99 ? '99+' : recordings.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="הגדרות"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User menu */}
            {isAuthenticated ? (
              <button
                onClick={() => setShowUserProfile(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-cyan-400"
                title="פרופיל"
              >
                <User className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-yellow-400"
                title="התחבר"
              >
                <LogOut className="w-5 h-5 rotate-180" />
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-red-400"
              title="התנתק"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-4 pb-24">
        {storageLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="mr-3 text-gray-400">טוען הקלטות...</span>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* Camera */}
            <SimpleCamera
              currentSpeed={location?.speed || null}
              speedLimit={settings.speedLimit}
              isEmergency={isEmergency}
              onEmergencyStart={activateEmergency}
              onRecordingComplete={handleRecordingComplete}
              currentLocation={location}
            />

            {/* Location Status */}
            <LocationStatus
              location={location}
              isTracking={isTracking}
              speedLimit={settings.speedLimit}
            />

            {/* Storage & Cloud Info */}
            <div className="grid grid-cols-2 gap-3">
              {/* Local Storage */}
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Video className="w-4 h-4" />
                  <span>אחסון מקומי</span>
                </div>
                <div className="text-2xl font-bold">{recordings.length}</div>
                <div className="text-xs text-gray-500">{storageStats.totalSizeMB} MB</div>
                <button
                  onClick={() => clearOldRecordings(30, 7)}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  נקה ישנות
                </button>
              </div>

              {/* Cloud Storage */}
              <div className="bg-gray-800/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Cloud className="w-4 h-4" />
                  <span>ענן</span>
                  {isOnline ? (
                    <Wifi className="w-3 h-3 text-green-400" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {isAnonymous() ? '—' : Object.keys(uploadProgress).length}
                </div>
                <div className="text-xs text-gray-500">
                  {isAnonymous() ? 'נדרשת התחברות' : 'הקלטות בענן'}
                </div>
                {!isAnonymous() && (
                  <button
                    onClick={handleSyncAll}
                    disabled={!isOnline}
                    className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 disabled:opacity-50"
                  >
                    <Upload className="w-3 h-3" />
                    סנכרן הכל
                  </button>
                )}
              </div>
            </div>

            {/* Recordings List */}
            <RecordingList
              recordings={recordings}
              onDelete={handleDelete}
              onUpload={handleUpload}
              uploadProgress={uploadProgress}
              isAnonymous={isAnonymous()}
            />
          </div>
        )}
      </main>

      {/* Emergency Button */}
      {settings.sosEnabled && (
        <EmergencyButton
          isActive={isEmergency}
          countdown={settings.sosCountdown}
          onActivate={activateEmergency}
          onCancel={cancelEmergency}
          onConfirm={confirmEmergency}
        />
      )}

      {/* Statistics Panel */}
      <Statistics
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        formatDuration={formatDuration}
        onExport={exportStats}
        onReset={resetStats}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        onReset={() => updateSettings({})}
      />
    </div>
  );
}

export default App;
