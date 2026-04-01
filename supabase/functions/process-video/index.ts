import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recordingId, action } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (action) {
      case 'extract-thumbnail': {
        const { data: recording } = await supabaseClient
          .from('recordings')
          .select('*')
          .eq('id', recordingId)
          .single()

        if (!recording) throw new Error('Recording not found')

        const thumbnailUrl = `${recording.url}#t=5`

        await supabaseClient
          .from('recordings')
          .update({ thumbnail_url: thumbnailUrl })
          .eq('id', recordingId)

        return new Response(
          JSON.stringify({ success: true, thumbnailUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'compress': {
        await supabaseClient
          .from('recordings')
          .update({ 
            compression_status: 'pending',
            compressed_url: null 
          })
          .eq('id', recordingId)

        return new Response(
          JSON.stringify({ success: true, message: 'Compression queued' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Unknown action')
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
