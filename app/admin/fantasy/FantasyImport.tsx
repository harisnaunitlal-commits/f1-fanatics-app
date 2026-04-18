'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GpCalendar, Member } from '@/lib/supabase/types'

type MemberRow = Pick<Member, 'email' | 'nickname' | 'fantasy_nick'>

export default function FantasyImport({
  gps, members, adminEmail
}: {
  gps: GpCalendar[]; members: MemberRow[]; adminEmail: string
}) {
  const supabase = createClient()
  const [selectedGp, setSelectedGp] = useState<number | ''>('')
  const [rows, setRows] = useState<{ email: string; equipa_nome: string; pontos_acum: string }[]>(
    members.map(m => ({ email: m.email, equipa_nome: m.fantasy_nick ?? '', pontos_acum: '' }))
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!selectedGp) { setError('Selecciona o GP.'); return }
    const valid = rows.filter(r => r.pontos_acum !== '' && r.equipa_nome)
    if (valid.length === 0) { setError('Nenhum dado para guardar.'); return }

    setLoading(true); setError('')

    const gp = gps.find(g => g.id === selectedGp)!
    const toInsert = valid.map(r => ({
      member_email: r.email,
      gp_id: selectedGp as number,
      equipa_nome: r.equipa_nome,
      pontos_acum: parseInt(r.pontos_acum),
      pontos_gp: null,
    }))

    const { error: err } = await supabase.from('scores_fantasy').upsert(toInsert)
    if (err) { setError(err.message); setLoading(false); return }

    await supabase.from('audit_log').insert({
      admin_email: adminEmail,
      accao: 'import_fantasy',
      gp_id: selectedGp as number,
      detalhes: { n_rows: toInsert.length, gp_nome: gp.nome },
    })

    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">Importar F1 Fantasy</h1>
        <p className="text-gray-400 text-sm">Introduz os pontos acumulados do site para cada membro.</p>
      </div>

      <div className="card mb-6">
        <label className="label">GP *</label>
        <select className="select" value={selectedGp}
          onChange={e => setSelectedGp(e.target.value ? parseInt(e.target.value) : '')}>
          <option value="">Selecciona GP...</option>
          {gps.map(g => <option key={g.id} value={g.id}>{g.emoji_bandeira} {g.nome}</option>)}
        </select>
      </div>

      {success ? (
        <div className="card text-center text-green-400 py-8">
          ✅ Fantasy importado com sucesso!
          <br /><a href="/admin" className="text-f1red underline mt-2 block">← Voltar ao admin</a>
        </div>
      ) : (
        <div className="card">
          <p className="text-gray-500 text-sm mb-4">
            Nota: introduz o valor acumulado real do site (pode ser negativo temporariamente entre GPs).
          </p>
          <div className="space-y-2">
            {rows.map((row, i) => {
              const member = members.find(m => m.email === row.email)
              return (
                <div key={row.email} className="grid grid-cols-3 gap-2 items-center">
                  <span className="text-sm text-gray-300">{member?.nickname}</span>
                  <input className="input text-sm py-2"
                    placeholder="Nome equipa"
                    value={row.equipa_nome}
                    onChange={e => {
                      const copy = [...rows]; copy[i] = { ...copy[i], equipa_nome: e.target.value }
                      setRows(copy)
                    }} />
                  <input className="input text-sm py-2"
                    type="number"
                    placeholder="Pontos acum."
                    value={row.pontos_acum}
                    onChange={e => {
                      const copy = [...rows]; copy[i] = { ...copy[i], pontos_acum: e.target.value }
                      setRows(copy)
                    }} />
                </div>
              )
            })}
          </div>
          {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3 mt-4">{error}</p>}
          <button onClick={handleSave} disabled={loading} className="btn-primary w-full mt-4">
            {loading ? 'A guardar...' : '💾 Guardar Fantasy'}
          </button>
        </div>
      )}
    </div>
  )
}
