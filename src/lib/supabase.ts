import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database tables
export interface Recording {
  id: string
  user_id: string
  filename: string
  url: string
  size: number
  duration: number
  gps_data: {
    latitude: number
    longitude: number
    speed: number
  }
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  settings: {
    max_speed: number
    auto_upload: boolean
    language: string
  }
}
