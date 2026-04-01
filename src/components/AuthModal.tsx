import { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Car } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

type AuthMode = 'login' | 'register' | 'guest';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { signIn, signUp, signInAnonymously, loading } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMessage(null);

    if (mode === 'login') {
      const { error } = await signIn({ email, password });
      if (error) {
        setLocalError('אימייל או סיסמה שגויים');
      } else {
        onClose();
      }
    } else if (mode === 'register') {
      // Validation
      if (password.length < 6) {
        setLocalError('הסיסמה חייבת להכיל לפחות 6 תווים');
        return;
      }
      if (fullName.trim().length < 2) {
        setLocalError('נא להזין שם מלא');
        return;
      }
      
      const { error } = await signUp({ email, password, fullName });
      if (error) {
        setLocalError('ההרשמה נכשלה: ' + error);
      } else {
        // After successful signup, automatically sign in
        const { error: signInError } = await signIn({ email, password });
        if (signInError) {
          setLocalError('נרשמת בהצלחה! אבל ההתחברות נכשלה. נסה להתחבר ידנית.');
          setMode('login');
        } else {
          setSuccessMessage('נרשמת והתחברת בהצלחה!');
          setTimeout(() => onClose(), 1500);
        }
      }
    }
  };

  const handleGuestLogin = async () => {
    setLocalError(null);
    const { error } = await signInAnonymously();
    if (error) {
      setLocalError('ההתחברות כאורח נכשלה');
    } else {
      onClose();
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setLocalError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 text-center relative">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            מצלמת הדרך
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {mode === 'login' && 'התחבר לחשבון שלך'}
            {mode === 'register' && 'צור חשבון חדש'}
            {mode === 'guest' && 'כניסה ללא הרשמה'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {localError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {localError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm text-center">
              {successMessage}
            </div>
          )}

          {mode !== 'guest' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-1">שם מלא *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                      placeholder="ישראל ישראלי"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">אימייל *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">סיסמה *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {mode === 'register' && (
                  <p className="text-xs text-gray-500 mt-1">לפחות 6 תווים</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    טוען...
                  </span>
                ) : mode === 'login' ? (
                  'התחבר'
                ) : (
                  'צור חשבון'
                )}
              </button>
            </form>
          )}

          {mode === 'guest' && (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-400 text-sm">
                <p className="font-bold mb-1">⚠️ שים לב!</p>
                <p>במצב אורח:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>ההקלטות נשמרות רק במכשיר</li>
                  <li>אין גיבוי לענן</li>
                  <li>אם תנקה את הדפדפן - הנתונים יימחקו</li>
                </ul>
              </div>

              <button
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all"
              >
                {loading ? 'מתחבר...' : 'המשך כאורח'}
              </button>

              <button
                onClick={() => switchMode('register')}
                className="w-full text-cyan-400 hover:text-cyan-300 font-bold py-2"
              >
                אני רוצה להירשם לגיבוי בענן
              </button>
            </div>
          )}

          {/* Divider */}
          {mode !== 'guest' && (
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-gray-500 text-sm">או</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>
          )}

          {/* Switch mode buttons */}
          {mode !== 'guest' && (
            <div className="space-y-2">
              {mode === 'login' ? (
                <>
                  <button
                    onClick={() => switchMode('register')}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    צור חשבון חדש
                  </button>
                  <button
                    onClick={() => switchMode('guest')}
                    className="w-full border border-gray-600 hover:bg-gray-700/50 text-gray-400 font-bold py-3 rounded-lg transition-all"
                  >
                    המשך ללא הרשמה
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => switchMode('login')}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all"
                  >
                    כבר יש לי חשבון
                  </button>
                  <button
                    onClick={() => switchMode('guest')}
                    className="w-full border border-gray-600 hover:bg-gray-700/50 text-gray-400 font-bold py-3 rounded-lg transition-all"
                  >
                    המשך ללא הרשמה
                  </button>
                </>
              )}
            </div>
          )}

          {mode === 'guest' && (
            <button
              onClick={() => switchMode('login')}
              className="w-full mt-4 text-gray-400 hover:text-gray-300"
            >
              חזרה להתחברות
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 text-center text-xs text-gray-500">
          <p>בהתחברות אתה מסכים לתנאי השימוש</p>
          <p className="mt-1">הנתונים מאובטחים ונשמרים בהצפנה</p>
        </div>
      </div>
    </div>
  );
}
