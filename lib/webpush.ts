import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return { success: true }
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string }
    // 410 Gone = subscription expired / user unsubscribed
    if (error.statusCode === 410 || error.statusCode === 404) {
      return { success: false, error: 'expired' }
    }
    return { success: false, error: error.message ?? 'unknown' }
  }
}

export { webpush }
