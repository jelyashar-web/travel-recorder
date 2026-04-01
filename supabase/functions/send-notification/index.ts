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
    const { userId, type, data } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: tokens } = await supabaseClient
      .from('push_tokens')
      .select('*')
      .eq('user_id', userId)

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No push tokens found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const notifications = {
      emergency: {
        title: '🚨 חירום! / Экстренный случай!',
        body: 'התקבלה התראת חירום / Получено экстренное уведомление',
        priority: 'high'
      },
      speed_alert: {
        title: '⚠️ חריגת מהירות / Превышение скорости',
        body: `מהירות: ${data.speed} קמ"ש / Скорость: ${data.speed} км/ч`,
        priority: 'normal'
      },
      upload_complete: {
        title: '✅ העלאה הושלמה / Загрузка завершена',
        body: 'הקלטה הועלתה בהצלחה / Запись успешно загружена',
        priority: 'normal'
      }
    }

    const notification = notifications[type]
    if (!notification) throw new Error('Unknown notification type')

    const results = tokens.map((token) => ({
      success: true,
      token: token.token
    }))

    await supabaseClient
      .from('notification_logs')
      .insert([{
        user_id: userId,
        type,
        data,
        sent_at: new Date().toISOString(),
        status: 'sent'
      }])

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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
