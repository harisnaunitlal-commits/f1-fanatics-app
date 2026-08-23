'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026 } from '@/lib/supabase/types'
import {
  P8_MARGENS, P3_OPTIONS, P12_OPTIONS, P14_BINARY, P14_MULTI,
  getGpQuestions, getDriverPhoto, TEAM_COLORS,
  type DuelConfig, type DriverOption, type GpQuestions, type P14Option,
} from '@/lib/gp-questions'
import type { GpCalendar, Prediction } from '@/lib/supabase/types'
import { getDeadlineCountdown, isDeadlinePassed } from '@/lib/scoring'
import P14Badge from '@/components/P14Badge'

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

function PilotoSelect({ label, value, onChange, includeNone = false, excludeCodes = [], disabledCodes = [], pilotos }: {
  label: string; value: string; onChange: (v: string) => void
  includeNone?: boolean; excludeCodes?: string[]; disabledCodes?: string[]
  pilotos?: { codigo: string; nome: string; equipa: string }[]
}) {
  const list = pilotos ?? PILOTOS_2026
  return (
    <div>
      <label className="label">{label}</label>
      <select className="select" value={value} onChange={e => onChange(e.target.value)}>
        <option value="">Selecciona...</option>
        {includeNone && <option value="NONE">Nenhum Piloto</option>}
        {list.map(p => {
          const blocked = excludeCodes.includes(p.codigo)
          const inactive = disabledCodes.includes(p.codigo)
          return (
            <option key={p.codigo} value={p.codigo} disabled={blocked || inactive}>
              {blocked ? `— ${p.nome}` : inactive ? `✕ ${p.nome} (não participa)` : `${p.nome} (${p.equipa})`}
            </option>
          )
        })}
      </select>
    </div>
  )
}

function P1GridSlot({
  label, pos, value, onChange, pilotos, disabledCodes, excludeCodes,
}: {
  label: string; pos: number; value: string | null
  onChange: (v: string) => void
  pilotos: { codigo: string; nome: string; equipa: string }[]
  disabledCodes: string[]; excludeCodes: string[]
}) {
  const [imgErr, setImgErr] = useState(false)
  const isPole = pos === 1
  const drv = value ? pilotos.find(p => p.codigo === value) ?? null : null
  const color = drv ? (TEAM_COLORS[drv.equipa] ?? '#888') : '#888'
  const photoUrl = drv ? getDriverPhoto(drv.codigo) : null
  const lastName = drv ? drv.nome.split(' ').slice(-1)[0] : null
  return (
    <div
      className="rounded-lg p-2 border relative"
      style={{
        borderColor: isPole ? 'rgba(250,204,21,0.5)' : drv ? color + '55' : 'rgba(255,255,255,0.1)',
        background: isPole ? 'rgba(250,204,21,0.05)' : drv ? color + '11' : 'rgba(0,0,0,0.5)',
        minHeight: 72,
      }}
    >
      {/* Invisible select overlay — clicking anywhere on the box opens the picker */}
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
      >
        <option value="">Selecionar piloto...</option>
        {pilotos.map(p => {
          const blocked = excludeCodes.includes(p.codigo)
          const inactive = disabledCodes.includes(p.codigo)
          return (
            <option key={p.codigo} value={p.codigo} disabled={blocked || inactive} style={{ background: '#111', color: '#fff' }}>
              {blocked ? `— ${p.nome}` : inactive ? `✕ ${p.nome} (não participa)` : p.nome}
            </option>
          )
        })}
      </select>

      {/* Visual display (below the overlay) */}
      <div className="flex items-center gap-1 mb-1.5">
        <span className={`text-sm font-black tabular-nums leading-none ${isPole ? 'text-yellow-400' : pos <= 3 ? 'text-white' : 'text-gray-400'}`}>
          {label}
        </span>
        {isPole && <span className="text-[8px] font-black text-yellow-400/60 uppercase tracking-widest">Pole</span>}
      </div>
      {drv ? (
        <div className="flex items-center gap-1.5">
          <div
            className="w-9 h-9 rounded-md overflow-hidden flex-shrink-0 border"
            style={{ borderColor: color + '55', background: color + '18' }}
          >
            {photoUrl && !imgErr ? (
              <img src={photoUrl} alt={drv.nome} className="w-full h-full object-cover object-top" onError={() => setImgErr(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[10px] font-black" style={{ color }}>{drv.codigo}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-white truncate leading-tight">{lastName}</div>
            <div className="text-[9px] truncate" style={{ color: color + 'bb' }}>{drv.equipa}</div>
            <div className="text-[9px] text-gray-600 mt-0.5">toca para alterar ↓</div>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-gray-500 italic">Toca para selecionar...</div>
      )}
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
  config: configProp,
  readOnly = false,
}: {
  gp: GpCalendar
  userEmail: string
  existing: Prediction | null
  config?: GpQuestions
  readOnly?: boolean
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [countdown, setCountdown] = useState(getDeadlineCountdown(gp.deadline_play))

  const config = configProp ?? getGpQuestions(gp.round)
  const gpDisabled = gp.round === 12 ? ['HAD'] : []
  const gpPilotos = gp.round === 12
    ? [
        { codigo: 'LAW', nome: 'Liam Lawson', equipa: 'Red Bull Racing' as const },
        ...PILOTOS_2026.map(p =>
          p.codigo === 'LAW' ? { codigo: 'TSU', nome: 'Yuki Tsunoda', equipa: 'Racing Bulls' as const } :
          { ...p }
        ),
      ]
    : [...PILOTOS_2026]
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
    if (readOnly) return
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

    const res = await fetch('/api/predict/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gp_id: gp.id, ...form }),
    })
    const result = await res.json()

    if (!res.ok || result.error) { setError(result.error ?? 'Erro ao guardar.') }
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
      {/* Banner: countdown ou prazo encerrado */}
      {readOnly ? (
        <div className="mb-6 bg-black/40 border border-f1red/30 rounded-2xl px-4 py-5 text-center space-y-1">
          <p className="text-2xl">🏁</p>
          <p className="text-white font-bold">Prazo encerrado — as tuas escolhas</p>
          <p className="text-xs text-gray-400">Estas são as respostas que submeteste. Já não é possível editar.</p>
        </div>
      ) : (
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
      )}

      <form onSubmit={handleSubmit} className={`space-y-5 ${readOnly ? 'pointer-events-none opacity-80' : ''}`}>
        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        {/* Galeria de resultados das sessões */}
        {(() => {
          const imgs = gp.session_images ?? []
          if (imgs.length === 0) return null
          const sessionOrder = gp.is_sprint
            ? ['FP1', 'Sprint Qualifying', 'Sprint Race', 'Qualifying', 'Starting Grid']
            : ['FP1', 'FP2', 'FP3', 'Qualifying', 'Starting Grid']
          const sorted = [...imgs].sort((a, b) => {
            const ai = sessionOrder.indexOf(a.label)
            const bi = sessionOrder.indexOf(b.label)
            return (bi === -1 ? -1 : bi) - (ai === -1 ? -1 : ai)
          })
          return (
            <div className="card">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                📊 Resultados do fim de semana
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1">
                {sorted.map(img => (
                  <a
                    key={img.label}
                    href={img.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-none w-28 snap-start flex flex-col items-center gap-1"
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full rounded-lg border border-white/10 object-cover hover:border-white/30 transition-colors"
                      style={{ aspectRatio: '9/16' }}
                    />
                    <span className="text-[9px] font-black uppercase tracking-widest text-center px-1.5 py-0.5 rounded" style={{ color: '#dc2626', background: 'white' }}>
                      {img.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )
        })()}

        {/* P1 — Top 6 Classificados */}
        <div className="card">
          <QHeader code="P1" title="Top 6 Classificados" pts="6 pts" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual é a sua previsão para os 6 primeiros classificados do {gpNameFull}?
          </p>
          {(() => {
            const slots: { label: string; pos: number; value: string | null; field: keyof FormData }[] = [
              { label: '1º', pos: 1, value: form.p1_primeiro, field: 'p1_primeiro' },
              { label: '2º', pos: 2, value: form.p1_segundo,  field: 'p1_segundo'  },
              { label: '3º', pos: 3, value: form.p1_terceiro, field: 'p1_terceiro' },
              { label: '4º', pos: 4, value: form.p4_quarto,   field: 'p4_quarto'   },
              { label: '5º', pos: 5, value: form.p4_quinto,   field: 'p4_quinto'   },
              { label: '6º', pos: 6, value: form.p4_sexto,    field: 'p4_sexto'    },
            ]
            const all6 = slots.map(s => s.value)
            const usedExcept = (own: string | null) => all6.filter(v => v && v !== own) as string[]
            const pairs: [number, number][] = [[0, 1], [2, 3], [4, 5]]
            return (
              <div
                className="rounded-xl overflow-hidden border border-white/10"
                style={{
                  background: '#0a0a0a',
                  backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, transparent 0% 50%)',
                  backgroundSize: '20px 20px',
                }}
              >
                <div style={{ height: 5, background: 'repeating-linear-gradient(90deg, #fff 0 10px, #000 10px 20px)' }} />
                <div className="p-3 flex flex-col gap-1.5">
                  {pairs.map(([li, ri]) => {
                    const L = slots[li], R = slots[ri]
                    return (
                      <div key={li} className="grid grid-cols-2 gap-2 items-start">
                        <P1GridSlot
                          label={L.label} pos={L.pos} value={L.value}
                          onChange={v => setField(L.field, v)}
                          pilotos={gpPilotos} disabledCodes={gpDisabled}
                          excludeCodes={usedExcept(L.value)}
                        />
                        <div style={{ marginTop: 14 }}>
                          <P1GridSlot
                            label={R.label} pos={R.pos} value={R.value}
                            onChange={v => setField(R.field, v)}
                            pilotos={gpPilotos} disabledCodes={gpDisabled}
                            excludeCodes={usedExcept(R.value)}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
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
          <PilotoSelect label="Piloto" value={form.p9_retire ?? ''} onChange={v => setField('p9_retire', v)} includeNone pilotos={gpPilotos} disabledCodes={gpDisabled} />
        </div>

        {/* P10 — Driver of the Day */}
        <div className="card">
          <QHeader code="P10" title="Driver of the Day" pts="2 pts" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Quem será o piloto eleito 'Driver of the Day' no {gpNameFull}?
          </p>
          <PilotoSelect label="Piloto" value={form.p10_dotd ?? ''} onChange={v => setField('p10_dotd', v)} pilotos={gpPilotos} disabledCodes={gpDisabled} />
        </div>

        {/* P11 — Volta mais rápida */}
        <div className="card">
          <QHeader code="P11" title="Volta Mais Rápida" pts="1 pt" />
          <p className="text-sm text-yellow-400/80 mb-4">
            Qual piloto fará a volta mais rápida no {gpNameFull}?
          </p>
          <PilotoSelect label="Piloto" value={form.p11_fl ?? ''} onChange={v => setField('p11_fl', v)} pilotos={gpPilotos} disabledCodes={gpDisabled} />
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
        {(() => {
          const p14Opts = gp.round >= 10 ? P14_MULTI : P14_BINARY
          const isMulti = p14Opts.length > 2
          return (
            <div className="card">
              <QHeader code="P14" title="Safety Car / VSC" pts="1 pt" />
              <p className="text-sm text-yellow-400/80 mb-4">
                {isMulti
                  ? `Vamos ter um Safety Car ou Virtual Safety Car no ${gpNameFull}?`
                  : `Haverá um Safety Car na pista durante o ${gpNameFull}?`}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {p14Opts.map((opt: P14Option) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setField('p14_sc', opt.value)}
                    className="rounded-xl border-2 p-2 flex flex-col items-center gap-2 transition-all duration-200"
                    style={{
                      borderColor: form.p14_sc === opt.value ? '#e10600' : 'rgba(255,255,255,0.1)',
                      backgroundColor: form.p14_sc === opt.value ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <P14Badge value={opt.value} />
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: form.p14_sc === opt.value ? '#fff' : '#9ca3af' }}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )
        })()}

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

        {!readOnly && (
          <button type="submit" disabled={loading} className="btn-primary w-full text-lg py-4">
            {loading ? 'A guardar...' : '🏎️ Submeter previsão'}
          </button>
        )}
      </form>
    </div>
  )
}
