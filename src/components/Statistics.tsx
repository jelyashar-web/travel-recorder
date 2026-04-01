import { X, BarChart3, Download, RotateCcw, TrendingUp, Clock, Gauge, AlertTriangle, Video, Navigation, Calendar } from 'lucide-react';
import { DrivingStats } from '../hooks/useStatistics';

interface StatisticsProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DrivingStats;
  formatDuration: (seconds: number) => string;
  onExport: () => void;
  onReset: () => void;
}

export function Statistics({ 
  isOpen, 
  onClose, 
  stats, 
  formatDuration,
  onExport,
  onReset 
}: StatisticsProps) {
  if (!isOpen) return null;

  const statCards = [
    {
      icon: Video,
      label: 'סהכ הקלטות',
      value: stats.totalRecordings,
      color: 'cyan',
    },
    {
      icon: Clock,
      label: 'זמן נסיעה',
      value: formatDuration(stats.totalDrivingTime),
      color: 'blue',
    },
    {
      icon: Navigation,
      label: 'מרחק מוערך',
      value: `${stats.totalDistance.toFixed(1)} קמ`,
      color: 'green',
    },
    {
      icon: Gauge,
      label: 'מהירות ממוצעת',
      value: `${stats.avgSpeed} קמ\"ש`,
      color: 'purple',
    },
    {
      icon: Gauge,
      label: 'מהירות מרבית',
      value: `${stats.maxSpeed} קמ\"ש`,
      color: 'orange',
    },
    {
      icon: AlertTriangle,
      label: 'חריגות מהירות',
      value: stats.speedingEvents,
      color: stats.speedingEvents > 0 ? 'red' : 'gray',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gradient-to-r from-gray-800 to-gray-750">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold">סטטיסטיקות</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {stats.totalRecordings === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">אין עדיין נתונים</p>
              <p className="text-gray-500 text-sm mt-2">
                התחל להקליט כדי לראות סטטיסטיקות
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {statCards.map((card, index) => (
                  <div 
                    key={index}
                    className="bg-gray-700/30 rounded-xl p-4 border border-gray-700/50 hover:border-gray-600 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-${card.color}-500/20`}>
                      <card.icon className={`w-5 h-5 text-${card.color}-400`} />
                    </div>
                    <p className="text-gray-400 text-sm mb-1">{card.label}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                  </div>
                ))}
              </div>

              {/* Weekly Summary */}
              <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-700/50 mb-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  השבוע האחרון
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">{stats.thisWeekRecordings}</div>
                    <div className="text-xs text-gray-400">הקלטות</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">{formatDuration(stats.thisWeekDrivingTime)}</div>
                    <div className="text-xs text-gray-400">זמן נסיעה</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">{stats.thisWeekDistance.toFixed(1)} קמ</div>
                    <div className="text-xs text-gray-400">מרחק</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-700/50">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  סיכום
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>
                    • הקלטת <strong className="text-white">{stats.totalRecordings}</strong> נסיעות
                  </p>
                  <p>
                    • זמן כולל של <strong className="text-white">{formatDuration(stats.totalDrivingTime)}</strong>
                  </p>
                  {stats.emergencyRecordings > 0 && (
                    <p className="text-red-400">
                      • <strong>{stats.emergencyRecordings}</strong> הקלטות חירום
                    </p>
                  )}
                  {stats.speedingEvents > 0 && (
                    <p className="text-yellow-400">
                      • נרשמו <strong>{stats.speedingEvents}</strong> חריגות מהירות
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-700/50 bg-gray-800/50">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            אפס
          </button>
          <button
            onClick={onExport}
            disabled={stats.totalRecordings === 0}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            ייצא סטטיסטיקות
          </button>
        </div>
      </div>
    </div>
  );
}
