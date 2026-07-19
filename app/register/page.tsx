'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const DRIVERS = [
  { value: '', label: 'Selecciona...' },
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
  { value: '', label: 'Selecciona...' },
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

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const PRESET_AVATARS = [
  { id: 'vermelho', bg: '#E8002D', accent: '#fff' },
  { id: 'laranja',  bg: '#FF8000', accent: '#fff' },
  { id: 'teal',     bg: '#00D2BE', accent: '#fff' },
  { id: 'azul',     bg: '#3671C6', accent: '#fff' },
  { id: 'verde',    bg: '#358C75', accent: '#fff' },
  { id: 'roxo',     bg: '#7C3AED', accent: '#fff' },
  { id: 'preto',    bg: '#1E293B', accent: '#fff' },
  { id: 'dourado',  bg: '#B45309', accent: '#FCD34D' },
]

function HelmetSvg({ bg, accent }: { bg: string; accent: string }) {
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="50" cy="50" r="50" fill={bg} />
      <path d="M22 62 C22 32 78 32 78 62 L78 74 C78 78 75 80 72 80 L28 80 C25 80 22 78 22 74 Z" fill="white" opacity="0.92" />
      <path d="M30 62 L70 62 L67 76 L33 76 Z" fill="#0F172A" opacity="0.88" />
      <rect x="22" y="61" width="56" height="3" rx="1.5" fill={bg} />
      <path d="M32 64 L50 64 L48 68 L32 68 Z" fill="white" opacity="0.12" />
    </svg>
  )
}

function makeSvgBlob(bg: string, accent: string): Blob {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<circle cx="50" cy="50" r="50" fill="${bg}"/>
<path d="M22 62 C22 32 78 32 78 62 L78 74 C78 78 75 80 72 80 L28 80 C25 80 22 78 22 74 Z" fill="white" opacity="0.92"/>
<path d="M30 62 L70 62 L67 76 L33 76 Z" fill="#0F172A" opacity="0.88"/>
<rect x="22" y="61" width="56" height="3" rx="1.5" fill="${bg}"/>
</svg>`
  return new Blob([svg], { type: 'image/svg+xml' })
}

export default function RegisterPage() {
  const supabase = createClient()
  const router = useRouter()
  const photoInputRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [photoTab, setPhotoTab] = useState<'preset' | 'upload'>('preset')
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
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
    sexo: '',
    nasc_dia: '',
    nasc_mes: '',
    nasc_ano: '',
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
    setSelectedAvatar(null)
    setError('')
  }

  function selectPreset(id: string) {
    setSelectedAvatar(id)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const hasPhoto = !!photoFile || !!selectedAvatar

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // ── Validations ────────────────────────────────────────────────
    if (!hasPhoto) {
      setError('A foto de perfil é obrigatória. Escolhe um avatar ou faz upload de uma foto.')
      return
    }
    if (form.password.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres.')
      return
    }
    if (!form.nickname.trim()) {
      setError('O nickname é obrigatório.')
      return
    }
    if (!form.nome_completo.trim()) {
      setError('O nome completo é obrigatório.')
      return
    }
    if (!form.cidade.trim()) {
      setError('A cidade é obrigatória.')
      return
    }
    if (!form.whatsapp.trim()) {
      setError('O WhatsApp é obrigatório.')
      return
    }
    if (!form.sexo) {
      setError('O sexo é obrigatório.')
      return
    }
    if (!form.nasc_dia || !form.nasc_mes || !form.nasc_ano) {
      setError('A data de nascimento é obrigatória.')
      return
    }
    if (!form.piloto_fav) {
      setError('Selecciona o teu piloto favorito.')
      return
    }
    if (!form.equipa_fav) {
      setError('Selecciona a tua equipa favorita.')
      return
    }

    setLoading(true)

    const userEmail = form.email.toLowerCase().trim()
    const dataNasc = `${form.nasc_ano}-${String(MESES.indexOf(form.nasc_mes) + 1).padStart(2, '0')}-${String(form.nasc_dia).padStart(2, '0')}`

    // ── Upload photo ────────────────────────────────────────────────
    let fotoUrl: string | null = null

    try {
      let fileToUpload: File | Blob
      let ext: string

      if (photoFile) {
        fileToUpload = photoFile
        ext = photoFile.type === 'image/png' ? 'png' : photoFile.type === 'image/webp' ? 'webp' : 'jpg'
      } else {
        const av = PRESET_AVATARS.find(a => a.id === selectedAvatar)!
        fileToUpload = makeSvgBlob(av.bg, av.accent)
        ext = 'svg'
      }

      const path = `${userEmail}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, fileToUpload, { upsert: true, contentType: fileToUpload.type ?? 'image/svg+xml' })

      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
        fotoUrl = urlData.publicUrl
      }
    } catch {
      // continue without photo on error
    }

    // ── Call register API ───────────────────────────────────────────
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:         userEmail,
        password:      form.password,
        nickname:      form.nickname.trim(),
        nome_completo: form.nome_completo.trim(),
        cidade:        form.cidade.trim(),
        pais:          form.pais.trim() || 'Moçambique',
        whatsapp:      form.whatsapp.trim(),
        sexo:          form.sexo,
        data_nasc:     dataNasc,
        piloto_fav:    form.piloto_fav,
        equipa_fav:    form.equipa_fav,
        fantasy_nick:  form.fantasy_nick.trim() || null,
        predict_nick:  form.predict_nick.trim() || null,
        bio:           form.bio.trim() || null,
        foto_url:      fotoUrl,
      }),
    })

    const result = await res.json()

    if (!res.ok || result.error) {
      setError(result.error ?? 'Erro ao criar conta.')
      setLoading(false)
      return
    }

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

  const currentYear = new Date().getFullYear()
  const anos = Array.from({ length: currentYear - 1939 }, (_, i) => currentYear - 5 - i).filter(y => y >= 1940)

  return (
    <div className="max-w-xl mx-auto pb-12">
      <h1 className="text-3xl font-bold mb-2 mt-8">Registo de Membro</h1>
      <p className="text-gray-400 mb-6 text-sm">
        Cria a tua conta para entrar na liga. Campos com <span className="text-f1red">*</span> são obrigatórios.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── FOTO / AVATAR ──────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">
            📷 Foto de Perfil <span className="text-f1red">*</span>
          </h2>

          {/* Tabs */}
          <div className="flex rounded-lg overflow-hidden border border-gray-700">
            <button
              type="button"
              onClick={() => setPhotoTab('preset')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                photoTab === 'preset'
                  ? 'bg-f1red text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              🏎️ Escolher Avatar
            </button>
            <button
              type="button"
              onClick={() => setPhotoTab('upload')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                photoTab === 'upload'
                  ? 'bg-f1red text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              📸 Upload Foto
            </button>
          </div>

          {/* Preset avatars */}
          {photoTab === 'preset' && (
            <div>
              <p className="text-xs text-gray-500 mb-3">Escolhe o teu capacete F1:</p>
              <div className="grid grid-cols-4 gap-3">
                {PRESET_AVATARS.map(av => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => selectPreset(av.id)}
                    className="relative aspect-square rounded-full overflow-hidden transition-all duration-200 focus:outline-none"
                    style={{
                      boxShadow: selectedAvatar === av.id
                        ? `0 0 0 3px white, 0 0 0 5px ${av.bg}`
                        : '0 0 0 2px rgba(255,255,255,0.1)',
                      transform: selectedAvatar === av.id ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <HelmetSvg bg={av.bg} accent={av.accent} />
                    {selectedAvatar === av.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="text-white text-xl font-black drop-shadow">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upload photo */}
          {photoTab === 'upload' && (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="relative group focus:outline-none"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover border-2 border-f1red ring-2 ring-f1red/30"
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
          )}

          {/* Preview of selected preset */}
          {selectedAvatar && photoTab === 'preset' && (
            <div className="flex items-center gap-2 text-xs text-green-400">
              <div
                className="w-6 h-6 rounded-full overflow-hidden shrink-0"
                style={{ background: PRESET_AVATARS.find(a => a.id === selectedAvatar)?.bg }}
              >
                <HelmetSvg
                  bg={PRESET_AVATARS.find(a => a.id === selectedAvatar)!.bg}
                  accent={PRESET_AVATARS.find(a => a.id === selectedAvatar)!.accent}
                />
              </div>
              ✓ Avatar seleccionado
            </div>
          )}
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
            <label className="label">Nome completo <span className="text-f1red">*</span></label>
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
              <label className="label">Cidade <span className="text-f1red">*</span></label>
              <input
                name="cidade"
                placeholder="Beira"
                className="input"
                value={form.cidade}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">País <span className="text-f1red">*</span></label>
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
              WhatsApp <span className="text-f1red">*</span>
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

          {/* Sexo */}
          <div>
            <label className="label">Sexo <span className="text-f1red">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'M',                  label: '♂ Masculino' },
                { value: 'F',                  label: '♀ Feminino' },
                { value: 'outro',              label: '⚧ Outro' },
                { value: 'prefiro_nao_dizer',  label: '🔒 Prefiro não dizer' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, sexo: opt.value }))}
                  className="py-2 px-3 rounded-lg border text-sm font-medium transition-all duration-150"
                  style={{
                    borderColor: form.sexo === opt.value ? '#E8002D' : 'rgba(255,255,255,0.1)',
                    backgroundColor: form.sexo === opt.value ? 'rgba(232,0,45,0.15)' : 'rgba(255,255,255,0.03)',
                    color: form.sexo === opt.value ? '#fff' : '#9ca3af',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data de nascimento */}
          <div>
            <label className="label">Data de Nascimento <span className="text-f1red">*</span></label>
            <div className="grid grid-cols-3 gap-2">
              <select
                name="nasc_dia"
                className="input"
                value={form.nasc_dia}
                onChange={handleChange}
              >
                <option value="">Dia</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                name="nasc_mes"
                className="input"
                value={form.nasc_mes}
                onChange={handleChange}
              >
                <option value="">Mês</option>
                {MESES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                name="nasc_ano"
                className="input"
                value={form.nasc_ano}
                onChange={handleChange}
              >
                <option value="">Ano</option>
                {anos.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-gray-600 mt-1">Usada para enviar parabéns no teu aniversário! 🎂</p>
          </div>
        </div>

        {/* ── F1 ────────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <h2 className="font-bold text-f1red">🏎️ F1</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Piloto favorito <span className="text-f1red">*</span></label>
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
              <label className="label">Equipa favorita <span className="text-f1red">*</span></label>
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

          <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2.5">
            <p className="text-xs text-yellow-400 font-bold mb-0.5">⚠️ Nick Fantasy e Nick Predict</p>
            <p className="text-xs text-yellow-300/80">
              Copia o nome <span className="font-bold">exactamente como aparece</span> nos sites da Formula 1.
              Se alterares o nome no site da F1, actualiza aqui também — caso contrário os teus pontos não serão contabilizados.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                Nick F1 Fantasy
                <span className="text-gray-500 font-normal text-xs ml-1">(opcional)</span>
              </label>
              <input
                name="fantasy_nick"
                placeholder="Nome exacto no site Fantasy"
                className="input"
                value={form.fantasy_nick}
                onChange={handleChange}
              />
              <p className="text-[11px] text-gray-600 mt-1">ex: "ABx Racing"</p>
            </div>
            <div>
              <label className="label">
                Nick F1 Predict
                <span className="text-gray-500 font-normal text-xs ml-1">(opcional)</span>
              </label>
              <input
                name="predict_nick"
                placeholder="Nome exacto no site Predict"
                className="input"
                value={form.predict_nick}
                onChange={handleChange}
              />
              <p className="text-[11px] text-gray-600 mt-1">ex: "VirgoF1"</p>
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
