'use client'

import { useEffect, useState } from 'react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i)
  }
  return output.buffer
}

export default function PushNotificationPrompt() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Show prompt if permission not yet decided
    const dismissed = localStorage.getItem('push-prompt-dismissed')
    if (dismissed) return

    if (Notification.permission === 'denied') return
    if (Notification.permission === 'granted') {
      // Already granted — silently re-subscribe if needed
      silentSubscribe()
      return
    }

    // Show prompt after a short delay
    const t = setTimeout(() => setShow(true), 5000)
    return () => clearTimeout(t)
  }, [])

  async function silentSubscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        // Already subscribed — ensure it's saved server-side
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(existing.toJSON()),
        })
      }
    } catch {
      // ignore
    }
  }

  async function subscribe() {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        localStorage.setItem('push-prompt-dismissed', '1')
        setShow(false)
        return
      }

      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      })

      if (res.ok) {
        setSubscribed(true)
        setTimeout(() => setShow(false), 2000)
      }
    } catch (err) {
      console.error('Push subscribe error:', err)
    } finally {
      setLoading(false)
    }
  }

  function dismiss() {
    localStorage.setItem('push-prompt-dismissed', '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <div className="bg-[#1a1a2e] border border-[#e10600]/40 rounded-xl shadow-2xl p-4">
        {subscribed ? (
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-white text-sm">Notificações activadas!</p>
              <p className="text-gray-400 text-xs">Vais receber alertas antes de cada GP.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl mt-0.5">🔔</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">Activar notificações?</p>
                <p className="text-gray-400 text-xs mt-0.5">
                  Recebe alertas 1h antes de fechar F1 Fantasy & Predict, e quando o F1 Play abre.
                </p>
              </div>
              <button
                onClick={dismiss}
                className="text-gray-600 hover:text-gray-400 text-lg leading-none flex-shrink-0"
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={subscribe}
                disabled={loading}
                className="flex-1 bg-[#e10600] hover:bg-[#c00500] text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
              >
                {loading ? 'A activar...' : 'Activar 🔔'}
              </button>
              <button
                onClick={dismiss}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 text-sm font-medium py-2 px-4 rounded-lg transition-colors border border-white/10"
              >
                Agora não
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
