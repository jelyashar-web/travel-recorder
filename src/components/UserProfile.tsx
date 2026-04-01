import { useState, useEffect } from 'react';
import { X, User, Mail, Shield, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CloudStats {
  totalRecordings: number;
  totalSize: number;
  lastUpload: string | null;
}

export function UserProfile({ isOpen, onClose }: UserProfileProps) {
  const { user, signOut, updateProfile, isAnonymous } = useAuth();
  const [cloudStats, setCloudStats] = useState<CloudStats | null>(null);
  const [fullName, setFullName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      // Get user metadata
      setFullName(user.user_metadata?.full_name || '');
      
      // Fetch cloud stats
      fetchCloudStats();
    }
  }, [user, isOpen]);

  const fetchCloudStats = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('recordings')
        .select('size, created_at')
        .eq('user_id', user.id);

      if (error) throw error;

      const stats: CloudStats = {
        totalRecordings: data?.length || 0,
        totalSize: data?.reduce((acc, r) => acc + (r.size || 0), 0) || 0,
        lastUpload: data?.[0]?.created_at || null,
      };

      setCloudStats(stats);
    } catch (err) {
      console.error('Failed to fetch cloud stats:', err);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError(null);
    
    const { error } = await updateProfile({ fullName });
    
    if (error) {
      setError(error);
    } else {
      setIsEditing(false);
    }
    
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    // This would need a server function to properly delete all user data
    alert('מחיקת חשבון דורשת פנייה לתמיכה');
    setShowDeleteConfirm(false);
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('he-IL');
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {user.user_metadata?.full_name || 'משתמש'}
              </h2>
              <p className="text-white/80 text-sm flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {user.email || 'אורח'}
              </p>
              {isAnonymous() && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-yellow-500/30 text-yellow-300 text-xs rounded">
                  חשבון אורח
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Profile Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-300 flex items-center gap-2">
              <User className="w-4 h-4" />
              פרטים אישיים
            </h3>

            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">שם מלא</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    placeholder="השם שלך"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded-lg"
                  >
                    {loading ? 'שומר...' : 'שמור'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(user.user_metadata?.full_name || '');
                    }}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">שם:</span>
                  <span>{user.user_metadata?.full_name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">אימייל:</span>
                  <span>{user.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">סוג חשבון:</span>
                  <span>{isAnonymous() ? 'אורח' : 'רשום'}</span>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-2 text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  ערוך פרופיל
                </button>
              </div>
            )}
          </div>

          {/* Cloud Stats */}
          {!isAnonymous() && cloudStats && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-300 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                סטטיסטיקות ענן
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    {cloudStats.totalRecordings}
                  </div>
                  <div className="text-xs text-gray-400">הקלטות</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-green-400">
                    {formatSize(cloudStats.totalSize)}
                  </div>
                  <div className="text-xs text-gray-400">נפח</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-sm font-bold text-purple-400">
                    {formatDate(cloudStats.lastUpload)}
                  </div>
                  <div className="text-xs text-gray-400">העלאה אחרונה</div>
                </div>
              </div>
            </div>
          )}

          {/* Security */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              אבטחה
            </h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">מזהה משתמש:</span>
                <span className="font-mono text-xs">{user.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">נוצר:</span>
                <span>{formatDate(user.created_at)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">התחברות אחרונה:</span>
                <span>{formatDate(user.last_sign_in_at)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-700 space-y-2">
            <button
              onClick={async () => {
                await signOut();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              התנתק
            </button>

            {!isAnonymous() && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 py-3 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                מחק חשבון
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full">
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <AlertTriangle className="w-8 h-8" />
                <h3 className="text-xl font-bold">מחיקת חשבון</h3>
              </div>
              <p className="text-gray-300 mb-4">
                פעולה זו תמחק את כל הנתונים שלך לצמיתות, כולל הקלטות מהענן.
                לא ניתן לשחזר לאחר המחיקה.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  ביטול
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                >
                  מחק לצמיתות
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
