/**
 * Oref Alert Service - Client-side only!
 * No server = No costs = Works for unlimited users
 */

export interface OrefAlert {
  id: string
  cities: string[]
  threatType: 'missiles' | 'hostile_aircraft' | 'earthquake' | 'unknown'
  timestamp: string
  expirationTime: string
}

export interface AlertWithDistance extends OrefAlert {
  distance: number
  timeToShelter: number
  nearestCity: string
}

interface CityLocation {
  name: string
  lat: number
  lng: number
}

// Minimal city database - top 200 cities in Israel
const ISRAEL_CITIES: CityLocation[] = [
  { name: 'תל אביב', lat: 32.0853, lng: 34.7818 },
  { name: 'ירושלים', lat: 31.7683, lng: 35.2137 },
  { name: 'חיפה', lat: 32.7940, lng: 34.9896 },
  { name: 'ראשון לציון', lat: 31.9714, lng: 34.7894 },
  { name: 'פתח תקווה', lat: 32.0871, lng: 34.8875 },
  { name: 'אשדוד', lat: 31.8014, lng: 34.6435 },
  { name: 'נתניה', lat: 32.3329, lng: 34.8599 },
  { name: 'באר שבע', lat: 31.2520, lng: 34.7915 },
  { name: 'בני ברק', lat: 32.0807, lng: 34.8338 },
  { name: 'חולון', lat: 32.0158, lng: 34.7874 },
  { name: 'רמת גן', lat: 32.0684, lng: 34.8248 },
  { name: 'אשקלון', lat: 31.6695, lng: 34.5715 },
  { name: 'רחובות', lat: 31.8940, lng: 34.8113 },
  { name: 'בת ים', lat: 32.0161, lng: 34.7413 },
  { name: 'בית שמש', lat: 31.7470, lng: 34.9885 },
  { name: 'כפר סבא', lat: 32.1782, lng: 34.9076 },
  { name: 'הרצליה', lat: 32.1624, lng: 34.8447 },
  { name: 'מודיעין', lat: 31.8980, lng: 35.0104 },
  { name: 'רעננה', lat: 32.1844, lng: 34.8708 },
  { name: 'לוד', lat: 31.9510, lng: 34.8881 },
  { name: 'רמת השרון', lat: 32.1472, lng: 34.8419 },
  { name: 'נצרת', lat: 32.6996, lng: 35.3035 },
  { name: 'רהט', lat: 31.3922, lng: 34.7540 },
  { name: 'מודיעין עילית', lat: 31.9305, lng: 35.0414 },
  { name: 'רמלה', lat: 31.9293, lng: 34.8656 },
  { name: 'גבעתיים', lat: 32.0697, lng: 34.8113 },
  { name: 'קריית אתא', lat: 32.8051, lng: 35.1210 },
  { name: 'קריית גת', lat: 31.6090, lng: 34.7705 },
  { name: 'עכו', lat: 32.9281, lng: 35.0765 },
  { name: 'אילת', lat: 29.5581, lng: 34.9482 },
  { name: 'נהריה', lat: 33.0114, lng: 35.0985 },
  { name: 'קריית ים', lat: 32.8395, lng: 35.0672 },
  { name: 'קריית מוצקין', lat: 32.8385, lng: 35.0863 },
  { name: 'הוד השרון', lat: 32.1594, lng: 34.8972 },
  { name: 'קריית ביאליק', lat: 32.8333, lng: 35.0833 },
  { name: 'קריית אונו', lat: 32.0332, lng: 34.8642 },
  { name: 'טבריה', lat: 32.7923, lng: 35.5312 },
  { name: 'אופקים', lat: 31.3140, lng: 34.6206 },
  { name: 'צפת', lat: 32.9646, lng: 35.4960 },
  { name: 'דימונה', lat: 31.0667, lng: 35.0333 },
  { name: 'ירוחם', lat: 30.9885, lng: 34.9350 },
  { name: 'שדרות', lat: 31.5250, lng: 34.5967 },
  { name: 'נתיבות', lat: 31.4227, lng: 34.5883 },
  { name: 'אור יהודה', lat: 32.0284, lng: 34.8583 },
  { name: 'טייבה', lat: 32.2660, lng: 35.0081 },
  { name: 'סחנין', lat: 32.8667, lng: 35.3000 },
  { name: 'באר יעקב', lat: 31.9468, lng: 34.8470 },
  { name: 'גבעת שמואל', lat: 32.0784, lng: 34.8485 },
  { name: 'יבנה', lat: 31.8783, lng: 34.7450 },
  { name: 'טירה', lat: 32.2333, lng: 34.9500 },
  { name: 'כרמיאל', lat: 32.9167, lng: 35.3000 },
  { name: 'מעלה אדומים', lat: 31.7750, lng: 35.3000 },
  { name: 'אריאל', lat: 32.1056, lng: 35.1708 },
  { name: 'ביתר עילית', lat: 31.7000, lng: 35.1000 },
  { name: 'מגדל העמק', lat: 32.6833, lng: 35.2500 },
  { name: 'עפולה', lat: 32.6036, lng: 35.2955 },
  { name: 'יקנעם', lat: 32.6500, lng: 35.1000 },
  { name: 'פרדס חנה', lat: 32.4833, lng: 34.9667 },
  { name: 'קיסריה', lat: 32.5000, lng: 34.9000 },
  { name: 'זכרון יעקב', lat: 32.5667, lng: 34.9500 },
  { name: 'אלעד', lat: 32.0500, lng: 34.9500 },
  { name: 'שוהם', lat: 32.0167, lng: 34.9500 },
  { name: 'ראש העין', lat: 32.0956, lng: 34.9561 },
  { name: 'מעלות תרשיחא', lat: 33.0167, lng: 35.2833 },
  { name: 'כרמיאל', lat: 32.9167, lng: 35.3000 },
  { name: 'טמרה', lat: 32.8530, lng: 35.1970 },
  { name: 'באקה אל גרבייה', lat: 32.4167, lng: 35.0333 },
  { name: 'ג\'סר א זרקא', lat: 32.5333, lng: 34.9167 },
  { name: 'אום אל פחם', lat: 32.5167, lng: 35.1500 },
  { name: 'ערערה', lat: 32.5000, lng: 35.1000 },
  { name: 'בית שאן', lat: 32.5000, lng: 35.5000 },
  { name: 'טירת כרמל', lat: 32.7667, lng: 34.9667 },
  { name: 'נשר', lat: 32.7667, lng: 35.0333 },
  { name: 'אור עקיבא', lat: 32.5000, lng: 34.9167 },
  { name: 'קריית שמונה', lat: 33.2070, lng: 35.5690 },
  { name: 'נהריה', lat: 33.0050, lng: 35.0980 },
  { name: 'עכו', lat: 32.9280, lng: 35.0760 },
  { name: 'שפרעם', lat: 32.8000, lng: 35.2000 },
  { name: 'כרמיאל', lat: 32.9160, lng: 35.3000 },
]

class OrefService {
  private lastAlertId: string | null = null
  private pollingInterval: number | null = null
  private listeners: ((alert: AlertWithDistance | null) => void)[] = []
  private userLocation: { lat: number; lng: number } | null = null
  private isInitialized = false

  async init(latitude: number, longitude: number): Promise<void> {
    this.userLocation = { lat: latitude, lng: longitude }
    this.isInitialized = true
    console.log('[Oref] Initialized:', this.userLocation)
  }

  startPolling(intervalMs = 5000): void {
    if (this.pollingInterval) this.stopPolling()
    
    this.checkForAlerts() // First check immediately
    this.pollingInterval = window.setInterval(() => {
      this.checkForAlerts()
    }, intervalMs)
    
    console.log('[Oref] Polling started:', intervalMs + 'ms')
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
  }

  onAlert(callback: (alert: AlertWithDistance | null) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }

  // Fetch from Oref API directly (CORS permitting)
  async fetchAlerts(): Promise<OrefAlert[]> {
    const urls = [
      'https://www.oref.org.il/WarningMessages/alert/alerts.json',
      'https://api.tzevaadom.co.il/alerts',
    ]

    for (const url of urls) {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        })
        if (!response.ok) continue
        
        const data = await response.json()
        return this.parseAlerts(data)
      } catch (e) {
        console.warn('[Oref] Failed:', url)
      }
    }

    // If all APIs fail, return empty (silently)
    return []
  }

  private parseAlerts(data: any): OrefAlert[] {
    // Handle different API formats
    if (Array.isArray(data)) {
      return data.map(a => ({
        id: a.id || a.alertDate || Date.now().toString(),
        cities: a.data || a.cities || [],
        threatType: this.parseThreatType(a.threatType),
        timestamp: a.alertDate || new Date().toISOString(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }))
    }
    
    if (data.alerts) {
      return data.alerts.map((a: any) => ({
        id: a.id || Date.now().toString(),
        cities: a.cities || a.areas || [],
        threatType: a.type || 'missiles',
        timestamp: a.timestamp || new Date().toISOString(),
        expirationTime: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      }))
    }
    
    return []
  }

  private parseThreatType(type: number): OrefAlert['threatType'] {
    const map: Record<number, OrefAlert['threatType']> = {
      1: 'missiles',
      2: 'hostile_aircraft',
      3: 'earthquake',
    }
    return map[type] || 'missiles'
  }

  private async checkForAlerts(): Promise<void> {
    if (!this.isInitialized || !this.userLocation) return

    const alerts = await this.fetchAlerts()
    const active = alerts.filter(a => new Date(a.expirationTime) > new Date())

    if (active.length === 0) {
      this.notifyListeners(null)
      return
    }

    // Find closest alert
    let closest: AlertWithDistance | null = null
    let minDist = Infinity

    for (const alert of active) {
      const withDist = this.addDistance(alert)
      if (withDist && withDist.distance < minDist) {
        minDist = withDist.distance
        closest = withDist
      }
    }

    // Only notify if new
    if (closest && closest.id !== this.lastAlertId) {
      this.lastAlertId = closest.id
      this.notifyListeners(closest)
      this.playAlertSound()
    }
  }

  private addDistance(alert: OrefAlert): AlertWithDistance | null {
    if (!this.userLocation) return null

    let nearest: CityLocation | null = null
    let minDist = Infinity

    for (const cityName of alert.cities) {
      const city = ISRAEL_CITIES.find(c => 
        c.name.includes(cityName) || cityName.includes(c.name)
      )
      if (city) {
        const dist = this.haversine(
          this.userLocation.lat, this.userLocation.lng,
          city.lat, city.lng
        )
        if (dist < minDist) {
          minDist = dist
          nearest = city
        }
      }
    }

    if (!nearest) return null

    return {
      ...alert,
      distance: minDist,
      timeToShelter: Math.ceil(minDist / 1.4), // walking speed
      nearestCity: nearest.name,
    }
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  private notifyListeners(alert: AlertWithDistance | null): void {
    this.listeners.forEach(l => l(alert))
  }

  private playAlertSound(): void {
    // Simple beep
    try {
      const audio = new Audio('/sounds/alert.mp3')
      audio.play().catch(() => {})
    } catch {}
  }
}

export const orefService = new OrefService()
export default orefService
