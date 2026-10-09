import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPushNotification, PushPayload } from '@/lib/webpush'

// Vercel Cron: every 5 minutes
// vercel.json: {"crons":[{"path":"/api/cron/push-notifications","schedule":"*/5 * * * *"}]}

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()

  // Find upcoming GPs with relevant deadlines in the next 5 minutes
  const windowStart = now.toISOString()
  const windowEnd = new Date(now.getTime() + 5 * 60 * 1000).toISOString()

  // Check notifications to send
  const notifications: Array<{ gpId: number; gpName: string; type: string; payload: PushPayload }> = []

  // Fetch upcoming GPs
  const { data: gps } = await supabase
    .from('gp_calendar')
    .select('id, nome, deadline_fantasy, deadline_play, qualifying_start, is_sprint')
    .in('status', ['upcoming', 'active'])
    .order('data_corrida', { ascending: true })
    .limit(3)

  if (!gps) return NextResponse.json({ sent: 0 })

  for (const gp of gps) {
    const gpName = `GP ${gp.nome}`

    // 1. F1 Fantasy & Predict: 1h before deadline_fantasy
    if (gp.deadline_fantasy) {
      const deadline = new Date(gp.deadline_fantasy)
      const triggerAt = new Date(deadline.getTime() - 60 * 60 * 1000)
      if (triggerAt >= new Date(windowStart) && triggerAt < new Date(windowEnd)) {
        notifications.push({
          gpId: gp.id,
          gpName,
          type: 'fantasy_1h',
          payload: {
            title: `⏰ ${gpName} — 1h para fechar!`,
            body: 'F1 Fantasy & F1 Predict fecham em 1 hora. Submete já!',
            url: '/predict',
            tag: `fantasy-1h-${gp.id}`,
          },
        })
      }
    }

    // 2. F1 Play opens: qualifying_start + 2h
    if (gp.qualifying_start) {
      const qualEnd = new Date(new Date(gp.qualifying_start).getTime() + 2 * 60 * 60 * 1000)
      if (qualEnd >= new Date(windowStart) && qualEnd < new Date(windowEnd)) {
        notifications.push({
          gpId: gp.id,
          gpName,
          type: 'play_opens',
          payload: {
            title: `🏎️ ${gpName} — F1 Play abriu!`,
            body: 'As submissões do F1 Play já estão abertas. Faz a tua previsão!',
            url: `/predict/${gp.id}`,
            tag: `play-opens-${gp.id}`,
          },
        })
      }
    }

    // 3. F1 Play closes: 1h before deadline_play
    if (gp.deadline_play) {
      const deadline = new Date(gp.deadline_play)
      const triggerAt = new Date(deadline.getTime() - 60 * 60 * 1000)
      if (triggerAt >= new Date(windowStart) && triggerAt < new Date(windowEnd)) {
        notifications.push({
          gpId: gp.id,
          gpName,
          type: 'play_closes_1h',
          payload: {
            title: `⏰ ${gpName} — F1 Play fecha em 1h!`,
            body: 'Última hora para submeter a tua previsão F1 Play!',
            url: `/predict/${gp.id}`,
            tag: `play-closes-1h-${gp.id}`,
          },
        })
      }
    }
  }

  if (notifications.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No notifications due' })
  }

  let totalSent = 0
  let totalFailed = 0

  for (const notif of notifications) {
    // Check if already sent (dedup)
    const { data: existing } = await supabase
      .from('notification_log')
      .select('id')
      .eq('gp_id', notif.gpId)
      .eq('notification_type', notif.type)
      .single()

    if (existing) continue // already sent

    // Fetch all active push subscriptions
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription, endpoint')

    if (!subs || subs.length === 0) continue

    const expiredEndpoints: string[] = []

    for (const sub of subs) {
      const result = await sendPushNotification(sub.subscription, notif.payload)
      if (result.success) {
        totalSent++
      } else {
        totalFailed++
        if (result.error === 'expired') {
          expiredEndpoints.push(sub.endpoint)
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints)
    }

    // Log this notification as sent
    await supabase.from('notification_log').insert({
      gp_id: notif.gpId,
      notification_type: notif.type,
      recipients: subs.length,
      sent_ok: totalSent,
    })
  }

  return NextResponse.json({ sent: totalSent, failed: totalFailed })
}
