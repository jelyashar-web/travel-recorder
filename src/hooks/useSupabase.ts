import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session and auto sign in anonymously if needed
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        // Auto sign in anonymously - no approval needed
        const { data, error } = await supabase.auth.signInAnonymously()
        if (!error && data.user) {
          setUser(data.user)
        }
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously()
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // Auto sign in anonymously again after sign out
    await supabase.auth.signInAnonymously()
  }

  return { user, loading, signInAnonymously, signOut }
}

export function useRecordings() {
  const [recordings, setRecordings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRecordings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setRecordings(data)
    }
    setLoading(false)
  }

  const uploadRecording = async (blob: Blob, metadata: any) => {
    const fileName = `recording_${Date.now()}.webm`
    
    // Upload to storage
    const { error: uploadError } = await supabase
      .storage
      .from('recordings')
      .upload(fileName, blob)
    
    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('recordings')
      .getPublicUrl(fileName)

    // Save metadata to database
    const { data, error } = await supabase
      .from('recordings')
      .insert([{
        filename: fileName,
        url: publicUrl,
        size: blob.size,
        duration: metadata.duration,
        gps_data: metadata.gpsData,
        created_at: new Date().toISOString()
      }])

    if (error) throw error
    return data
  }

  const deleteRecording = async (id: string, filename: string) => {
    // Delete from storage
    await supabase.storage.from('recordings').remove([filename])
    
    // Delete from database
    await supabase.from('recordings').delete().eq('id', id)
  }

  return { recordings, loading, fetchRecordings, uploadRecording, deleteRecording }
}

export function useCloudSync() {
  const syncToCloud = async (recordings: any[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    for (const rec of recordings) {
      if (rec.isLocal && rec.blob) {
        try {
          await uploadRecording(rec.blob, {
            duration: rec.duration,
            gpsData: rec.gpsData
          })
        } catch (e) {
          console.error('Sync failed:', e)
        }
      }
    }
  }

  return { syncToCloud }
}

async function uploadRecording(blob: Blob, metadata: any) {
  const fileName = `recording_${Date.now()}.webm`
  
  const { error: uploadError } = await supabase
    .storage
    .from('recordings')
    .upload(fileName, blob)
  
  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase
    .storage
    .from('recordings')
    .getPublicUrl(fileName)

  const { data, error } = await supabase
    .from('recordings')
    .insert([{
      filename: fileName,
      url: publicUrl,
      size: blob.size,
      duration: metadata.duration,
      gps_data: metadata.gpsData,
      created_at: new Date().toISOString()
    }])

  if (error) throw error
  return data
}
