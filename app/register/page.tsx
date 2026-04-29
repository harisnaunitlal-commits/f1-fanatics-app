'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    nickname: '',
    nome_completo: '',
    cidade: '',
    pais: 'Moçambique',
    piloto_fav: '',
    equipa_fav: '',
    fantasy_nick: '',
    predict_nick: '',
    bio: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    // Step 1: Check if this email is already a registered Supabase user
    // Try to get the current user (they may already be logged in)
    let userEmail = form.email.toLowerCase().trim()

    const { data: { user: existingUser } } = await supabase.auth.getUser()

    if (!existingUser) {
      // New user — sign up with Supabase Auth
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: userEmail,
        password: form.password,
        options: {
          // Skip email confirmation for this invite-only community
          emailRedirectTo: `https://app.beiraf1fanatics.com/auth/callback`,
        },
      })

      if (signUpErr) {
        // If user already exists in Auth, try signing in instead
        if (signUpErr.message.includes('already registered')) {
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: form.password,
          })
          if (signInErr) {
            setError('Este email já está registado. Usa o login com a tua password.')
            setLoading(false)
            return
          }
        } else {
          setError(signUpErr.message)
          setLoading(false)
          return
        }
      }
    } else {
      userEmail = existingUser.email!
    }

    // Step 2: Save/update member profile
    const { error: profileErr } = await (supabase as any)
      .from('members')
      .upsert({
        email: userEmail,
        nickname: form.nickname,
        nome_completo: form.nome_completo,
        cidade: form.cidade,
        pais: form.pais,
        piloto_fav: form.piloto_fav,
        equipa_fav: form.equipa_fav,
        fantasy_nick: form.fantasy_nick,
        predict_nick: form.predict_nick,
        bio: form.bio,
        activo: true,
        actualizado_em: new Date().toISOString(),
      })

    if (profileErr) {
      setError(profileErr.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/profile'), 1500)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-6xl mb-4">🏁</div>
        <h1 className="text-2xl font-bold mb-2">Bem-vindo à Beira F1 Fanatics!</h1>
        <p className="text-gray-400">Perfil guardado com sucesso. A redirigir...</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-2 mt-8">Registo de Membro</h1>
      <p className="text-gray-400 mb-6 text-sm">Cria a tua conta para entrar na liga.</p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Account credentials */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">🔐 Conta</h2>

          <div>
            <label className="label">Email *</label>
            <input
              name="email"
              type="email"
              placeholder="o.teu@email.com"
              className="input"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">Password *</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                className="input pr-10"
                value={form.password}
                onChange={handleChange}
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
        </div>

        {/* Profile info */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">👤 Perfil</h2>

          <div>
            <label className="label">Nickname *</label>
            <input
              name="nickname"
              placeholder="O nome que aparece no ranking"
              className="input"
              value={form.nickname}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="label">Nome completo</label>
            <input
              name="nome_completo"
              placeholder="Nome e apelido"
              className="input"
              value={form.nome_completo}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cidade</label>
              <input
                name="cidade"
                placeholder="Beira"
                className="input"
                value={form.cidade}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">País</label>
              <input
                name="pais"
                placeholder="Moçambique"
                className="input"
                value={form.pais}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* F1 preferences */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">🏎️ F1</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Piloto favorito</label>
              <input
                name="piloto_fav"
                placeholder="ex: Norris"
                className="input"
                value={form.piloto_fav}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Equipa favorita</label>
              <input
                name="equipa_fav"
                placeholder="ex: McLaren"
                className="input"
                value={form.equipa_fav}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nick Fantasy</label>
              <input
                name="fantasy_nick"
                placeholder="fantasy.formula1.com"
                className="input"
                value={form.fantasy_nick}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">Nick Predict</label>
              <input
                name="predict_nick"
                placeholder="f1predict.formula1.com"
                className="input"
                value={form.predict_nick}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label className="label">Bio <span className="text-gray-600">(opcional)</span></label>
            <textarea
              name="bio"
              placeholder="Conta algo sobre ti..."
              className="input resize-none h-20"
              value={form.bio}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 bg-red-900/20 p-3 rounded-lg text-sm">{error}</div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'A criar conta...' : '🏁 Criar conta e entrar'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Já tens conta?{' '}
          <a href="/auth/login" className="text-f1red underline">Entrar</a>
        </p>
      </form>
    </div>
  )
}
