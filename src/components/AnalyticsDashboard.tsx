import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  BarChart3, TrendingUp, Calendar, Clock, 
  HardDrive, MapPin, Activity, Download
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AnalyticsData {
  totalRecordings: number
  totalDuration: number
  totalSize: number
  dailyStats: Array<{
    date: string
    count: number
    duration: number
    size: number
  }>
  speedViolations: number
  emergencyEvents: number
  averageSpeed: number
}

export function AnalyticsDashboard() {
  const { t } = useTranslation()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    
    // Calculate date range
    const now = new Date()
    const startDate = new Date()
    switch (dateRange) {
      case '7d': startDate.setDate(now.getDate() - 7); break
      case '30d': startDate.setDate(now.getDate() - 30); break
      case '90d': startDate.setDate(now.getDate() - 90); break
      case 'all': startDate.setFullYear(2000); break
    }

    // Fetch from database
    const { data: recordings, error } = await supabase
      .from('recordings')
      .select('*')
      .gte('created_at', startDate.toISOString())

    if (error) {
      console.error('Analytics error:', error)
      setLoading(false)
      return
    }

    // Calculate stats
    const totalRecordings = recordings?.length || 0
    const totalDuration = recordings?.reduce((sum, r) => sum + (r.duration || 0), 0) || 0
    const totalSize = recordings?.reduce((sum, r) => sum + (r.size || 0), 0) || 0
    const emergencyEvents = recordings?.filter(r => r.is_emergency).length || 0

    // Group by day
    const dailyMap = new Map()
    recordings?.forEach(r => {
      const date = new Date(r.created_at).toLocaleDateString()
      const existing = dailyMap.get(date) || { count: 0, duration: 0, size: 0 }
      dailyMap.set(date, {
        count: existing.count + 1,
        duration: existing.duration + (r.duration || 0),
        size: existing.size + (r.size || 0)
      })
    })

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    setData({
      totalRecordings,
      totalDuration,
      totalSize,
      dailyStats,
      speedViolations: 0,
      emergencyEvents,
      averageSpeed: 0
    })
    
    setLoading(false)
  }

  const exportReport = () => {
    if (!data) return

    const report = {
      generatedAt: new Date().toISOString(),
      period: dateRange,
      summary: {
        totalRecordings: data.totalRecordings,
        totalDuration: formatDuration(data.totalDuration),
        totalSize: formatSize(data.totalSize),
        emergencyEvents: data.emergencyEvents
      },
      dailyStats: data.dailyStats
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${dateRange}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${mins}m`
  }

  const formatSize = (bytes: number) => {
    const gb = bytes / (1024 * 1024 * 1024)
    return `${gb.toFixed(2)} GB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          {t('analytics.title')}
        </h2>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm border border-slate-700"
          >
            <option value="7d">7 {t('time.days')}</option>
            <option value="30d">30 {t('time.days')}</option>
            <option value="90d">90 {t('time.days')}</option>
            <option value="all">{t('time.allTime')}</option>
          </select>
          
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('analytics.export')}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          label={t('analytics.recordings')}
          value={data.totalRecordings.toString()}
          trend="+12%"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-green-400" />}
          label={t('analytics.duration')}
          value={formatDuration(data.totalDuration)}
        />
        <StatCard
          icon={<HardDrive className="w-5 h-5 text-purple-400" />}
          label={t('analytics.storage')}
          value={formatSize(data.totalSize)}
        />
        <StatCard
          icon={<MapPin className="w-5 h-5 text-red-400" />}
          label={t('analytics.emergency')}
          value={data.emergencyEvents.toString()}
          highlight={data.emergencyEvents > 0}
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            {t('analytics.dailyActivity')}
          </h3>
          
          <div className="space-y-2">
            {data.dailyStats.slice(-7).map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-sm text-slate-400 w-20">{day.date}</span>
                <div className="flex-1 h-8 bg-slate-700 rounded-lg overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg transition-all"
                    style={{ 
                      width: `${Math.min((day.count / Math.max(...data.dailyStats.map(d => d.count))) * 100, 100)}%` 
                    }}
                  />
                </div>
                <span className="text-sm text-white w-8">{day.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage Trends */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            {t('analytics.trends')}
          </h3>
          
          <div className="space-y-4">
            <TrendItem
              label={t('analytics.avgPerDay')}
              value={(data.totalRecordings / Math.max(data.dailyStats.length, 1)).toFixed(1)}
            />
            <TrendItem
              label={t('analytics.avgDuration')}
              value={formatDuration(data.totalDuration / Math.max(data.totalRecordings, 1))}
            />
            <TrendItem
              label={t('analytics.storagePerRecording')}
              value={formatSize(data.totalSize / Math.max(data.totalRecordings, 1))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  trend,
  highlight = false 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  trend?: string
  highlight?: boolean
}) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      highlight 
        ? 'bg-red-500/10 border-red-500/50' 
        : 'bg-slate-800 border-slate-700'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className={`text-sm ${highlight ? 'text-red-400' : 'text-slate-400'}`}>
          {label}
        </span>
      </div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${highlight ? 'text-red-400' : 'text-white'}`}>
          {value}
        </span>
        {trend && (
          <span className="text-xs text-green-400 mb-1">{trend}</span>
        )}
      </div>
    </div>
  )
}

function TrendItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  )
}
