import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Real-time sync for recordings
export function useRealtimeRecordings(onNewRecording: (recording: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel('recordings-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recordings'
        },
        (payload) => {
          console.log('New recording received:', payload.new)
          onNewRecording(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [onNewRecording])
}

// Real-time location sharing (for family safety)
export function useRealtimeLocation(userId: string, onLocationUpdate: (location: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel('location-channel')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onLocationUpdate(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, onLocationUpdate])
}

// Real-time emergency alerts
export function useEmergencyAlerts(onEmergency: (alert: any) => void) {
  useEffect(() => {
    const subscription = supabase
      .channel('emergency-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_alerts'
        },
        (payload) => {
          onEmergency(payload.new)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [onEmergency])
}

// Broadcast presence (who's online)
export function usePresence(channelName: string, userId: string) {
  useEffect(() => {
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      console.log('Online users:', state)
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ online_at: new Date().toISOString() })
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [channelName, userId])
}
