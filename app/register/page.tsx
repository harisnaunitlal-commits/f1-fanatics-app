'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

// ── F1 2026 drivers ──────────────────────────────────────────────
const DRIVERS = [
  { value: '', label: 'Nenhum' },
  { value: 'VER', label: 'Max Verstappen (Red Bull)' },
  { value: 'TSU', label: 'Yuki Tsunoda (Red Bull)' },
  { value: 'NOR', label: 'Lando Norris (McLaren)' },
  { value: 'PIA', label: 'Oscar Piastri (McLaren)' },
  { value: 'LEC', label: 'Charles Leclerc (Ferrari)' },
  { value: 'HAM', label: 'Lewis Hamilton (Ferrari)' },
  { value: 'RUS', label: 'George Russell (Mercedes)' },
  { value: 'ANT', label: 'Kimi Antonelli (Mercedes)' },
  { value: 'ALO', label: 'Fernando Alonso (Aston Martin)' },
  { value: 'STR', label: 'Lance Stroll (Aston Martin)' },
  { value: 'GAS', label: 'Pierre Gasly (Alpine)' },
  { value: 'DOO', label: 'Jack Doohan (Alpine)' },
  { value: 'HUL', label: 'Nico Hülkenberg (Sauber)' },
  { value: 'BOR', label: 'Gabriel Bortoleto (Sauber)' },
  { value: 'ALB', label: 'Alexander Albon (Williams)' },
  { value: 'SAI', label: 'Carlos Sainz (Williams)' },
  { value: 'BEA', label: 'Oliver Bearman (Haas)' },
  { value: 'OCO', label: 'Esteban Ocon (Haas)' },
  { value: 'HAD', label: 'Isack Hadjar (Racing Bulls)' },
  { value: 'LAW', label: 'Liam Lawson (Racing Bulls)' },
]

const TEAMS = [
  { value: '', label: 'Nenhuma' },
  { value: 'Red Bull Racing', label: 'Red Bull Racing' },
  { value: 'McLaren', label: 'McLaren' },
  { value: 'Ferrari', label: 'Ferrari' },
  { value: 'Mercedes', label: 'Mercedes' },
  { value: 'Aston Martin', label: 'Aston Martin' },
  { value: 'Alpine', label: 'Alpine' },
  { value: 'Sauber', label: 'Sauber (Kick)' },
  { value: 'Williams', label: 'Williams' },
  { value: 'Haas', label: 'Haas' },
  { value: 'Racing Bulls', label: 'Racing Bulls' },
]

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    email: '',
    password: '',
    nickname: '',
    nome_completo: '',
    cidade: '',
    pais: 'Moçambique',
    whatsapp: '',
    piloto_fav: '',
    equipa_fav: '',
    fantasy_nick: '',
    predict_nick: '',
    bio: '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setError('Foto demasiado grande. Máximo 2MB.')
      return
    }
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setError('')
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

    if (!form.nickname.trim()) {
      setError('O nickname é obrigatório.')
      setLoading(false)
      return
    }

    const userEmail = form.email.toLowerCase().trim()

    // ── Step 1: Upload photo first (no auth needed for public upload) ──
    let fotoUrl: string | undefined = undefined

    if (photoFile) {
      try {
        const ext = photoFile.type === 'image/png' ? 'png'
          : photoFile.type === 'image/webp' ? 'webp' : 'jpg'
        const path = `${userEmail}/avatar.${ext}`

        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, photoFile, { upsert: true, contentType: photoFile.type })

        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(path)
          fotoUrl = urlData.publicUrl
        }
      } catch {
        // Photo upload failed — continue without photo
      }
    }

    // ── Step 2: Call server API to create auth user + member ─────
    // Uses service role key server-side — bypasses RLS and email confirmation
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:         userEmail,
        password:      form.password,
        nickname:      form.nickname.trim(),
        nome_completo: form.nome_completo.trim() || null,
        cidade:        form.cidade.trim() || null,
        pais:          form.pais.trim() || null,
        whatsapp:      form.whatsapp.trim() || null,
        piloto_fav:    form.piloto_fav || null,
        equipa_fav:    form.equipa_fav || null,
        fantasy_nick:  form.fantasy_nick.trim() || null,
        predict_nick:  form.predict_nick.trim() || null,
        bio:           form.bio.trim() || null,
        foto_url:      fotoUrl ?? null,
      }),
    })

    const result = await res.json()

    if (!res.ok || result.error) {
      setError(result.error ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    // ── Step 3: Sign in on client to establish session ───────────
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: form.password,
    })

    if (signInErr) {
      if (
        signInErr.message.toLowerCase().includes('security purposes') ||
        signInErr.message.toLowerCase().includes('after') ||
        signInErr.message.toLowerCase().includes('rate')
      ) {
        // Rate limited — account was created, just can't sign in yet
        setError('Conta criada! O Supabase tem um limite de segurança. Aguarda 60 segundos e faz login em "Entrar".')
      } else {
        setError('Conta criada com sucesso! Vai a "Entrar" para fazer login com a tua password.')
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/profile'), 1800)
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
      <p className="text-gray-400 mb-6 text-sm">
        Cria a tua conta para entrar na liga. Campos com <span className="text-f1red">*</span> são obrigatórios.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── FOTO DE PERFIL ────────────────────────────────────── */}
        <div className="card flex flex-col items-center gap-3">
          <h2 className="font-bold text-f1red self-start">📷 Foto de Perfil <span className="text-gray-600 font-normal text-xs">(opcional)</span></h2>

          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="relative group focus:outline-none"
            title="Clica para adicionar foto"
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-f1red ring-2 ring-f1red/30 group-hover:ring-f1red/60 transition-all"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 group-hover:border-f1red flex items-center justify-center transition-all">
                <span className="text-3xl">👤</span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </button>

          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />

          <div className="text-center">
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="text-xs text-f1red hover:text-red-400 transition-colors"
            >
              {photoPreview ? '📷 Mudar foto' : '📷 Adicionar foto'}
            </button>
            {photoPreview && (
              <>
                <span className="text-gray-700 mx-1">·</span>
                <button
                  type="button"
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                  className="text-xs text-gray-600 hover:text-red-400 transition-colors"
                >
                  Remover
                </button>
              </>
            )}
          </div>
          <p className="text-xs text-gray-600">JPG, PNG ou WebP · máx. 2MB</p>
        </div>

        {/* ── CONTA ─────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">🔐 Conta</h2>

          <div>
            <label className="label">Email <span className="text-f1red">*</span></label>
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
            <label className="label">Password <span className="text-f1red">*</span></label>
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

        {/* ── PERFIL ────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">👤 Perfil</h2>

          <div>
            <label className="label">Nickname <span className="text-f1red">*</span></label>
            <input
              name="nickname"
              placeholder="O nome que aparece no ranking"
              className="input"
              value={form.nickname}
              onChange={handleChange}
              required
            />
            <p className="text-[11px] text-gray-600 mt-1">Este é o teu nome público na liga.</p>
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

          <div>
            <label className="label">
              WhatsApp
              <span className="text-gray-500 font-normal text-xs ml-1">(com código do país)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">📱</span>
              <input
                name="whatsapp"
                type="tel"
                placeholder="+258 84 000 0000"
                className="input pl-9"
                value={form.whatsapp}
                onChange={handleChange}
              />
            </div>
            <p className="text-[11px] text-gray-600 mt-1">Usado para avisos e grupo do WhatsApp da liga.</p>
          </div>
        </div>

        {/* ── F1 ────────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">🏎️ F1</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Piloto favorito</label>
              <select
                name="piloto_fav"
                className="input"
                value={form.piloto_fav}
                onChange={handleChange}
              >
                {DRIVERS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Equipa favorita</label>
              <select
                name="equipa_fav"
                className="input"
                value={form.equipa_fav}
                onChange={handleChange}
              >
                {TEAMS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                Nick F1 Fantasy
                <span className="text-gray-500 font-normal text-xs ml-1">(opcional)</span>
              </label>
              <input
                name="fantasy_nick"
                placeholder="fantasy.formula1.com"
                className="input"
                value={form.fantasy_nick}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">
                Nick F1 Predict
                <span className="text-gray-500 font-normal text-xs ml-1">(opcional)</span>
              </label>
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
            <label className="label">Bio <span className="text-gray-600 font-normal text-xs">(opcional)</span></label>
            <textarea
              name="bio"
              placeholder="Conta algo sobre ti e a tua paixão pela F1..."
              className="input resize-none h-20"
              value={form.bio}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && (
          <div className="text-red-400 bg-red-900/20 border border-red-800/30 p-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              A criar conta...
            </span>
          ) : (
            '🏁 Criar conta e entrar'
          )}
        </button>

        <p className="text-center text-sm text-gray-500">
          Já tens conta?{' '}
          <a href="/auth/login" className="text-f1red underline">Entrar</a>
        </p>
      </form>
    </div>
  )
}
