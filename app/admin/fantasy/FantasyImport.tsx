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
  const [csvText, setCsvText] = useState('')
  const [csvMode, setCsvMode] = useState(false)
  const [csvPreview, setCsvPreview] = useState<{ nick: string; pontos: number; matched: string | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Parse CSV/paste: each line = "NickEquipa,pontos" or "NickEquipa pontos"
  function parseCsv(text: string) {
    const lines = text.trim().split('\n').filter(l => l.trim())
    const parsed = lines.map(line => {
      // Support comma, semicolon, or tab as separator
      const parts = line.split(/[,;\t]/).map(p => p.trim())
      if (parts.length >= 2) {
        const nick = parts[0]
        const pontos = parseInt(parts[parts.length - 1].replace(/[^\d-]/g, ''))
        return { nick, pontos: isNaN(pontos) ? 0 : pontos }
      }
      return null
    }).filter(Boolean) as { nick: string; pontos: number }[]

    // Try to match each nick to a member
    const preview = parsed.map(({ nick, pontos }) => {
      const matched = members.find(m =>
        m.fantasy_nick?.toLowerCase() === nick.toLowerCase() ||
        m.nickname?.toLowerCase() === nick.toLowerCase()
      )
      return { nick, pontos, matched: matched?.email ?? null }
    })

    setCsvPreview(preview)
  }

  function applyCsvToRows() {
    const updated = [...rows]
    csvPreview.forEach(({ nick, pontos, matched }) => {
      if (!matched) return
      const idx = updated.findIndex(r => r.email === matched)
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], equipa_nome: nick, pontos_acum: String(pontos) }
      }
    })
    setRows(updated)
    setCsvMode(false)
    setCsvText('')
    setCsvPreview([])
  }

  async function handleSave() {
    if (!selectedGp) { setError('Selecciona o GP.'); return }

    const valid = rows.filter(r => r.pontos_acum !== '' && r.equipa_nome)
    if (valid.length === 0) { setError('Nenhum dado para guardar.'); return }

    setLoading(true)
    setError('')

    const gp = gps.find(g => g.id === selectedGp)!
    const toInsert = valid.map(r => ({
      member_email: r.email,
      gp_id: selectedGp as number,
      equipa_nome: r.equipa_nome,
      pontos_acum: parseInt(r.pontos_acum),
      pontos_gp: null,
    }))

    const { error: err } = await (supabase as any).from('scores_fantasy').upsert(toInsert)
    if (err) { setError(err.message); setLoading(false); return }

    await (supabase as any).from('audit_log').insert({
      admin_email: adminEmail,
      accao: 'import_fantasy',
      gp_id: selectedGp as number,
      detalhes: { n_rows: toInsert.length, gp_nome: gp.nome },
    })

    setSuccess(true)
    setLoading(false)
  }

  const unmatched = csvPreview.filter(r => !r.matched)
  const matched = csvPreview.filter(r => r.matched)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">Importar F1 Fantasy</h1>
        <p className="text-gray-400 text-sm">Introduz os pontos acumulados do site para cada membro.</p>
      </div>

      {/* GP selector */}
      <div className="card mb-4">
        <label className="label">GP *</label>
        <select
          className="select"
          value={selectedGp}
          onChange={e => setSelectedGp(e.target.value ? parseInt(e.target.value) : '')}
        >
          <option value="">Selecciona GP...</option>
          {gps.map(g => (
            <option key={g.id} value={g.id}>{g.emoji_bandeira} {g.nome}</option>
          ))}
        </select>
      </div>

      {success ? (
        <div className="card text-center text-green-400 py-8">
          ✅ Fantasy importado com sucesso!<br />
          <a href="/admin" className="text-f1red underline mt-2 block">← Voltar ao admin</a>
        </div>
      ) : (
        <>
          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCsvMode(false)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${!csvMode ? 'bg-f1red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              ✏️ Manual
            </button>
            <button
              onClick={() => setCsvMode(true)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${csvMode ? 'bg-f1red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              📋 Colar CSV / Tabela
            </button>
          </div>

          {/* CSV paste mode */}
          {csvMode && (
            <div className="card mb-4 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">
                  Cola aqui os dados directamente do site F1 Fantasy ou de uma folha Excel.<br />
                  <span className="text-gray-500 text-xs">Formato: <code className="bg-black/40 px-1 rounded">Nome Equipa , Pontos</code> — uma linha por jogador</span>
                </p>
                <textarea
                  className="input resize-none h-40 font-mono text-sm"
                  placeholder={"ABx Racing, 312\nAlexFer#1, 287\nVirgo F1, 301\n..."}
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                />
              </div>
              <button
                onClick={() => parseCsv(csvText)}
                disabled={!csvText.trim()}
                className="btn-secondary w-full"
              >
                🔍 Pré-visualizar correspondências
              </button>

              {csvPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-green-400">✅ {matched.length} correspondências encontradas</p>
                    {unmatched.length > 0 && (
                      <p className="text-sm text-yellow-400">⚠️ {unmatched.length} sem correspondência</p>
                    )}
                  </div>

                  {/* Unmatched warning */}
                  {unmatched.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                      <p className="text-xs text-yellow-400 font-bold mb-1">Não encontrados (verifica o Nick Fantasy no perfil):</p>
                      {unmatched.map(r => (
                        <p key={r.nick} className="text-xs text-yellow-300">• {r.nick}</p>
                      ))}
                    </div>
                  )}

                  {/* Preview table */}
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {matched.map(r => {
                      const member = members.find(m => m.email === r.matched)
                      return (
                        <div key={r.nick} className="flex justify-between text-sm bg-black/20 rounded px-3 py-1.5">
                          <span className="text-gray-300">{member?.nickname}</span>
                          <span className="text-gray-500 text-xs">{r.nick}</span>
                          <span className="text-green-400 font-bold">{r.pontos} pts</span>
                        </div>
                      )
                    })}
                  </div>

                  <button onClick={applyCsvToRows} className="btn-primary w-full">
                    ✅ Aplicar e rever antes de guardar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Manual table */}
          {!csvMode && (
            <div className="card space-y-2">
              <p className="text-gray-500 text-xs mb-2">
                Nota: introduz o valor acumulado real do site (total desde o início da época).
              </p>
              {rows.map((row, i) => {
                const member = members.find(m => m.email === row.email)
                return (
                  <div key={row.email} className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-sm text-gray-300">{member?.nickname}</span>
                    <input
                      className="input text-sm py-2"
                      placeholder="Nome equipa"
                      value={row.equipa_nome}
                      onChange={e => {
                        const copy = [...rows]
                        copy[i] = { ...copy[i], equipa_nome: e.target.value }
                        setRows(copy)
                      }}
                    />
                    <input
                      className="input text-sm py-2"
                      type="number"
                      placeholder="Pontos acum."
                      value={row.pontos_acum}
                      onChange={e => {
                        const copy = [...rows]
                        copy[i] = { ...copy[i], pontos_acum: e.target.value }
                        setRows(copy)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3 mt-4">⚠️ {error}</p>}

          {!csvMode && (
            <button onClick={handleSave} disabled={loading} className="btn-primary w-full mt-4">
              {loading ? 'A guardar...' : '💾 Guardar Fantasy'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
