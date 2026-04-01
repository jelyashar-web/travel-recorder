import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Copy, Link2, Check, X, Users, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface ShareRecordingProps {
  recordingId: string
  onClose: () => void
}

export function ShareRecording({ recordingId, onClose }: ShareRecordingProps) {
  const { t } = useTranslation()
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [expiresIn, setExpiresIn] = useState(24) // hours
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(false)

  const generateShareLink = async () => {
    setLoading(true)
    
    // Create share record in database
    const shareToken = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000)
    
    const { error } = await supabase
      .from('shared_recordings')
      .insert([{
        recording_id: recordingId,
        share_token: shareToken,
        expires_at: expiresAt.toISOString(),
        is_public: isPublic,
        views: 0
      }])

    if (!error) {
      const link = `${window.location.origin}/share/${shareToken}`
      setShareLink(link)
    }
    
    setLoading(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(`📹 ${t('app.name')}: ${shareLink}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const shareViaTelegram = () => {
    const text = encodeURIComponent(`${t('app.name')}: ${shareLink}`)
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${text}`, '_blank')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">{t('share.title')}</h3>
                <p className="text-sm text-slate-400">{t('share.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {!shareLink ? (
            <>
              {/* Options */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-slate-400" />
                    <span className="text-white">{t('share.publicAccess')}</span>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      isPublic ? 'bg-green-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      isPublic ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <span className="text-white">{t('share.expiresIn')}</span>
                  </div>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                    className="bg-slate-600 text-white rounded-lg px-3 py-1 text-sm"
                  >
                    <option value={1}>1 {t('time.hour')}</option>
                    <option value={24}>24 {t('time.hours')}</option>
                    <option value={72}>3 {t('time.days')}</option>
                    <option value={168}>7 {t('time.days')}</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateShareLink}
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? t('common.loading') : t('share.generateLink')}
              </button>
            </>
          ) : (
            <>
              {/* Share Link */}
              <div className="mb-6">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-700/50 border border-slate-600">
                  <Link2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="flex-1 bg-transparent text-white text-sm outline-none"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400 text-center">
                  {t('share.expiresAt')}: {new Date(Date.now() + expiresIn * 60 * 60 * 1000).toLocaleString()}
                </p>
              </div>

              {/* Share Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={shareViaWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors"
                >
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={shareViaTelegram}
                  className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                >
                  <span>Telegram</span>
                </button>
              </div>

              <button
                onClick={() => setShareLink('')}
                className="w-full mt-3 py-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                {t('share.createNew')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
