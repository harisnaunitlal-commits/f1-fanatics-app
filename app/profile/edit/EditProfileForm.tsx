'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Member {
  email: string
  nickname: string
  nome_completo: string | null
  cidade: string | null
  pais: string | null
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
    piloto_fav:    member.piloto_fav      ?? '',
    equipa_fav:    member.equipa_fav      ?? '',
    fantasy_nick:  member.fantasy_nick    ?? '',
    predict_nick:  member.predict_nick    ?? '',
    bio:           member.bio             ?? '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
        piloto_fav:    form.piloto_fav.trim()    || null,
        equipa_fav:    form.equipa_fav.trim()    || null,
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
      </div>

      {/* F1 */}
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
