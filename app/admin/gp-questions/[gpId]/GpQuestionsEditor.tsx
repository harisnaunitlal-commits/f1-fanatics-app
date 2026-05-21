'use client'

import { useState } from 'react'
import { PILOTOS_2026 } from '@/lib/supabase/types'
import type { GpQuestions, DuelConfig, DriverOption } from '@/lib/gp-questions'
import { TEAM_COLORS } from '@/lib/gp-questions'

const ALL_DRIVERS = (PILOTOS_2026 as readonly { codigo: string; nome: string; equipa: string }[])

function driverColor(equipa: string): string {
  return TEAM_COLORS[equipa] ?? '#888888'
}

function DuelEditor({
  label, value, onChange,
}: {
  label: string
  value: DuelConfig
  onChange: (d: DuelConfig) => void
}) {
  function setA(codigo: string) {
    const d = ALL_DRIVERS.find(p => p.codigo === codigo)
    if (!d) return
    onChange({ ...value, driverA: d.codigo, nameA: d.nome, teamA: d.equipa, colorA: driverColor(d.equipa) })
  }
  function setB(codigo: string) {
    const d = ALL_DRIVERS.find(p => p.codigo === codigo)
    if (!d) return
    onChange({ ...value, driverB: d.codigo, nameB: d.nome, teamB: d.equipa, colorB: driverColor(d.equipa) })
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-bold text-f1red">{label}</h3>
      <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-3">
        {/* Driver A */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-bold uppercase">Piloto A</label>
          <select
            className="select"
            value={value.driverA}
            onChange={e => setA(e.target.value)}
          >
            {ALL_DRIVERS.map(p => (
              <option key={p.codigo} value={p.codigo}>{p.nome} ({p.equipa})</option>
            ))}
          </select>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.colorA }} />
            <span className="text-xs text-gray-400">{value.nameA}</span>
          </div>
        </div>

        <div className="text-center font-black text-gray-500 text-sm">VS</div>

        {/* Driver B */}
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-bold uppercase">Piloto B</label>
          <select
            className="select"
            value={value.driverB}
            onChange={e => setB(e.target.value)}
          >
            {ALL_DRIVERS.map(p => (
              <option key={p.codigo} value={p.codigo}>{p.nome} ({p.equipa})</option>
            ))}
          </select>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: value.colorB }} />
            <span className="text-xs text-gray-400">{value.nameB}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SpecialEditor({
  code, label, options,
  onLabelChange, onOptionsChange,
}: {
  code: string
  label: string
  options: DriverOption[]
  onLabelChange: (v: string) => void
  onOptionsChange: (opts: DriverOption[]) => void
}) {
  function setDriver(i: number, codigo: string) {
    const d = ALL_DRIVERS.find(p => p.codigo === codigo)
    if (!d) return
    const updated = [...options]
    updated[i] = { codigo: d.codigo, nome: d.nome, equipa: d.equipa, color: driverColor(d.equipa) }
    onOptionsChange(updated)
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-bold text-f1red">{code} · Pergunta Especial / Outsider</h3>
      <div>
        <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Texto da Pergunta</label>
        <input
          className="input text-sm"
          value={label}
          onChange={e => onLabelChange(e.target.value)}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500 font-bold uppercase mb-2 block">5 Pilotos à escolha</label>
        <div className="grid grid-cols-1 gap-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-gray-600 w-4">{i + 1}.</span>
              <select
                className="select text-sm flex-1"
                value={opt.codigo}
                onChange={e => setDriver(i, e.target.value)}
              >
                {ALL_DRIVERS.map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.nome} ({p.equipa})</option>
                ))}
              </select>
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: opt.color }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function GpQuestionsEditor({
  gpId, gpNome, gpEmoji, initialConfig,
}: {
  gpId: number
  gpNome: string
  gpEmoji: string
  initialConfig: GpQuestions
}) {
  const [config, setConfig] = useState<GpQuestions>(initialConfig)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setLoading(true); setError(''); setSuccess(false)
    const res = await fetch('/api/admin/save-gp-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gp_id: gpId, config }),
    })
    const result = await res.json()
    if (!res.ok || result.error) { setError(result.error ?? 'Erro ao guardar.'); setLoading(false); return }
    setSuccess(true)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto pb-12 space-y-5">
      <div className="mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">{gpEmoji} Editar Perguntas — {gpNome}</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configura os duelos e perguntas especiais para este GP. As alterações substituem os valores padrão.
        </p>
      </div>

      {/* GP name fields */}
      <div className="card space-y-3">
        <h3 className="font-bold text-f1red">Nome do GP nas perguntas</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Nome (ex: Canadá)</label>
            <input className="input text-sm" value={config.gpName}
              onChange={e => setConfig(c => ({ ...c, gpName: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Preposição (da/do/de)</label>
            <select className="select text-sm" value={config.gpPrep}
              onChange={e => setConfig(c => ({ ...c, gpPrep: e.target.value }))}>
              <option value="da">da</option>
              <option value="do">do</option>
              <option value="de">de</option>
              <option value="dos">dos</option>
            </select>
          </div>
        </div>
      </div>

      {/* P2 label */}
      <div className="card space-y-2">
        <h3 className="font-bold text-f1red">P2 · Equipa</h3>
        <label className="text-xs text-gray-500 font-bold uppercase mb-1 block">Texto da Pergunta</label>
        <input className="input text-sm" value={config.p2Label}
          onChange={e => setConfig(c => ({ ...c, p2Label: e.target.value }))} />
      </div>

      {/* Duelos */}
      <DuelEditor
        label="P5 · Duelo 1"
        value={config.p5}
        onChange={p5 => setConfig(c => ({ ...c, p5 }))}
      />
      <DuelEditor
        label="P6 · Duelo 2"
        value={config.p6}
        onChange={p6 => setConfig(c => ({ ...c, p6 }))}
      />
      <DuelEditor
        label="P7 · Duelo 3"
        value={config.p7}
        onChange={p7 => setConfig(c => ({ ...c, p7 }))}
      />

      {/* P13 Especial */}
      <SpecialEditor
        code="P13"
        label={config.p13Label}
        options={config.p13Options}
        onLabelChange={v => setConfig(c => ({ ...c, p13Label: v }))}
        onOptionsChange={opts => setConfig(c => ({ ...c, p13Options: opts }))}
      />

      {/* P15 Outsider */}
      <SpecialEditor
        code="P15"
        label={config.p15Label}
        options={config.p15Options}
        onLabelChange={v => setConfig(c => ({ ...c, p15Label: v }))}
        onOptionsChange={opts => setConfig(c => ({ ...c, p15Options: opts }))}
      />

      {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">⚠️ {error}</p>}

      {success && (
        <div className="bg-green-900/20 border border-green-700/30 rounded-lg px-4 py-3 text-green-400 text-sm font-bold">
          ✅ Perguntas guardadas com sucesso! Os membros já verão as novas perguntas.
        </div>
      )}

      <button onClick={handleSave} disabled={loading} className="btn-primary w-full">
        {loading ? 'A guardar...' : '💾 Guardar Perguntas'}
      </button>
    </div>
  )
}
