'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026 } from '@/lib/supabase/types'
import { P8_MARGENS, P3_OPTIONS, P12_OPTIONS, getGpQuestions } from '@/lib/gp-questions'
import type { GpCalendar, Prediction } from '@/lib/supabase/types'
import { getTimeUntilDeadline, isDeadlinePassed } from '@/lib/scoring'

type FormData = Omit<
  Prediction,
  'id' | 'member_email' | 'gp_id' | 'submetido_em' | 'editado_em' | 'versao'
>

export default function PredictForm({
  gp,
  userEmail,
  existing,
}: {
  gp: GpCalendar
  userEmail: string
  existing: Prediction | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDeadline(gp.deadline_play))

  const config = getGpQuestions(gp.round)

  const blank: FormData = {
    p1_primeiro: null,
    p1_segundo: null,
    p1_terceiro: null,
    p2_equipa: null,
    p3_lap: null,
    p4_quarto: null,
    p4_quinto: null,
    p4_sexto: null,
    p5_duelo: null,
    p6_duelo: null,
    p7_duelo: null,
    p8_margem: null,
    p9_retire: null,
    p10_dotd: null,
    p11_fl: null,
    p12_classif: null,
    p13_especial: null,
    p14_sc: null,
    p15_outsider: null,
  }

  const [form, setForm] = useState<FormData>(existing ? {
    p1_primeiro: existing.p1_primeiro,
    p1_segundo: existing.p1_segundo,
    p1_terceiro: existing.p1_terceiro,
    p2_equipa: existing.p2_equipa,
    p3_lap: existing.p3_lap,
    p4_quarto: existing.p4_quarto,
    p4_quinto: existing.p4_quinto,
    p4_sexto: existing.p4_sexto,
    p5_duelo: existing.p5_duelo,
    p6_duelo: existing.p6_duelo,
    p7_duelo: existing.p7_duelo,
    p8_margem: existing.p8_margem,
    p9_retire: existing.p9_retire,
    p10_dotd: existing.p10_dotd,
    p11_fl: existing.p11_fl,
    p12_classif: existing.p12_classif,
    p13_especial: existing.p13_especial,
    p14_sc: existing.p14_sc,
    p15_outsider: existing.p15_outsider,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setField(k: keyof FormData, v: string) {
    setForm(f => ({ ...f, [k]: v || null }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isDeadlinePassed(gp.deadline_play)) {
      setError('O prazo expirou.')
      return
    }

    setLoading(true)
    setError('')

    const { error: upsertErr } = await (supabase as any)
      .from('predictions')
      .upsert({
        member_email: userEmail,
        gp_id: gp.id,
        ...form,
        editado_em: new Date().toISOString(),
      })

    if (upsertErr) {
      setError(upsertErr.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/predict'), 2000)
    }

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

  // Helper: pilot select (full grid)
  function PilotoSelect({
    label, value, onChange, includeNone = false
  }: {
    label: string
    value: string
    onChange: (v: string) => void
    includeNone?: boolean
  }) {
    return (
      <div>
        <label className="label">{label}</label>
        <select
          className="select"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Selecciona...</option>
          {includeNone && <option value="NONE">Nenhum Piloto</option>}
          {PILOTOS_2026.map(p => (
            <option key={p.codigo} value={p.codigo}>
              {p.nome} ({p.equipa})
            </option>
          ))}
        </select>
      </div>
    )
  }

  // Helper: radio group
  function RadioGroup({
    name, value, options, onChange
  }: {
    name: string
    value: string
    options: { value: string; label: string; sub?: string }[]
    onChange: (v: string) => void
  }) {
    return (
      <div className="space-y-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              value === opt.value
                ? 'border-f1red bg-f1red/10'
                : 'border-white/10 hover:border-white/30'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 accent-red-500"
            />
            <div>
              <span className="font-medium">{opt.label}</span>
              {opt.sub && <span className="text-xs text-gray-400 ml-2">{opt.sub}</span>}
            </div>
          </label>
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Deadline banner */}
      <div className="mb-5 bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-400">Prazo para submissão</span>
        <span className="font-mono font-bold text-yellow-400">{timeLeft}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>
        )}

        {/* P1 — Pódio */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P1 · Pódio</h3>
            <span className="text-xs text-gray-400">3 pts</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Quem vai fazer o pódio?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PilotoSelect
              label="1º lugar"
              value={form.p1_primeiro ?? ''}
              onChange={v => setField('p1_primeiro', v)}
            />
            <PilotoSelect
              label="2º lugar"
              value={form.p1_segundo ?? ''}
              onChange={v => setField('p1_segundo', v)}
            />
            <PilotoSelect
              label="3º lugar"
              value={form.p1_terceiro ?? ''}
              onChange={v => setField('p1_terceiro', v)}
            />
          </div>
        </div>

        {/* P2 — 2ª Equipa */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P2 · 2ª Equipa</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {config?.p2Label ?? "Qual será a 2ª equipa que mais vai pontuar?"}
          </p>
          <div>
            <label className="label">Equipa</label>
            <select
              className="select"
              value={form.p2_equipa ?? ''}
              onChange={e => setField('p2_equipa', e.target.value)}
            >
              <option value="">Selecciona...</option>
              {EQUIPAS_2026.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>
        </div>

        {/* P3 — Carros dobrados */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P3 · Carros dobrados</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Quantos carros serão dobrados durante a corrida?</p>
          <div>
            <label className="label">Número de carros dobrados</label>
            <select
              className="select"
              value={form.p3_lap ?? ''}
              onChange={e => setField('p3_lap', e.target.value)}
            >
              <option value="">Selecciona...</option>
              {(config?.p3Options ?? P3_OPTIONS).map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* P4 — Posições 4-6 */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P4 · Posições 4-6</h3>
            <span className="text-xs text-gray-400">3 pts</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Quem vai terminar em 4º, 5º e 6º?</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PilotoSelect
              label="4º lugar"
              value={form.p4_quarto ?? ''}
              onChange={v => setField('p4_quarto', v)}
            />
            <PilotoSelect
              label="5º lugar"
              value={form.p4_quinto ?? ''}
              onChange={v => setField('p4_quinto', v)}
            />
            <PilotoSelect
              label="6º lugar"
              value={form.p4_sexto ?? ''}
              onChange={v => setField('p4_sexto', v)}
            />
          </div>
        </div>

        {/* P5 — Duelo 1 */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P5 · Duelo 1</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {config
              ? `${config.p5.nameA} vs ${config.p5.nameB} — quem vai terminar à frente?`
              : 'Quem vai terminar à frente no duelo 1?'}
          </p>
          {config ? (
            <RadioGroup
              name="p5_duelo"
              value={form.p5_duelo ?? ''}
              onChange={v => setField('p5_duelo', v)}
              options={[
                { value: config.p5.driverA, label: config.p5.nameA, sub: config.p5.teamA },
                { value: config.p5.driverB, label: config.p5.nameB, sub: config.p5.teamB },
              ]}
            />
          ) : (
            <PilotoSelect
              label="Piloto vencedor"
              value={form.p5_duelo ?? ''}
              onChange={v => setField('p5_duelo', v)}
            />
          )}
        </div>

        {/* P6 — Duelo 2 */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P6 · Duelo 2</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {config
              ? `${config.p6.nameA} vs ${config.p6.nameB} — quem vai terminar à frente?`
              : 'Quem vai terminar à frente no duelo 2?'}
          </p>
          {config ? (
            <RadioGroup
              name="p6_duelo"
              value={form.p6_duelo ?? ''}
              onChange={v => setField('p6_duelo', v)}
              options={[
                { value: config.p6.driverA, label: config.p6.nameA, sub: config.p6.teamA },
                { value: config.p6.driverB, label: config.p6.nameB, sub: config.p6.teamB },
              ]}
            />
          ) : (
            <PilotoSelect
              label="Piloto vencedor"
              value={form.p6_duelo ?? ''}
              onChange={v => setField('p6_duelo', v)}
            />
          )}
        </div>

        {/* P7 — Duelo 3 */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P7 · Duelo 3</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {config
              ? `${config.p7.nameA} vs ${config.p7.nameB} — quem vai terminar à frente?`
              : 'Quem vai terminar à frente no duelo 3?'}
          </p>
          {config ? (
            <RadioGroup
              name="p7_duelo"
              value={form.p7_duelo ?? ''}
              onChange={v => setField('p7_duelo', v)}
              options={[
                { value: config.p7.driverA, label: config.p7.nameA, sub: config.p7.teamA },
                { value: config.p7.driverB, label: config.p7.nameB, sub: config.p7.teamB },
              ]}
            />
          ) : (
            <PilotoSelect
              label="Piloto vencedor"
              value={form.p7_duelo ?? ''}
              onChange={v => setField('p7_duelo', v)}
            />
          )}
        </div>

        {/* P8 — Margem vitória */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P8 · Margem de vitória</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Qual vai ser a margem entre 1º e 2º?</p>
          <div>
            <label className="label">Margem</label>
            <select
              className="select"
              value={form.p8_margem ?? ''}
              onChange={e => setField('p8_margem', e.target.value)}
            >
              <option value="">Selecciona...</option>
              {P8_MARGENS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* P9 — First to Retire */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P9 · Primeiro a abandonar</h3>
            <span className="text-xs text-gray-400">3 pts</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Qual piloto vai abandonar primeiro? Se achas que nenhum abandona, escolhe "Nenhum Piloto".</p>
          <PilotoSelect
            label="Piloto"
            value={form.p9_retire ?? ''}
            onChange={v => setField('p9_retire', v)}
            includeNone
          />
        </div>

        {/* P10 — DOTD */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P10 · Driver of the Day</h3>
            <span className="text-xs text-gray-400">2 pts</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Quem vai ganhar o DOTD (votação dos fãs)?</p>
          <PilotoSelect
            label="Piloto"
            value={form.p10_dotd ?? ''}
            onChange={v => setField('p10_dotd', v)}
          />
        </div>

        {/* P11 — Fastest Lap */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P11 · Volta mais rápida</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Quem vai fazer a volta mais rápida?</p>
          <PilotoSelect
            label="Piloto"
            value={form.p11_fl ?? ''}
            onChange={v => setField('p11_fl', v)}
          />
        </div>

        {/* P12 — Nº classificados */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P12 · Nº de classificados</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Quantos pilotos vão ser classificados?</p>
          <div>
            <label className="label">Número de classificados</label>
            <select
              className="select"
              value={form.p12_classif ?? ''}
              onChange={e => setField('p12_classif', e.target.value)}
            >
              <option value="">Selecciona...</option>
              {P12_OPTIONS.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* P13 — Especial */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P13 · Pergunta especial</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {config?.p13Label ?? "Pergunta especial da corrida"}
          </p>
          {config ? (
            <RadioGroup
              name="p13_especial"
              value={form.p13_especial ?? ''}
              onChange={v => setField('p13_especial', v)}
              options={config.p13Options.map(d => ({
                value: d.codigo,
                label: d.nome,
                sub: d.equipa,
              }))}
            />
          ) : (
            <PilotoSelect
              label="Piloto"
              value={form.p13_especial ?? ''}
              onChange={v => setField('p13_especial', v)}
            />
          )}
        </div>

        {/* P14 — Safety Car */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P14 · Safety Car</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">Vai haver Safety Car na corrida?</p>
          <RadioGroup
            name="p14_sc"
            value={form.p14_sc ?? ''}
            onChange={v => setField('p14_sc', v)}
            options={[
              { value: 'Sim', label: 'Sim' },
              { value: 'Não', label: 'Não' },
            ]}
          />
        </div>

        {/* P15 — Outsider */}
        <div className="card">
          <div className="flex items-baseline justify-between mb-1">
            <h3 className="font-bold text-white">P15 · Outsider</h3>
            <span className="text-xs text-gray-400">1 pt</span>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {config?.p15Label ?? "Qual piloto outsider vai terminar na posição mais alta?"}
          </p>
          {config ? (
            <RadioGroup
              name="p15_outsider"
              value={form.p15_outsider ?? ''}
              onChange={v => setField('p15_outsider', v)}
              options={config.p15Options.map(d => ({
                value: d.codigo,
                label: d.nome,
                sub: d.equipa,
              }))}
            />
          ) : (
            <PilotoSelect
              label="Piloto"
              value={form.p15_outsider ?? ''}
              onChange={v => setField('p15_outsider', v)}
            />
          )}
        </div>

        {error && (
          <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg py-4"
        >
          {loading ? 'A guardar...' : '🏎️ Submeter previsão'}
        </button>
      </form>
    </div>
  )
}
