'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026, MARGENS_VITORIA, OPCOES_CLASSIF } from '@/lib/supabase/types'
import type { GpCalendar, Prediction } from '@/lib/supabase/types'
import { getTimeUntilDeadline, isDeadlinePassed } from '@/lib/scoring'

// Duelos pré-definidos por equipa
const DUELOS = [
  { label: 'Red Bull: Verstappen vs Tsunoda',    opts: ['VER', 'TSU'] },
  { label: 'McLaren: Norris vs Piastri',         opts: ['NOR', 'PIA'] },
  { label: 'Ferrari: Leclerc vs Hamilton',       opts: ['LEC', 'HAM'] },
  { label: 'Mercedes: Russell vs Antonelli',     opts: ['RUS', 'ANT'] },
  { label: 'Aston Martin: Alonso vs Stroll',     opts: ['ALO', 'STR'] },
  { label: 'Alpine: Gasly vs Doohan/Colapinto',  opts: ['GAS', 'DOO'] },
  { label: 'Williams: Sainz vs Albon',           opts: ['SAI', 'ALB'] },
  { label: 'RB: Lawson vs ...',                  opts: ['LAW', 'TSU'] },
  { label: 'Haas: Ocon vs Bearman',              opts: ['OCO', 'BEA'] },
  { label: 'Sauber: Hülkenberg vs Bortoleto',    opts: ['HUL', 'BOR'] },
]

type FormData = Omit<Prediction, 'id' | 'member_email' | 'gp_id' | 'submetido_em' | 'editado_em' | 'versao'>

function PilotoSelect({ label, value, onChange, required, excludes }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; excludes?: string[]
}) {
  return (
    <div>
      <label className="label">{label}{required && ' *'}</label>
      <select className="select" value={value} onChange={e => onChange(e.target.value)} required={required}>
        <option value="">Selecciona piloto...</option>
        {PILOTOS_2026.filter(p => !excludes?.includes(p.codigo)).map(p => (
          <option key={p.codigo} value={p.codigo}>{p.nome}</option>
        ))}
      </select>
    </div>
  )
}

function DueloSelect({ label, opts, value, onChange }: {
  label: string; opts: string[]; value: string; onChange: (v: string) => void
}) {
  const pilotos = PILOTOS_2026.filter(p => opts.includes(p.codigo))
  return (
    <div>
      <label className="label">{label} *</label>
      <div className="flex gap-2">
        {pilotos.map(p => (
          <button key={p.codigo} type="button"
            onClick={() => onChange(p.codigo)}
            className={`flex-1 py-3 px-2 rounded-lg font-bold text-sm transition-all border-2 ${
              value === p.codigo
                ? 'bg-f1red border-f1red text-white'
                : 'bg-f1dark border-gray-600 text-gray-300 hover:border-gray-400'
            }`}>
            {p.nome.split(' ').pop()}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function PredictForm({
  gp, userEmail, existing
}: {
  gp: GpCalendar; userEmail: string; existing: Prediction | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDeadline(gp.deadline_play))

  const blank: FormData = {
    p1_primeiro: null, p1_segundo: null, p1_terceiro: null,
    p2_equipa: null, p3_lap: null,
    p4_quarto: null, p4_quinto: null, p4_sexto: null,
    p5_duelo: null, p6_duelo: null, p7_duelo: null,
    p8_margem: null, p9_retire: null, p10_dotd: null,
    p11_fl: null, p12_classif: null,
    p13_especial: null, p14_sc: null, p15_outsider: null,
  }

  const [form, setForm] = useState<FormData>(existing ? {
    p1_primeiro: existing.p1_primeiro, p1_segundo: existing.p1_segundo, p1_terceiro: existing.p1_terceiro,
    p2_equipa: existing.p2_equipa, p3_lap: existing.p3_lap,
    p4_quarto: existing.p4_quarto, p4_quinto: existing.p4_quinto, p4_sexto: existing.p4_sexto,
    p5_duelo: existing.p5_duelo, p6_duelo: existing.p6_duelo, p7_duelo: existing.p7_duelo,
    p8_margem: existing.p8_margem, p9_retire: existing.p9_retire, p10_dotd: existing.p10_dotd,
    p11_fl: existing.p11_fl, p12_classif: existing.p12_classif,
    p13_especial: existing.p13_especial, p14_sc: existing.p14_sc, p15_outsider: existing.p15_outsider,
  } : blank)

  useEffect(() => {
    const t = setInterval(() => {
      if (isDeadlinePassed(gp.deadline_play)) {
        clearInterval(t)
        router.refresh()
      } else {
        setTimeLeft(getTimeUntilDeadline(gp.deadline_play))
      }
    }, 10000)
    return () => clearInterval(t)
  }, [])

  const set = (k: keyof FormData) => (v: string) =>
    setForm(f => ({ ...f, [k]: v || null }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDeadlinePassed(gp.deadline_play)) {
      setError('O prazo expirou.'); return
    }
    setLoading(true); setError('')

    const { error } = await supabase.from('predictions').upsert({
      member_email: userEmail,
      gp_id: gp.id,
      ...form,
      editado_em: new Date().toISOString(),
    })

    if (error) { setError(error.message) }
    else { setSuccess(true); setTimeout(() => router.push('/predict'), 2000) }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Previsão guardada!</h1>
        <p className="text-gray-400">Podes editar até ao início da corrida.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">{gp.emoji_bandeira}</span>
          <h1 className="text-2xl font-bold">GP {gp.nome} 2026</h1>
        </div>
        <p className="text-gray-400 text-sm">
          {new Date(gp.data_corrida).toLocaleDateString('pt-MZ', {
            weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
          })}
          {' · '}<span className="text-f1red font-medium">⏱ {timeLeft}</span>
        </p>
        {existing && (
          <p className="text-sm text-yellow-400 mt-1">
            ✏️ A editar previsão — a última submissão substitui a anterior.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* P1 — Pódio */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🏆 Pódio (P1 · 3 pts)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PilotoSelect label="1º lugar" value={form.p1_primeiro ?? ''} onChange={set('p1_primeiro')} required
              excludes={[form.p1_segundo, form.p1_terceiro].filter(Boolean) as string[]} />
            <PilotoSelect label="2º lugar" value={form.p1_segundo ?? ''} onChange={set('p1_segundo')} required
              excludes={[form.p1_primeiro, form.p1_terceiro].filter(Boolean) as string[]} />
            <PilotoSelect label="3º lugar" value={form.p1_terceiro ?? ''} onChange={set('p1_terceiro')} required
              excludes={[form.p1_primeiro, form.p1_segundo].filter(Boolean) as string[]} />
          </div>
        </div>

        {/* P2 — 2ª/3ª equipa */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🏎️ 2ª ou 3ª equipa classificada (P2 · 1 pt)</h3>
          <div>
            <label className="label">Equipa *</label>
            <select className="select" value={form.p2_equipa ?? ''} onChange={e => set('p2_equipa')(e.target.value)} required>
              <option value="">Selecciona equipa...</option>
              {EQUIPAS_2026.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* P3 — LAP */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">📍 Piloto com LAP (P3 · 1 pt)</h3>
          <PilotoSelect label="Piloto com LAP *" value={form.p3_lap ?? ''} onChange={set('p3_lap')} required />
        </div>

        {/* P4 — P4/P5/P6 */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🎯 Posições P4 / P5 / P6 (3 pts)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PilotoSelect label="4º lugar" value={form.p4_quarto ?? ''} onChange={set('p4_quarto')} required
              excludes={[form.p4_quinto, form.p4_sexto].filter(Boolean) as string[]} />
            <PilotoSelect label="5º lugar" value={form.p4_quinto ?? ''} onChange={set('p4_quinto')} required
              excludes={[form.p4_quarto, form.p4_sexto].filter(Boolean) as string[]} />
            <PilotoSelect label="6º lugar" value={form.p4_sexto ?? ''} onChange={set('p4_sexto')} required
              excludes={[form.p4_quarto, form.p4_quinto].filter(Boolean) as string[]} />
          </div>
        </div>

        {/* P5/P6/P7 — Duelos */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">⚔️ Duelos de equipa (P5/P6/P7 · 3 pts)</h3>
          <p className="text-xs text-gray-500 mb-4">
            Qual piloto classifica melhor em cada equipa?
          </p>
          <div className="space-y-4">
            <DueloSelect label="Duelo 1" opts={DUELOS[0].opts}
              value={form.p5_duelo ?? ''} onChange={set('p5_duelo')} />
            <DueloSelect label="Duelo 2" opts={DUELOS[1].opts}
              value={form.p6_duelo ?? ''} onChange={set('p6_duelo')} />
            <DueloSelect label="Duelo 3" opts={DUELOS[2].opts}
              value={form.p7_duelo ?? ''} onChange={set('p7_duelo')} />
          </div>
        </div>

        {/* P8 — Margem */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">⏱️ Margem de vitória (P8 · 1 pt)</h3>
          <div>
            <label className="label">Margem *</label>
            <select className="select" value={form.p8_margem ?? ''} onChange={e => set('p8_margem')(e.target.value)} required>
              <option value="">Selecciona...</option>
              {MARGENS_VITORIA.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* P9 — First to Retire (3 pts) */}
        <div className="card border-yellow-600/30">
          <h3 className="font-bold text-yellow-400 mb-4">💥 First to Retire (P9 · 3 pts)</h3>
          <PilotoSelect label="Primeiro a abandonar *" value={form.p9_retire ?? ''} onChange={set('p9_retire')} required />
        </div>

        {/* P10 — DOTD (2 pts) */}
        <div className="card border-yellow-600/30">
          <h3 className="font-bold text-yellow-400 mb-4">⭐ Driver of the Day (P10 · 2 pts)</h3>
          <PilotoSelect label="Piloto do dia *" value={form.p10_dotd ?? ''} onChange={set('p10_dotd')} required />
        </div>

        {/* P11 — Fastest Lap */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">⚡ Fastest Lap (P11 · 1 pt)</h3>
          <PilotoSelect label="Volta mais rápida *" value={form.p11_fl ?? ''} onChange={set('p11_fl')} required />
        </div>

        {/* P12 — Classificados */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🏁 Nº de classificados (P12 · 1 pt)</h3>
          <div>
            <label className="label">Quantos pilotos terminam a corrida? *</label>
            <select className="select" value={form.p12_classif ?? ''} onChange={e => set('p12_classif')(e.target.value)} required>
              <option value="">Selecciona...</option>
              {OPCOES_CLASSIF.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* P13/P14/P15 — Especiais */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🎲 Perguntas especiais (P13/P14/P15 · 3 pts)</h3>
          <div className="space-y-4">
            <div>
              <label className="label">P13 · Pergunta especial *</label>
              <input className="input" placeholder="Resposta à pergunta especial"
                value={form.p13_especial ?? ''} onChange={e => set('p13_especial')(e.target.value)} required />
            </div>
            <div>
              <label className="label">P14 · Safety Car? *</label>
              <div className="flex gap-3">
                {['Sim', 'Não', 'Virtual SC'].map(v => (
                  <button key={v} type="button" onClick={() => set('p14_sc')(v)}
                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all border-2 ${
                      form.p14_sc === v
                        ? 'bg-f1red border-f1red text-white'
                        : 'bg-f1dark border-gray-600 text-gray-300 hover:border-gray-400'
                    }`}>{v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">P15 · Outsider (piloto fora do top 6) *</label>
              <PilotoSelect label="" value={form.p15_outsider ?? ''} onChange={set('p15_outsider')} required />
            </div>
          </div>
        </div>

        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
          {loading ? 'A guardar...' : existing ? '✏️ Actualizar previsão' : '🏎️ Submeter previsão'}
        </button>
      </form>
    </div>
  )
}
