'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/lib/supabase/types'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const output = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i)
  return output.buffer
}

export default function Navbar() {
  const pathname = usePathname()
  const [member, setMember] = useState<Member | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pushSupported, setPushSupported] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const supabase = createClient()

  // Check push support and current subscription state
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setPushSupported(true)
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setPushSubscribed(!!sub))
    ).catch(() => {})
  }, [])

  const togglePush = useCallback(async () => {
    if (pushLoading) return
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready

      if (pushSubscribed) {
        // Unsubscribe
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
          await sub.unsubscribe()
        }
        setPushSubscribed(false)
      } else {
        // Subscribe
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        })
        setPushSubscribed(true)
      }
    } catch (e) {
      console.error('Push toggle error:', e)
    } finally {
      setPushLoading(false)
    }
  }, [pushSubscribed, pushLoading])

  useEffect(() => {
    async function loadMember(email: string) {
      const { data } = await (supabase as any)
        .from('members').select('*').eq('email', email).single()
      setMember(data ?? null)
      // Track last access
      await (supabase as any)
        .from('members')
        .update({ ultimo_acesso: new Date().toISOString() })
        .eq('email', email)
    }

    // Check on first load
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) loadMember(user.email)
    })

    // Re-check whenever auth state changes (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user?.email) {
          loadMember(session.user.email)
        } else {
          setMember(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const nav = [
    { href: '/',             label: 'Início' },
    { href: '/ranking',      label: 'Ranking' },
    { href: '/predict',      label: 'Previsões' },
    { href: '/instrucoes',   label: 'Como Jogar' },
    { href: '/instalar',     label: '📲 App' },
  ]

  return (
    <nav className="bg-f1dark border-b border-f1gray sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="bg-white rounded-lg p-0.5 flex items-center justify-center">
            <img src="/logos/beira-f1.png" alt="BF1F" className="h-8 w-8 object-contain" />
          </div>
          <span className="hidden sm:inline">Beira F1 Fanatics</span>
          <span className="sm:hidden">BF1F</span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href))
                  ? 'bg-f1red text-white'
                  : 'bg-f1gray text-gray-300 hover:bg-f1red/80 hover:text-white'
              }`}>
              {n.label}
            </Link>
          ))}
          {member?.is_admin && (
            <Link href="/admin"
              className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-f1red text-white'
                  : 'bg-f1gray text-gray-300 hover:bg-f1red/80 hover:text-white'
              }`}>
              Admin
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Bell notification toggle — only if Push API is supported */}
          {pushSupported && member && (
            <button
              onClick={togglePush}
              disabled={pushLoading}
              title={pushSubscribed ? 'Notificações activas — clica para desactivar' : 'Activar notificações'}
              className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-f1gray hover:bg-f1gray/70 transition-colors disabled:opacity-50"
            >
              {pushSubscribed ? (
                <>
                  <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                  </svg>
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-f1dark" />
                </>
              ) : (
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
            </button>
          )}

          {member ? (
            <Link href="/profile" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
              {member.foto_url
                ? <img src={member.foto_url} alt="" className="w-7 h-7 rounded-full object-cover border border-f1red" />
                : <div className="w-7 h-7 rounded-full bg-f1red flex items-center justify-center text-xs font-bold">
                    {member.nickname.charAt(0).toUpperCase()}
                  </div>
              }
              <span className="hidden sm:inline">{member.nickname}</span>
            </Link>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm py-2 px-4">Entrar</Link>
          )}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-f1gray bg-f1dark px-4 py-3 flex flex-wrap gap-2">
          {nav.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                pathname === n.href || (n.href !== '/' && pathname.startsWith(n.href))
                  ? 'bg-f1red text-white'
                  : 'bg-f1gray text-gray-300'
              }`}>{n.label}</Link>
          ))}
          {member?.is_admin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)}
              className={`text-sm font-medium px-4 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/admin') ? 'bg-f1red text-white' : 'bg-f1gray text-gray-300'
              }`}>Admin</Link>
          )}
        </div>
      )}
    </nav>
  )
}
