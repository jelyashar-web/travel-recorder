import { useState } from 'react'
import { useAuth, useRecordings } from '../hooks/useSupabase'
import { Cloud, CloudOff, Upload, Check, Loader2 } from 'lucide-react'

interface CloudSyncButtonProps {
  recordings: any[]
  onSync?: () => void
}

export function CloudSyncButton({ recordings, onSync }: CloudSyncButtonProps) {
  const { user } = useAuth()
  const { uploadRecording } = useRecordings()
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [progress, setProgress] = useState(0)

  if (!user) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-slate-400">
        <CloudOff className="w-5 h-5" />
        <span className="text-sm">Войдите для синхронизации</span>
      </div>
    )
  }

  const handleSync = async () => {
    const localRecordings = recordings.filter(r => r.isLocal && r.blob)
    if (localRecordings.length === 0) return

    setSyncing(true)
    setSynced(false)
    setProgress(0)

    let completed = 0
    for (const rec of localRecordings) {
      try {
        await uploadRecording(rec.blob, {
          duration: rec.duration,
          gpsData: rec.gpsData
        })
        completed++
        setProgress(Math.round((completed / localRecordings.length) * 100))
      } catch (e) {
        console.error('Sync error:', e)
      }
    }

    setSyncing(false)
    setSynced(true)
    onSync?.()
    
    setTimeout(() => setSynced(false), 3000)
  }

  const localCount = recordings.filter(r => r.isLocal && r.blob).length

  if (localCount === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-500/50 text-green-400">
        <Cloud className="w-5 h-5" />
        <span className="text-sm">Все записи синхронизированы</span>
      </div>
    )
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all
        ${synced 
          ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
          : 'bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30'
        }
        disabled:cursor-not-allowed
      `}
    >
      {syncing ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">{progress}%</span>
        </>
      ) : synced ? (
        <>
          <Check className="w-5 h-5" />
          <span className="text-sm">Синхронизировано!</span>
        </>
      ) : (
        <>
          <Upload className="w-5 h-5" />
          <span className="text-sm">Синхронизировать ({localCount})</span>
        </>
      )}
    </button>
  )
}
