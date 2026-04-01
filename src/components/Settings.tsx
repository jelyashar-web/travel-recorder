import { useState } from 'react';
import { 
  X, Settings2, Video, Shield, Cloud, Users, 
  Eye, Save, RotateCcw, ChevronDown, ChevronUp,
  Trash2, Database
} from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onReset: () => void;
}

type SectionKey = 'recording' | 'safety' | 'cloud' | 'sos' | 'stealth' | 'storage';

export function Settings({ isOpen, onClose, settings, onUpdateSettings, onReset }: SettingsProps) {
  const [expandedSections, setExpandedSections] = useState<SectionKey[]>(['recording']);

  const toggleSection = (section: SectionKey) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (!isOpen) return null;

  const Section = ({ 
    id, 
    title, 
    icon: Icon, 
    children 
  }: { 
    id: SectionKey; 
    title: string; 
    icon: React.ElementType; 
    children: React.ReactNode 
  }) => {
    const isExpanded = expandedSections.includes(id);
    return (
      <div className="border-b border-gray-700/50 last:border-0">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-cyan-400" />
            <span className="font-semibold">{title}</span>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        {isExpanded && <div className="p-4 pt-0 space-y-4">{children}</div>}
      </div>
    );
  };

  const Switch = ({ 
    checked, 
    onChange 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void 
  }) => (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        checked ? 'bg-cyan-500' : 'bg-gray-600'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
        checked ? 'right-0.5' : 'left-0.5'
      }`} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800 to-gray-750">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-bold">הגדרות</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          {/* הקלטה */}
          <Section id="recording" title="הגדרות הקלטה" icon={Video}>
            <div className="flex items-center justify-between">
              <label className="text-gray-300">התחל הקלטה אוטומטית</label>
              <Switch 
                checked={settings.autoStartRecording}
                onChange={(v) => onUpdateSettings({ autoStartRecording: v })}
              />
            </div>
            
            <div>
              <label className="block mb-2 text-gray-300">איכות הקלטה</label>
              <select
                value={settings.recordingQuality}
                onChange={(e) => onUpdateSettings({ recordingQuality: e.target.value as any })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="low">נמוכה (640x480) - חיסכון בזיכרון</option>
                <option value="medium">בינונית (1280x720)</option>
                <option value="high">גבוהה (1920x1080) HD</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-gray-300">משך מקסימלי (דקות)</label>
              <input
                type="number"
                value={settings.maxRecordingDuration}
                onChange={(e) => onUpdateSettings({ maxRecordingDuration: parseInt(e.target.value) || 30 })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                min="1"
                max="120"
              />
              <p className="text-xs text-gray-500 mt-1">הקלטות ארוכות מחולקות אוטומטית</p>
            </div>
          </Section>

          {/* בטיחות */}
          <Section id="safety" title="בטיחות בדרכים" icon={Shield}>
            <div>
              <label className="block mb-2 text-gray-300">מגבלת מהירות (קמ"ש)</label>
              <input
                type="number"
                value={settings.speedLimit}
                onChange={(e) => onUpdateSettings({ speedLimit: parseInt(e.target.value) || 120 })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                min="30"
                max="200"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300">זיהוי תאונה אוטומטי</label>
              <Switch 
                checked={settings.accidentDetection}
                onChange={(v) => onUpdateSettings({ accidentDetection: v })}
              />
            </div>

            {settings.accidentDetection && (
              <div>
                <label className="block mb-2 text-gray-300">רגישות זיהוי</label>
                <select
                  value={settings.accidentSensitivity}
                  onChange={(e) => onUpdateSettings({ accidentSensitivity: e.target.value as any })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="low">נמוכה - רק תאונות חמורות</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה - כולל בלימות פתאומיות</option>
                </select>
              </div>
            )}
          </Section>

          {/* ענן */}
          <Section id="cloud" title="גיבוי לענן" icon={Cloud}>
            <div className="flex items-center justify-between">
              <label className="text-gray-300">העלאה אוטומטית</label>
              <Switch 
                checked={settings.autoUpload}
                onChange={(v) => onUpdateSettings({ autoUpload: v })}
              />
            </div>

            {settings.autoUpload && (
              <div className="flex items-center justify-between">
                <label className="text-gray-300">העלה רק ב-WiFi</label>
                <Switch 
                  checked={settings.uploadOnWifiOnly}
                  onChange={(v) => onUpdateSettings({ uploadOnWifiOnly: v })}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="text-gray-300">העלה מיידית במצב חירום</label>
              <Switch 
                checked={settings.emergencyUploadImmediately}
                onChange={(v) => onUpdateSettings({ emergencyUploadImmediately: v })}
              />
            </div>
          </Section>

          {/* SOS */}
          <Section id="sos" title="SOS - מצב חירום" icon={Users}>
            <div className="flex items-center justify-between">
              <label className="text-gray-300">הפעל כפתור SOS</label>
              <Switch 
                checked={settings.sosEnabled}
                onChange={(v) => onUpdateSettings({ sosEnabled: v })}
              />
            </div>

            <div>
              <label className="block mb-2 text-gray-300">ספירה לאחור (שניות)</label>
              <input
                type="number"
                value={settings.sosCountdown}
                onChange={(e) => onUpdateSettings({ sosCountdown: parseInt(e.target.value) || 5 })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                min="1"
                max="30"
              />
              <p className="text-xs text-gray-500 mt-1">זמן לביטול לפני שליחה אוטומטית</p>
            </div>

            <div>
              <label className="block mb-2 text-gray-300">אנשי קשר לחירום</label>
              <textarea
                value={settings.emergencyContacts.join(', ')}
                onChange={(e) => onUpdateSettings({ 
                  emergencyContacts: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                placeholder="+972501234567, +972507654321"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 h-20 resize-none text-white focus:border-cyan-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">הפרד מספרים בפסיקים</p>
            </div>
          </Section>

          {/* מצב חשאי */}
          <Section id="stealth" title="מצב חשאי" icon={Eye}>
            <div className="flex items-center justify-between">
              <label className="text-gray-300">הפעל מצב חשאי</label>
              <Switch 
                checked={settings.stealthMode}
                onChange={(v) => onUpdateSettings({ stealthMode: v })}
              />
            </div>

            {settings.stealthMode && (
              <div>
                <label className="block mb-2 text-gray-300">שם מטעה</label>
                <input
                  type="text"
                  value={settings.fakeAppName}
                  onChange={(e) => onUpdateSettings({ fakeAppName: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="מחשבון"
                />
                <p className="text-xs text-gray-500 mt-1">שם שיוצג במקום שם האפליקציה</p>
              </div>
            )}
          </Section>

          {/* אחסון */}
          <Section id="storage" title="ניהול אחסון" icon={Database}>
            <div>
              <label className="block mb-2 text-gray-300">מחיקה אוטומטית לאחר (ימים)</label>
              <input
                type="number"
                value={settings.autoDeleteDays}
                onChange={(e) => onUpdateSettings({ autoDeleteDays: parseInt(e.target.value) || 0 })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                min="0"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">0 = ללא מחיקה אוטומטית</p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-gray-300">שמור הקלטות חירום לתמיד</label>
              <Switch 
                checked={settings.keepEmergencyRecordings}
                onChange={(v) => onUpdateSettings({ keepEmergencyRecordings: v })}
              />
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <Trash2 className="w-4 h-4" />
                <span className="font-bold">נקה אחסון</span>
              </div>
              <p className="text-sm text-gray-400 mb-2">מחק את כל ההקלטות המקומיות</p>
              <button
                onClick={() => {
                  if (confirm('האם אתה בטוח? פעולה זו תמחק את כל ההקלטות!')) {
                    onUpdateSettings({ autoDeleteDays: 1 });
                  }
                }}
                className="text-sm text-red-400 hover:text-red-300"
              >
                נקה הכל
              </button>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-700/50 bg-gray-800/50">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            איפוס
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            שמור
          </button>
        </div>
      </div>
    </div>
  );
}
