'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.toLowerCase().trim(),
      {
        redirectTo: `https://app.beiraf1fanatics.com/auth/callback?type=recovery`,
      }
    )

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-6xl mb-6">📧</div>
        <h1 className="text-2xl font-bold mb-3">Email enviado!</h1>
        <p className="text-gray-400 mb-2">
          Enviámos um link para <strong className="text-white">{email}</strong>.
        </p>
        <p className="text-gray-400 mb-6">
          Clica no link do email para criar a tua password. Válido por 1 hora.
        </p>
        <p className="text-sm text-gray-500">
          Não chegou? Verifica o spam ou{' '}
          <button onClick={() => setSent(false)} className="text-f1red underline">
            tenta novamente
          </button>.
        </p>
        <a href="/auth/login" className="block mt-6 text-sm text-gray-500 hover:text-white">
          ← Voltar ao login
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔑</div>
        <h1 className="text-2xl font-bold">Recuperar password</h1>
        <p className="text-gray-400 mt-2">
          Insere o teu email e enviamos um link para criares a tua password.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'A enviar...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          <a href="/auth/login" className="text-f1red hover:text-red-400">← Voltar ao login</a>
        </p>
      </div>
    </div>
  )
}
