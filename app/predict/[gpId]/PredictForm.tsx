'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026 } from '@/lib/supabase/types'
import {
  P8_MARGENS, P3_OPTIONS, P12_OPTIONS,
  getGpQuestions, getDriverPhoto,
  type DuelConfig, type DriverOption,
} from '@/lib/gp-questions'
import type { GpCalendar, Prediction } from '@/lib/supabase/types'
import { getDeadlineCountdown, isDeadlinePassed } from '@/lib/scoring'

type FormData = Omit<
  Prediction,
  'id' | 'member_email' | 'gp_id' | 'submetido_em' | 'editado_em' | 'versao'
>

// ─── Driver Photo Card ─────────────────────────────────────────────────────────
function DriverCard({
  codigo, name, team, color, selected, onClick,
}: {
  codigo: string; name: string; team: string; color: string
  selected: boolean; onClick: () => void
}) {
  const [imgErr, setImgErr] = useState(false)
  const photoUrl = getDriverPhoto(codigo)
  const lastName = name.split(' ').slice(-1)[0]

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all duration-200 w-full"
      style={{
        borderColor: selected ? color : 'rgba(255,255,255,0.1)',
        backgroundColor: selected ? color + '22' : 'rgba(255,255,255,0.03)',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
        boxShadow: selected ? `0 0 16px ${color}55` : 'none',
      }}
    >
      {/* Team colour stripe */}
      <div className="w-full h-1.5" style={{ backgroundColor: color }} />

      {/* Checkmark */}
      {selected && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10 text-white text-[10px] font-black"
          style={{ backgroundColor: color }}
        >✓</div>
      )}

      {/* Photo or code fallback */}
      <div className="w-full aspect-[4/5] overflow-hidden" style={{ backgroundColor: color + '18' }}>
        {photoUrl && !imgErr ? (
          <img
            src={photoUrl}
            alt={name}
            className="w-full h-full object-cover object-top"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color }}>
            <span className="text-2xl font-black">{codigo}</span>
          </div>
        )}
      </div>

      {/* Name + team */}
      <div className="px-1.5 py-2 text-center w-full">
        <div className="font-black text-xs text-white leading-tight truncate">{lastName}</div>
        <div className="text-[9px] font-medium mt-0.5 truncate" style={{ color }}>{team}</div>
      </div>
    </button>
  )
}

// ─── Duel Selector (2 cards + VS) ─────────────────────────────────────────────
function DuelSelector({
  cfg, value, onChange,
}: {
  cfg: DuelConfig; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
      <DriverCard
        codigo={cfg.driverA} name={cfg.nameA} team={cfg.teamA} color={cfg.colorA}
        selected={value === cfg.driverA} onClick={() => onChange(cfg.driverA)}
      />
      <div className="text-gray-500 font-black text-sm text-center">VS</div>
      <DriverCard
        codigo={cfg.driverB} name={cfg.nameB} team={cfg.teamB} color={cfg.colorB}
        selected={value === cfg.driverB} onClick={() => onChange(cfg.driverB)}
      />
    </div>
  )
}

// ─── 5-Driver Grid Selector ────────────────────────────────────────────────────
function DriverGrid({
  options, value, onChange,
}: {
  options: DriverOption[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map(d => (
        <DriverCard
          key={d.codigo}
          codigo={d.codigo} name={d.nome} team={d.equipa} color={d.color}
          selected={value === d.codigo} onClick={() => onChange(d.codigo)}
        />
      ))}
    </div>
  )
}

// ─── Helper components OUTSIDE main component (prevents remount on re-render) ──

function PilotoSelect({ label, value, onChange, includeNone = false, excludeCodes = [] }: {
  label: string; value: string; onChange: (v: string) => void
  includeNone?: boolean; excludeCodes?: string[]
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <select className="select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Selecciona...</option>
        {includeNone && <option value="NONE">Nenhum Piloto</option>}
        {PILOTOS_2026.map(p => {
          const blocked = excludeCodes.includes(p.codigo)
          return (
            <option key={p.codigo} value={p.codigo} disabled={blocked}>
              {blocked ? `— ${p.nome}` : `${p.nome} (${p.equipa})`}
            </option>
          )
        })}
      </select>
    </div>
  )
}

function QHeader({ code, title, pts }: { code: string; title: string; pts: string }) {
  return (
    <div className="flex items-baseline justify-between mb-1">
      <h3 className="font-bold text-f1red">{code} · {title}</h3>
      <span className="text-xs font-bold text-yellow-400">{pts}</span>
    </div>
  )
}

// ─── Main Form ─────────────────────────────────────────────────────────────────
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
  const [countdown, setCountdown] = useState(getDeadlineCountdown(gp.deadline_play))

  const config = getGpQuestions(gp.round)
  const gpNameFull = config ? `Grande Prémio ${config.gpPrep} ${config.gpName}` : gp.nome

  const blank: FormData = {
    p1_primeiro: null, p1_segundo: null, p1_terceiro: null,
    p2_equipa: null, p3_lap: null,
    p4_quarto: null, p4_quinto: null, p4_sexto: null,
    p5_duelo: null, p6_duelo: null, p7_duelo: null,
    p8_margem: null, p9_retire: null, p10_dotd: null,
    p11_fl: null, p12_classif: null, p13_especial: null,
    p14_sc: null, p15_outsider: null,
  }

  const [form, setForm] = useState<FormData>(existing ? {
    p1_primeiro: existing.p1_primeiro,
    p1_segundo:  existing.p1_segundo,
    p1_terceiro: existing.p1_terceiro,
    p2_equipa:   existing.p2_equipa,
    p3_lap:      existing.p3_lap,
    p4_quarto:   existing.p4_quarto,
    p4_quinto:   existing.p4_quinto,
    p4_sexto:    existing.p4_sexto,
    p5_duelo:    existing.p5_duelo,
    p6_duelo:    existing.p6_duelo,
    p7_duelo:    existing.p7_duelo,
    p8_margem:   existing.p8_margem,
    p9_retire:   existing.p9_retire,
    p10_dotd:    existing.p10_dotd,
    p11_fl:      existing.p11_fl,
    p12_classif: existing.p12_classif,
    p13_especial:existing.p13_especial,
    p14_sc:      existing.p14_sc,
    p15_outsider:existing.p15_outsider,
  } : blank)

  useEffect(() => {
    const t = setInterval(() => {
      if (isDeadlinePassed(gp.deadline_play)) {
        clearInterval(t)
        router.refresh()
      } else {
        setCountdown(getDeadlineCountdown(gp.deadline_play))
      }
    }, 1000)
    return () => clearInterval(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setField(k: keyof FormData, v: string) {
    setForm(f => ({ ...f, [k]: v || null }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isDeadlinePassed(gp.deadline_play)) { setError('O prazo expirou.'); return }
    setLoading(true); setError('')

    const { error: upsertErr } = await (supabase as any)
      .from('predictions')
      .upsert(
        { member_email: userEmail, gp_id: gp.id, ...form, editado_em: new Date().toISOString() },
        { onConflict: 'member_email,gp_id' }
      )

    if (upsertErr) { setError(upsertErr.message) }
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Countdown timer */}
      <div className="mb-6 bg-black/40 border border-white/10 rounded-2xl px-4 py-5 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">
          ⏱ Prazo para submissão
        </p>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          {[
            { value: countdown.days,    label: 'DIAS' },
            { value: countdown.hours,   label: 'HRS'  },
            { value: countdown.minutes, label: 'MIN'  },
            { value: countdown.seconds, label: 'SEG'  },
          ].map((unit, idx) => (
            <div key={unit.label} className="flex items-center gap-2 sm:gap-3">
              {idx > 0 && (
                <span className="text-2xl sm:text-3xl font-black text-gray-600 leading-none mb-4">:</span>
              )}
              <div className="flex flex-col items-center">
                <div className="bg-f1gray border border-white/10 rounded-xl px-3 sm:px-5 py-2 sm:py-3 min-w-[56px] sm:min-w-[72px]">
                  <span className="text-3xl sm:text-5xl font-black tabular-nums text-white leading-none">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500 font-bold tracking-widest mt-2">
                  {unit.label}
                </span>
              </div>
            </div>
          ))}
        </div>
        {existing && (
          <p className="text-xs text-green-400/80 mt-4">
            ✏️ Já submeteste — podes alterar quantas vezes quiseres até ao prazo
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        {/* P1 — Top 6 Classificados (formerly P1 + P4) */}
        <div className="card">
          <QHeader code="P1" title="Top 6 Classificados" pts="6 pts" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual é a sua previsão para os 6 primeiros classificados do {gpNameFull}?
          </p>
          {(() => {
            const all6 = [
              form.p1_primeiro, form.p1_segundo, form.p1_terceiro,
              form.p4_quarto,   form.p4_quinto,  form.p4_sexto,
            ]
            const exclude = (own: string | null) =>
              all6.filter(v => v && v !== own) as string[]
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <PilotoSelect label="1º lugar" value={form.p1_primeiro ?? ''} onChange={v => setField('p1_primeiro', v)} excludeCodes={exclude(form.p1_primeiro)} />
                <PilotoSelect label="2º lugar" value={form.p1_segundo  ?? ''} onChange={v => setField('p1_segundo',  v)} excludeCodes={exclude(form.p1_segundo)} />
                <PilotoSelect label="3º lugar" value={form.p1_terceiro ?? ''} onChange={v => setField('p1_terceiro', v)} excludeCodes={exclude(form.p1_terceiro)} />
                <PilotoSelect label="4º lugar" value={form.p4_quarto   ?? ''} onChange={v => setField('p4_quarto',   v)} excludeCodes={exclude(form.p4_quarto)} />
                <PilotoSelect label="5º lugar" value={form.p4_quinto   ?? ''} onChange={v => setField('p4_quinto',   v)} excludeCodes={exclude(form.p4_quinto)} />
                <PilotoSelect label="6º lugar" value={form.p4_sexto    ?? ''} onChange={v => setField('p4_sexto',    v)} excludeCodes={exclude(form.p4_sexto)} />
              </div>
            )
          })()}
        </div>

        {/* P2 — 2ª / 3ª Equipa */}
        <div className="card">
          <QHeader code="P2" title="Equipa" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            {config?.p2Label ?? `Qual será a segunda equipa, que vai pontuar mais no ${gpNameFull}?`}
          </p>
          <div>
            <label className="label">Equipa</label>
            <select className="select" value={form.p2_equipa ?? ''} onChange={e => setField('p2_equipa', e.target.value)}>
              <option value="">Selecciona...</option>
              {EQUIPAS_2026.map(eq => <option key={eq} value={eq}>{eq}</option>)}
            </select>
          </div>
        </div>

        {/* P3 — Volta de Avanço */}
        <div className="card">
          <QHeader code="P3" title="Volta de Avanço" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Quantos pilotos levarão a volta de avanço (LAP) no {gpNameFull}?
          </p>
          <div>
            <label className="label">Número de pilotos</label>
            <select className="select" value={form.p3_lap ?? ''} onChange={e => setField('p3_lap', e.target.value)}>
              <option value="">Selecciona...</option>
              {(config?.p3Options ?? P3_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* P5 — Duelo 1 */}
        <div className="card">
          <QHeader code="P5" title="Duelo 1" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual piloto vai terminar na frente do outro no {gpNameFull}?
          </p>
          {config
            ? <DuelSelector cfg={config.p5} value={form.p5_duelo ?? ''} onChange={v => setField('p5_duelo', v)} />
            : <PilotoSelect label="Piloto" value={form.p5_duelo ?? ''} onChange={v => setField('p5_duelo', v)} />
          }
        </div>

        {/* P6 — Duelo 2 */}
        <div className="card">
          <QHeader code="P6" title="Duelo 2" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual piloto vai terminar na frente do outro no {gpNameFull}?
          </p>
          {config
            ? <DuelSelector cfg={config.p6} value={form.p6_duelo ?? ''} onChange={v => setField('p6_duelo', v)} />
            : <PilotoSelect label="Piloto" value={form.p6_duelo ?? ''} onChange={v => setField('p6_duelo', v)} />
          }
        </div>

        {/* P7 — Duelo 3 */}
        <div className="card">
          <QHeader code="P7" title="Duelo 3" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual piloto vai terminar na frente do outro no {gpNameFull}?
          </p>
          {config
            ? <DuelSelector cfg={config.p7} value={form.p7_duelo ?? ''} onChange={v => setField('p7_duelo', v)} />
            : <PilotoSelect label="Piloto" value={form.p7_duelo ?? ''} onChange={v => setField('p7_duelo', v)} />
          }
        </div>

        {/* P8 — Margem de vitória */}
        <div className="card">
          <QHeader code="P8" title="Margem de Vitória" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual será a margem de victória, do prímeiro a cruzar a linha de chegada?
          </p>
          <div>
            <label className="label">Margem</label>
            <select className="select" value={form.p8_margem ?? ''} onChange={e => setField('p8_margem', e.target.value)}>
              <option value="">Selecciona...</option>
              {P8_MARGENS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {/* P9 — First to Retire */}
        <div className="card">
          <QHeader code="P9" title="First to Retire" pts="3 pts" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Quem será o primeiro piloto, First to Retire no {gpNameFull}?
          </p>
          <PilotoSelect label="Piloto" value={form.p9_retire ?? ''} onChange={v => setField('p9_retire', v)} includeNone />
        </div>

        {/* P10 — Driver of the Day */}
        <div className="card">
          <QHeader code="P10" title="Driver of the Day" pts="2 pts" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Quem será o piloto eleito 'Driver of the Day' no {gpNameFull}?
          </p>
          <PilotoSelect label="Piloto" value={form.p10_dotd ?? ''} onChange={v => setField('p10_dotd', v)} />
        </div>

        {/* P11 — Volta mais rápida */}
        <div className="card">
          <QHeader code="P11" title="Volta Mais Rápida" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual piloto fará a volta mais rápida no {gpNameFull}?
          </p>
          <PilotoSelect label="Piloto" value={form.p11_fl ?? ''} onChange={v => setField('p11_fl', v)} />
        </div>

        {/* P12 — Nº classificados */}
        <div className="card">
          <QHeader code="P12" title="Nº de Classificados" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Quantos pilotos classificados, terminaram a corrida no {gpNameFull}?
          </p>
          <div>
            <label className="label">Número de classificados</label>
            <select className="select" value={form.p12_classif ?? ''} onChange={e => setField('p12_classif', e.target.value)}>
              <option value="">Selecciona...</option>
              {P12_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* P13 — Pergunta Especial */}
        <div className="card">
          <QHeader code="P13" title="Pergunta Especial" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            {config?.p13Label ?? "Qual piloto terminará a corrida na posição mais alta?"}
          </p>
          {config
            ? <DriverGrid options={config.p13Options} value={form.p13_especial ?? ''} onChange={v => setField('p13_especial', v)} />
            : <PilotoSelect label="Piloto" value={form.p13_especial ?? ''} onChange={v => setField('p13_especial', v)} />
          }
        </div>

        {/* P14 — Safety Car */}
        <div className="card">
          <QHeader code="P14" title="Safety Car" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Haverá um Safety Car na pista durante o {gpNameFull}?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['Sim','Não'].map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setField('p14_sc', opt)}
                className="py-4 rounded-xl border-2 font-bold text-lg transition-all duration-200"
                style={{
                  borderColor: form.p14_sc === opt ? '#e10600' : 'rgba(255,255,255,0.1)',
                  backgroundColor: form.p14_sc === opt ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.03)',
                  color: form.p14_sc === opt ? '#fff' : '#9ca3af',
                }}
              >
                {opt === 'Sim' ? '🟢 Sim' : '🔴 Não'}
              </button>
            ))}
          </div>
        </div>

        {/* P15 — Outsider */}
        <div className="card">
          <QHeader code="P15" title="Outsider" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            {config?.p15Label ?? "Qual piloto terminará a corrida na posição mais alta?"}
          </p>
          {config
            ? <DriverGrid options={config.p15Options} value={form.p15_outsider ?? ''} onChange={v => setField('p15_outsider', v)} />
            : <PilotoSelect label="Piloto" value={form.p15_outsider ?? ''} onChange={v => setField('p15_outsider', v)} />
          }
        </div>

        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
          {loading ? 'A guardar...' : '🏎️ Submeter previsão'}
        </button>
      </form>
    </div>
  )
}
