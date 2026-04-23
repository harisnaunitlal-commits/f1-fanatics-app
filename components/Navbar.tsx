'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Member } from '@/lib/supabase/types'

export default function Navbar() {
  const pathname = usePathname()
  const [member, setMember] = useState<Member | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function loadMember(email: string) {
      const { data } = await (supabase as any)
        .from('members').select('*').eq('email', email).single()
      setMember(data ?? null)
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
    { href: '/',          label: 'Início' },
    { href: '/ranking',   label: 'Ranking' },
    { href: '/predict',   label: 'Previsões' },
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

        <div className="hidden md:flex items-center gap-6">
          {nav.map(n => (
            <Link key={n.href} href={n.href}
              className={`text-sm font-medium transition-colors ${
                pathname === n.href ? 'text-f1red' : 'text-gray-300 hover:text-white'
              }`}>
              {n.label}
            </Link>
          ))}
          {member?.is_admin && (
            <Link href="/admin" className={`text-sm font-medium transition-colors ${
              pathname.startsWith('/admin') ? 'text-f1red' : 'text-gray-300 hover:text-white'
            }`}>Admin</Link>
          )}
        </div>

        <div className="flex items-center gap-3">
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
        <div className="md:hidden border-t border-f1gray bg-f1dark px-4 py-3 space-y-3">
          {nav.map(n => (
            <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}
              className={`block text-sm font-medium ${
                pathname === n.href ? 'text-f1red' : 'text-gray-300'
              }`}>{n.label}</Link>
          ))}
          {member?.is_admin && (
            <Link href="/admin" onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-300">Admin</Link>
          )}
        </div>
      )}
    </nav>
  )
}
