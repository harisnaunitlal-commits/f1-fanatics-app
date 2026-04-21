'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026 } from '@/lib/supabase/types'

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userEmail, setUserEmail] = useState('')

  const [form, setForm] = useState({
    nome_completo: '',
    nickname: '',
    whatsapp: '',
    piloto_fav: '',
    equipa_fav: '',
    fantasy_nick: '',
    predict_nick: '',
    data_nasc: '',
    sexo: '',
    cidade: '',
    pais: 'Moçambique',
    empresa: '',
    area_profissional: '',
    bio: '',
    visibilidade: 'publico',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user?.email) { router.push('/auth/login'); return }
      setUserEmail(user.email)
      // Pre-fill from existing member data
      (supabase as any).from('members').select('*').eq('email', user.email).single()
        .then(({ data }) => {
          if (data) {
            setForm({
              nome_completo:    data.nome_completo,
              nickname:         data.nickname,
              whatsapp:         data.whatsapp ?? '',
              piloto_fav:       data.piloto_fav ?? '',
              equipa_fav:       data.equipa_fav ?? '',
              fantasy_nick:     data.fantasy_nick ?? '',
              predict_nick:     data.predict_nick ?? '',
              data_nasc:        data.data_nasc ?? '',
              sexo:             data.sexo ?? '',
              cidade:           data.cidade ?? '',
              pais:             data.pais,
              empresa:          data.empresa ?? '',
              area_profissional: data.area_profissional ?? '',
              bio:              data.bio ?? '',
              visibilidade:     data.visibilidade,
            })
          }
        })
    })
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.bio.length > 100) {
      setError('A bio não pode ter mais de 100 caracteres.')
      setLoading(false); return
    }

    const payload = {
      email: userEmail,
      nome_completo: form.nome_completo.trim(),
      nickname: form.nickname.trim(),
      whatsapp: form.whatsapp.trim() || null,
      piloto_fav: form.piloto_fav || null,
      equipa_fav: form.equipa_fav || null,
      fantasy_nick: form.fantasy_nick.trim() || null,
      predict_nick: form.predict_nick.trim() || null,
      data_nasc: form.data_nasc || null,
      sexo: (form.sexo || null) as 'M' | 'F' | 'outro' | 'prefiro_nao_dizer' | null,
      cidade: form.cidade.trim() || null,
      pais: form.pais || 'Moçambique',
      empresa: form.empresa.trim() || null,
      area_profissional: form.area_profissional.trim() || null,
      bio: form.bio.trim() || null,
      visibilidade: form.visibilidade as 'publico' | 'membros' | 'privado',
    }

    const { error } = await (supabase as any).from('members').upsert(payload)
    if (error) {
      setError(error.message.includes('unique') ? 'Este nickname já está em uso.' : error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Registo de Membro</h1>
        <p className="text-gray-400 mt-1">
          Preenche o teu perfil para participar nas ligas · <span className="text-gray-500">{userEmail}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Obrigatórios */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 text-f1red">Dados obrigatórios</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome completo *</label>
              <input className="input" value={form.nome_completo} onChange={set('nome_completo')} required />
            </div>
            <div>
              <label className="label">Nickname público (ranking) *</label>
              <input className="input" value={form.nickname} onChange={set('nickname')} required
                placeholder="Ex: Haris, Zema, IsoF1..." />
            </div>
            <div>
              <label className="label">WhatsApp *</label>
              <input className="input" type="tel" value={form.whatsapp} onChange={set('whatsapp')} required
                placeholder="+258 84 000 0000" />
            </div>
            <div>
              <label className="label">Piloto favorito *</label>
              <select className="select" value={form.piloto_fav} onChange={set('piloto_fav')} required>
                <option value="">Selecciona...</option>
                {PILOTOS_2026.map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.nome} ({p.equipa})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Equipa favorita *</label>
              <select className="select" value={form.equipa_fav} onChange={set('equipa_fav')} required>
                <option value="">Selecciona...</option>
                {EQUIPAS_2026.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Nick no F1 Fantasy</label>
              <input className="input" value={form.fantasy_nick} onChange={set('fantasy_nick')}
                placeholder="Como aparece em fantasy.formula1.com" />
            </div>
            <div>
              <label className="label">Nick no F1 Predict</label>
              <input className="input" value={form.predict_nick} onChange={set('predict_nick')}
                placeholder="Como aparece em f1predict.formula1.com" />
            </div>
          </div>
        </div>

        {/* Opcionais */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 text-gray-400">Dados opcionais (comunidade)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Data de nascimento</label>
              <input className="input" type="date" value={form.data_nasc} onChange={set('data_nasc')} />
            </div>
            <div>
              <label className="label">Género</label>
              <select className="select" value={form.sexo} onChange={set('sexo')}>
                <option value="">Prefiro não dizer</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="outro">Outro</option>
                <option value="prefiro_nao_dizer">Prefiro não dizer</option>
              </select>
            </div>
            <div>
              <label className="label">Cidade</label>
              <input className="input" value={form.cidade} onChange={set('cidade')} placeholder="Beira" />
            </div>
            <div>
              <label className="label">País</label>
              <input className="input" value={form.pais} onChange={set('pais')} placeholder="Moçambique" />
            </div>
            <div>
              <label className="label">Empresa / Organização</label>
              <input className="input" value={form.empresa} onChange={set('empresa')} />
            </div>
            <div>
              <label className="label">Área profissional</label>
              <input className="input" value={form.area_profissional} onChange={set('area_profissional')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Bio (máx 100 caracteres)</label>
              <textarea className="input resize-none" rows={2} maxLength={100}
                value={form.bio} onChange={set('bio')} placeholder="Apaixonado pela F1 desde..." />
              <p className="text-xs text-gray-500 mt-1">{form.bio.length}/100</p>
            </div>
            <div>
              <label className="label">Visibilidade do perfil</label>
              <select className="select" value={form.visibilidade} onChange={set('visibilidade')}>
                <option value="publico">Público (todos vêem)</option>
                <option value="membros">Só membros</option>
                <option value="privado">Privado</option>
              </select>
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full text-lg">
          {loading ? 'A guardar...' : 'Guardar perfil'}
        </button>
      </form>
    </div>
  )
}
