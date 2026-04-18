'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-6xl mb-6">📧</div>
        <h1 className="text-2xl font-bold mb-3">Link enviado!</h1>
        <p className="text-gray-400 mb-4">
          Verifica o teu email <strong className="text-white">{email}</strong>.
          Clica no link para entrar — válido por 1 hora.
        </p>
        <p className="text-sm text-gray-500">
          Não chegou? Verifica o spam ou{' '}
          <button onClick={() => setSent(false)} className="text-f1red underline">
            tenta novamente
          </button>.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🏎️</div>
        <h1 className="text-3xl font-bold">Beira F1 Fanatics</h1>
        <p className="text-gray-400 mt-2">Entra com o teu email — sem password</p>
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

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'A enviar...' : 'Enviar link de acesso'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Primeira vez?{' '}
          <a href="/register" className="text-f1red underline">Regista o teu perfil</a>
        </p>
      </div>
    </div>
  )
}
