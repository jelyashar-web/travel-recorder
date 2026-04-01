export interface GeoLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

export interface Recording {
  id: string;
  url: string;
  blob: Blob;
  timestamp: number;
  duration: number;
  location: GeoLocation | null;
  uploaded: boolean;
  uploadUrl?: string;
  isEmergency: boolean;
}

export interface AccidentData {
  timestamp: number;
  location: GeoLocation | null;
  acceleration: { x: number; y: number; z: number };
  severity: 'low' | 'medium' | 'high';
}

export interface AppSettings {
  // Запись
  autoStartRecording: boolean;
  recordingQuality: 'low' | 'medium' | 'high';
  maxRecordingDuration: number; // в минутах
  
  // Безопасность
  speedLimit: number; // км/ч
  accidentDetection: boolean;
  accidentSensitivity: 'low' | 'medium' | 'high';
  
  // Загрузка
  autoUpload: boolean;
  uploadOnWifiOnly: boolean;
  emergencyUploadImmediately: boolean;
  
  // SOS
  sosEnabled: boolean;
  emergencyContacts: string[];
  sosCountdown: number; // секунд
  
  // Скрытый режим
  stealthMode: boolean;
  fakeAppName: string;
  
  // Автоудаление
  autoDeleteDays: number; // дней до автоматического удаления (0 = отключено)
  keepEmergencyRecordings: boolean; // сохранять экстренные записи
}

// יומן רכב - נסיעות
export interface Trip {
  id: string;
  startTime: number;
  endTime: number;
  startLocation?: GeoLocation;
  endLocation?: GeoLocation;
  distance: number; // ק"מ
  duration: number; // דקות
  avgSpeed: number; // קמ"ש
  maxSpeed: number; // קמ"ש
  fuelCost?: number; // ש"ח
  purpose?: string; // מטרת הנסיעה
  notes?: string;
  recordingIds: string[]; // קישור להקלטות
}

// יומן רכב - תדלוק
export interface FuelRecord {
  id: string;
  timestamp: number;
  location?: GeoLocation;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number; // קילומטראז'
  fullTank: boolean; // האם תדלוק מלא
  station?: string; // שם תחנת דלק
  fuelType: '95' | '98' | 'diesel' | 'electric';
}

// יומן רכב - טיפולים
export interface MaintenanceRecord {
  id: string;
  timestamp: number;
  type: 'oil' | 'tires' | 'brakes' | 'battery' | 'inspection' | 'cleaning' | 'other';
  odometer: number;
  cost: number;
  provider?: string; // מוסך/בעל מקצוע
  description: string;
  nextDueOdometer?: number; // מתי הטיפול הבא לפי ק"מ
  nextDueDate?: number; // מתי הטיפול הבא לפי תאריך
  reminders: boolean;
}

// מידע על הרכב
export interface VehicleInfo {
  make: string; // יצרן
  model: string; // דגם
  year: number; // שנת ייצור
  licensePlate: string; // מספר רישוי
  color: string;
  vin?: string; // מספר שילדה
  initialOdometer: number;
  currentOdometer: number;
  fuelTankCapacity: number; // ליטרים
}

// סטטיסטיקות
export interface VehicleStats {
  totalDistance: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalTrips: number;
  avgFuelConsumption: number; // ליטר ל-100 ק"מ
  avgCostPerKm: number; // ש"ח לק"מ
  thisMonthDistance: number;
  thisMonthFuelCost: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  autoStartRecording: false,
  recordingQuality: 'high',
  maxRecordingDuration: 30,
  
  speedLimit: 120,
  accidentDetection: true,
  accidentSensitivity: 'medium',
  
  autoUpload: false,
  uploadOnWifiOnly: true,
  emergencyUploadImmediately: true,
  
  sosEnabled: true,
  emergencyContacts: [],
  sosCountdown: 5,
  
  stealthMode: false,
  fakeAppName: 'Калькулятор',
  
  autoDeleteDays: 7, // по умолчанию хранить неделю
  keepEmergencyRecordings: true, // экстренные записи сохранять всегда
};
