import { useState } from 'react';
import { 
  Play, Download, Trash2, Cloud, CheckCircle, 
  AlertCircle, MapPin, Clock, Video, Shield,
  Scale, Upload, WifiOff, Loader2
} from 'lucide-react';
import { Recording } from '../types';
import { CourtExport } from './CourtExport';

interface UploadProgress {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface RecordingListProps {
  recordings: Recording[];
  onDelete: (id: string, cloudFilePath?: string) => void;
  onUpload: (recording: Recording) => void;
  uploadProgress: Record<string, UploadProgress>;
  isAnonymous: boolean;
}

export function RecordingList({ 
  recordings, 
  onDelete, 
  onUpload,
  uploadProgress,
  isAnonymous
}: RecordingListProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [courtExportRecording, setCourtExportRecording] = useState<Recording | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('he-IL', {
      day: '2-digit',
      month:'2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSize = (bytes: number): string => {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDelete = async (recording: Recording) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הקלטה זו?')) return;
    
    setDeletingId(recording.id);
    const cloudPath = uploadProgress[recording.id]?.url;
    await onDelete(recording.id, cloudPath);
    setDeletingId(null);
  };

  const getUploadStatusIcon = (recordingId: string) => {
    const status = uploadProgress[recordingId]?.status;
    
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  if (recordings.length === 0) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700">
        <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">אין הקלטות עדיין</p>
        <p className="text-gray-500 text-sm mt-2">התחל להקליט את הנסיעה הראשונה שלך!</p>
        {isAnonymous && (
          <p className="text-yellow-500/80 text-xs mt-4">
            שים לב: כאורח, ההקלטות נשמרות רק במכשיר
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-800/50 rounded-xl overflow-hidden border border-gray-700">
        <div className="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Video className="w-5 h-5 text-cyan-400" />
            ההקלטות שלי ({recordings.length})
          </h3>
          {isAnonymous && (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <WifiOff className="w-3 h-3" />
              מצב אורח
            </span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {recordings.map((recording) => {
            const uploadStatus = uploadProgress[recording.id];
            const isInCloud = uploadStatus?.status === 'success';
            const isUploading = uploadStatus?.status === 'uploading';
            
            return (
              <div 
                key={recording.id}
                className={`p-4 border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30 transition-colors ${
                  recording.isEmergency ? 'bg-red-500/5 border-l-4 border-l-red-500' : ''
                }`}
              >
                {/* Video player */}
                {playingId === recording.id && (
                  <div className="mb-3">
                    <video
                      src={recording.url}
                      controls
                      className="w-full rounded-lg"
                      autoPlay
                    />
                  </div>
                )}

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {recording.isEmergency && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          <Shield className="w-3 h-3" />
                          חירום
                        </span>
                      )}
                      <span className="text-sm font-mono text-gray-400">
                        {formatDate(recording.timestamp)}
                      </span>
                      {isInCloud && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          <Cloud className="w-3 h-3" />
                          בענן
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(recording.duration)}
                      </span>
                      
                      {recording.blob?.size > 0 && (
                        <span className="flex items-center gap-1">
                          <Video className="w-4 h-4" />
                          {formatSize(recording.blob.size)}
                        </span>
                      )}
                      
                      {recording.location && recording.location.speed !== null && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{Math.round(recording.location.speed)} קמ"ש</span>
                        </span>
                      )}

                      {getUploadStatusIcon(recording.id)}
                    </div>

                    {/* Upload progress bar */}
                    {isUploading && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${uploadStatus?.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-blue-400 mt-0.5 block">
                          מעלה... {uploadStatus?.progress || 0}%
                        </span>
                      </div>
                    )}

                    {/* Upload error */}
                    {uploadStatus?.status === 'error' && uploadStatus.error && (
                      <span className="text-xs text-red-400 mt-1 block">
                        שגיאת העלאה: {uploadStatus.error}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setPlayingId(playingId === recording.id ? null : recording.id)}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title={playingId === recording.id ? 'הסתר' : 'הפעל'}
                    >
                      <Play className="w-4 h-4" />
                    </button>

                    {/* Court export */}
                    <button
                      onClick={() => setCourtExportRecording(recording)}
                      className="p-2 hover:bg-yellow-500/20 hover:text-yellow-400 rounded-lg transition-colors"
                      title="ייצוא לבית משפט"
                    >
                      <Scale className="w-4 h-4" />
                    </button>

                    {/* Upload to cloud */}
                    {!isAnonymous && !isInCloud && !isUploading && (
                      <button
                        onClick={() => onUpload(recording)}
                        className="p-2 hover:bg-cyan-500/20 hover:text-cyan-400 rounded-lg transition-colors"
                        title="העלה לענן"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    )}

                    {/* Retry upload on error */}
                    {uploadStatus?.status === 'error' && !isAnonymous && (
                      <button
                        onClick={() => onUpload(recording)}
                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                        title="נסה שוב"
                      >
                        <Cloud className="w-4 h-4" />
                      </button>
                    )}

                    <a
                      href={recording.url}
                      download={`dashcam-${recording.id}.webm`}
                      className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                      title="הורד"
                    >
                      <Download className="w-4 h-4" />
                    </a>

                    <button
                      onClick={() => handleDelete(recording)}
                      disabled={deletingId === recording.id}
                      className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title="מחק"
                    >
                      {deletingId === recording.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Court Export Modal */}
      <CourtExport
        isOpen={!!courtExportRecording}
        onClose={() => setCourtExportRecording(null)}
        recording={courtExportRecording}
      />
    </>
  );
}
