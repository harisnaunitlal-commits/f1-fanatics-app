'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.')
      return
    }

    if (password !== confirm) {
      setError('As passwords não coincidem.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Success — redirect home
    router.push('/?password_updated=1')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold">Criar password</h1>
        <p className="text-gray-400 mt-2">Escolhe uma password para a tua conta.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nova password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input pr-10"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
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

          <div>
            <label className="label">Confirmar password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input"
              placeholder="Repete a password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
          </div>

          {/* Strength hint */}
          {password.length > 0 && (
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    password.length >= (i + 1) * 3
                      ? password.length >= 10 ? 'bg-green-400'
                        : password.length >= 7 ? 'bg-yellow-400'
                        : 'bg-red-400'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">
                {password.length < 6 ? 'Fraca' : password.length < 10 ? 'Razoável' : 'Forte'}
              </span>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'A guardar...' : '💾 Guardar password'}
          </button>
        </form>
      </div>
    </div>
  )
}
