'use client'

import { useState } from 'react'
import type { GpCalendar, Member } from '@/lib/supabase/types'

type MemberRow = Pick<Member, 'email' | 'nickname' | 'predict_nick'>

export default function PredictImport({
  gps, members, adminEmail
}: {
  gps: GpCalendar[]; members: MemberRow[]; adminEmail: string
}) {
  const [selectedGp, setSelectedGp] = useState<number | ''>('')
  const [rows, setRows] = useState<{ email: string; nick: string; pontos_gp: string; pontos_acum: string }[]>(
    members.map(m => ({ email: m.email, nick: m.predict_nick ?? '', pontos_gp: '', pontos_acum: '' }))
  )
  const [csvText, setCsvText] = useState('')
  const [csvMode, setCsvMode] = useState(false)
  const [csvPreview, setCsvPreview] = useState<{ nick: string; pontos_gp: number; pontos_acum: number; matched: string | null }[]>([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // Parse CSV: "NickPredict,pontos_gp,pontos_acum" (3 cols) OR "NickPredict,pontos_acum" (2 cols)
  function parseCsv(text: string) {
    const lines = text.trim().split('\n').filter(l => l.trim())
    const parsed = lines.map(line => {
      const parts = line.split(/[,;\t]/).map(p => p.trim())
      if (parts.length >= 3) {
        const nick       = parts[0]
        const pontos_gp   = parseInt(parts[1].replace(/[^\d-]/g, ''))
        const pontos_acum = parseInt(parts[2].replace(/[^\d-]/g, ''))
        return { nick, pontos_gp: isNaN(pontos_gp) ? 0 : pontos_gp, pontos_acum: isNaN(pontos_acum) ? 0 : pontos_acum }
      } else if (parts.length === 2) {
        const nick        = parts[0]
        const pontos_acum = parseInt(parts[1].replace(/[^\d-]/g, ''))
        return { nick, pontos_gp: 0, pontos_acum: isNaN(pontos_acum) ? 0 : pontos_acum }
      }
      return null
    }).filter(Boolean) as { nick: string; pontos_gp: number; pontos_acum: number }[]

    const preview = parsed.map(({ nick, pontos_gp, pontos_acum }) => {
      const matched = members.find(m =>
        m.predict_nick?.toLowerCase() === nick.toLowerCase() ||
        m.nickname?.toLowerCase()    === nick.toLowerCase()
      )
      return { nick, pontos_gp, pontos_acum, matched: matched?.email ?? null }
    })

    setCsvPreview(preview)
  }

  function applyCsvToRows() {
    const updated = [...rows]
    csvPreview.forEach(({ nick, pontos_gp, pontos_acum, matched }) => {
      if (!matched) return
      const idx = updated.findIndex(r => r.email === matched)
      if (idx >= 0) {
        updated[idx] = { ...updated[idx], nick, pontos_gp: String(pontos_gp), pontos_acum: String(pontos_acum) }
      }
    })
    setRows(updated)
    setCsvMode(false)
    setCsvText('')
    setCsvPreview([])
  }

  async function handleSave() {
    if (!selectedGp) { setError('Selecciona o GP.'); return }

    const valid = rows.filter(r => r.pontos_acum !== '' && r.nick)
    if (valid.length === 0) { setError('Nenhum dado para guardar.'); return }

    setLoading(true)
    setError('')

    const gp = gps.find(g => g.id === selectedGp)!
    const toInsert = valid.map(r => ({
      member_email: r.email,
      gp_id:        selectedGp as number,
      nick_predict: r.nick,
      pontos_gp:    r.pontos_gp !== '' ? parseInt(r.pontos_gp) : null,
      pontos_acum:  parseInt(r.pontos_acum),
    }))

    const res = await fetch('/api/admin/save-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: toInsert, gp_id: selectedGp, gp_nome: gp.nome, admin_email: adminEmail }),
    })
    const result = await res.json()
    if (!res.ok || result.error) { setError(result.error ?? 'Erro ao guardar.'); setLoading(false); return }

    setSuccess(true)
    setLoading(false)
  }

  const unmatched = csvPreview.filter(r => !r.matched)
  const matched   = csvPreview.filter(r =>  r.matched)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">Importar F1 Predict</h1>
        <p className="text-gray-400 text-sm">Pontos do GP e acumulados do site f1predict.formula1.com.</p>
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
          ✅ F1 Predict importado com sucesso!<br />
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
              📋 Colar CSV
            </button>
          </div>

          {/* CSV paste mode */}
          {csvMode && (
            <div className="card mb-4 space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">Cola os dados do site F1 Predict.</p>
                <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2 mb-3">
                  <p className="text-xs text-yellow-400 font-bold mb-0.5">📋 Formato com pontos do GP</p>
                  <code className="text-xs text-yellow-300/80">NickPredict , pontos_GP , pontos_Acumulado</code>
                  <p className="text-xs text-yellow-300/60 mt-0.5">ex: <code>DPita - The Champion,83,466</code></p>
                  <p className="text-xs text-gray-500 mt-1">Também aceita 2 colunas (só acumulado): <code>DPita - The Champion,466</code></p>
                </div>
                <textarea
                  className="input resize-none h-44 font-mono text-sm"
                  placeholder={"DPita - The Champion,83,466\nPCA Team,45,453\n..."}
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
                    <p className="text-sm font-bold text-green-400">✅ {matched.length} correspondências</p>
                    {unmatched.length > 0 && (
                      <p className="text-sm text-yellow-400">⚠️ {unmatched.length} sem correspondência</p>
                    )}
                  </div>

                  {unmatched.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                      <p className="text-xs text-yellow-400 font-bold mb-1">Não encontrados (verifica o Nick Predict no perfil):</p>
                      {unmatched.map(r => (
                        <p key={r.nick} className="text-xs text-yellow-300">• {r.nick}</p>
                      ))}
                    </div>
                  )}

                  <div className="max-h-52 overflow-y-auto space-y-1">
                    {matched.map(r => {
                      const member = members.find(m => m.email === r.matched)
                      return (
                        <div key={r.nick} className="flex justify-between items-center text-sm bg-black/20 rounded px-3 py-1.5">
                          <span className="text-gray-300 w-28 truncate">{member?.nickname}</span>
                          <span className="text-gray-500 text-xs flex-1 truncate px-2">{r.nick}</span>
                          <span className="text-blue-400 font-bold text-xs mr-3">GP: {r.pontos_gp}</span>
                          <span className="text-green-400 font-bold">Acum: {r.pontos_acum}</span>
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
              <div className="grid grid-cols-4 gap-2 text-xs text-gray-500 font-bold uppercase px-1 mb-1">
                <span>Membro</span>
                <span>Nick Predict</span>
                <span>Pts GP</span>
                <span>Pts Acum</span>
              </div>
              {rows.map((row, i) => {
                const member = members.find(m => m.email === row.email)
                return (
                  <div key={row.email} className="grid grid-cols-4 gap-2 items-center">
                    <span className="text-sm text-gray-300 truncate">{member?.nickname}</span>
                    <input
                      className="input text-sm py-2"
                      placeholder="Nick Predict"
                      value={row.nick}
                      onChange={e => {
                        const copy = [...rows]; copy[i] = { ...copy[i], nick: e.target.value }; setRows(copy)
                      }}
                    />
                    <input
                      className="input text-sm py-2"
                      type="number"
                      placeholder="Pts GP"
                      value={row.pontos_gp}
                      onChange={e => {
                        const copy = [...rows]; copy[i] = { ...copy[i], pontos_gp: e.target.value }; setRows(copy)
                      }}
                    />
                    <input
                      className="input text-sm py-2"
                      type="number"
                      placeholder="Pts Acum"
                      value={row.pontos_acum}
                      onChange={e => {
                        const copy = [...rows]; copy[i] = { ...copy[i], pontos_acum: e.target.value }; setRows(copy)
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
              {loading ? 'A guardar...' : '💾 Guardar Predict'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
