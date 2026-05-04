'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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

interface Member {
  email: string
  nickname: string
  nome_completo: string | null
  cidade: string | null
  pais: string | null
  whatsapp: string | null
  piloto_fav: string | null
  equipa_fav: string | null
  fantasy_nick: string | null
  predict_nick: string | null
  bio: string | null
}

export default function EditProfileForm({ member }: { member: Member }) {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    nickname:      member.nickname        ?? '',
    nome_completo: member.nome_completo   ?? '',
    cidade:        member.cidade          ?? '',
    pais:          member.pais            ?? 'Moçambique',
    whatsapp:      member.whatsapp        ?? '',
    piloto_fav:    member.piloto_fav      ?? '',
    equipa_fav:    member.equipa_fav      ?? '',
    fantasy_nick:  member.fantasy_nick    ?? '',
    predict_nick:  member.predict_nick    ?? '',
    bio:           member.bio             ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!form.nickname.trim()) {
      setError('O nickname é obrigatório.')
      setLoading(false)
      return
    }

    const { error: profileErr } = await (supabase as any)
      .from('members')
      .update({
        nickname:      form.nickname.trim(),
        nome_completo: form.nome_completo.trim() || null,
        cidade:        form.cidade.trim()        || null,
        pais:          form.pais.trim()          || null,
        whatsapp:      form.whatsapp.trim()      || null,
        piloto_fav:    form.piloto_fav           || null,
        equipa_fav:    form.equipa_fav           || null,
        fantasy_nick:  form.fantasy_nick.trim()  || null,
        predict_nick:  form.predict_nick.trim()  || null,
        bio:           form.bio.trim()           || null,
        actualizado_em: new Date().toISOString(),
      })
      .eq('email', member.email)

    if (profileErr) {
      setError(profileErr.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/profile'), 1200)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Perfil actualizado!</h1>
        <p className="text-gray-400">A redirigir para o teu perfil...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Perfil */}
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
        </div>
      </div>

      {/* F1 */}
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

        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2.5">
          <p className="text-xs text-yellow-400 font-bold mb-0.5">⚠️ Atenção — Nick Fantasy e Nick Predict</p>
          <p className="text-xs text-yellow-300/80">
            O nome deve ser <span className="font-bold">exactamente igual</span> ao nome da tua equipa/conta nos sites oficiais da Formula 1.
            Se alterares o nome no site da F1, actualiza aqui também — caso contrário os teus pontos não serão contabilizados.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nick Fantasy</label>
            <input
              name="fantasy_nick"
              placeholder="Nome exacto no fantasy.formula1.com"
              className="input"
              value={form.fantasy_nick}
              onChange={handleChange}
            />
            <p className="text-[11px] text-gray-600 mt-1">ex: "ABx Racing" — copia do site</p>
          </div>
          <div>
            <label className="label">Nick Predict</label>
            <input
              name="predict_nick"
              placeholder="Nome exacto no f1predict.formula1.com"
              className="input"
              value={form.predict_nick}
              onChange={handleChange}
            />
            <p className="text-[11px] text-gray-600 mt-1">ex: "VirgoF1" — copia do site</p>
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

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="btn-secondary flex-1"
        >
          Cancelar
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'A guardar...' : '💾 Guardar alterações'}
        </button>
      </div>

    </form>
  )
}
