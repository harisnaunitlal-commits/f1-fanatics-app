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

  const [form, setForm] = useState({
    nickname: '',
    nome_completo: '',
    cidade: '',
    pais: '',
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      setError('Utilizador não autenticado.')
      setLoading(false)
      return
    }

    const { error: err } = await supabase.from('members').upsert({
      email: user.email,
      ...form,
      activo: true,
      atualizado_em: new Date().toISOString(),
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    setTimeout(() => {
      router.push('/profile')
    }, 1500)
  }

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Registo de Membro</h1>

      {success ? (
        <div className="card text-green-400 text-center py-8">
          ✅ Perfil guardado com sucesso!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <input
            name="nickname"
            placeholder="Nickname"
            className="input"
            value={form.nickname}
            onChange={handleChange}
            required
          />

          <input
            name="nome_completo"
            placeholder="Nome completo"
            className="input"
            value={form.nome_completo}
            onChange={handleChange}
          />

          <input
            name="cidade"
            placeholder="Cidade"
            className="input"
            value={form.cidade}
            onChange={handleChange}
          />

          <input
            name="pais"
            placeholder="País"
            className="input"
            value={form.pais}
            onChange={handleChange}
          />

          <input
            name="piloto_fav"
            placeholder="Piloto favorito"
            className="input"
            value={form.piloto_fav}
            onChange={handleChange}
          />

          <input
            name="equipa_fav"
            placeholder="Equipa favorita"
            className="input"
            value={form.equipa_fav}
            onChange={handleChange}
          />

          <input
            name="fantasy_nick"
            placeholder="Nick Fantasy"
            className="input"
            value={form.fantasy_nick}
            onChange={handleChange}
          />

          <input
            name="predict_nick"
            placeholder="Nick Predict"
            className="input"
            value={form.predict_nick}
            onChange={handleChange}
          />

          <textarea
            name="bio"
            placeholder="Bio (opcional)"
            className="input"
            value={form.bio}
            onChange={handleChange}
          />

          {error && (
            <div className="text-red-400 bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'A guardar...' : '💾 Guardar Perfil'}
          </button>
        </form>
      )}
    </div>
  )
}