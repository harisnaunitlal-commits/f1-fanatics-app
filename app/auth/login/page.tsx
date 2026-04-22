'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou password incorrectos. Se ainda não tens password, usa "Esqueceste a password?"')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    // Check if member profile exists
    const { data: member } = await (supabase as any)
      .from('members')
      .select('email')
      .eq('email', email.toLowerCase().trim())
      .single()

    router.push(member ? '/' : '/register')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🏎️</div>
        <h1 className="text-3xl font-bold">Beira F1 Fanatics</h1>
        <p className="text-gray-400 mt-2">Entra com o teu email e password</p>
      </div>

      <div className="card">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="o.teu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="A tua password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 text-center text-sm text-gray-500">
          <a href="/auth/forgot-password" className="text-f1red hover:text-red-400 transition-colors">
            Esqueceste a password?
          </a>
          <span>
            Primeira vez?{' '}
            <a href="/register" className="text-f1red underline">Regista o teu perfil</a>
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-gray-600 mt-6">
        Se nunca usaste password, clica em "Esqueceste a password?" para criar uma.
      </p>
    </div>
  )
}
