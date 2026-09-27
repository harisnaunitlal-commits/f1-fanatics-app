'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026 } from '@/lib/supabase/types'
import {
  P8_MARGENS, P3_OPTIONS, P12_OPTIONS, P14_BINARY, P14_MULTI, P14_MULTI_RF,
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
        <div className="font-black text-sm sm:text-xs text-white leading-tight truncate">{lastName}</div>
        <div className="text-[10px] sm:text-[9px] font-medium mt-0.5 truncate" style={{ color }}>{team}</div>
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
// Mobile: 2+3 layout (first 2 cards wider, last 3 smaller) using a 6-col grid
// Desktop (sm+): standard 5-column row
function DriverGrid({
  options, value, onChange,
}: {
  options: DriverOption[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-6 sm:grid-cols-5 gap-2">
      {options.map((d, i) => (
        <div key={d.codigo} className={i < 2 ? 'col-span-3 sm:col-span-1' : 'col-span-2 sm:col-span-1'}>
          <DriverCard
            codigo={d.codigo} name={d.nome} team={d.equipa} color={d.color}
            selected={value === d.codigo} onClick={() => onChange(d.codigo)}
          />
        </div>
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
        minHeight: 90,
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
        <div className="flex items-center gap-2.5">
          <div
            className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2"
            style={{ borderColor: color + '88', background: color + '18' }}
          >
            {photoUrl && !imgErr ? (
              <img src={photoUrl} alt={drv.nome} className="w-full h-full object-cover object-top" onError={() => setImgErr(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xs font-black" style={{ color }}>{drv.codigo}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-white truncate leading-tight">{lastName}</div>
            <div className="text-[10px] truncate mt-0.5" style={{ color: color + 'cc' }}>{drv.equipa}</div>
            <div className="text-[9px] text-gray-600 mt-1">toca para alterar ↓</div>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-500 italic">Toca para selecionar...</div>
      )}
    </div>
  )
}

// ─── Piloto Select + Card de foto ─────────────────────────────────────────────
function PilotoSelectWithCard({
  label, value, onChange, includeNone = false, pilotos, disabledCodes = [], badgeImg, badgeText, badgeTextColor,
}: {
  label: string; value: string; onChange: (v: string) => void
  includeNone?: boolean
  pilotos?: { codigo: string; nome: string; equipa: string }[]
  disabledCodes?: string[]
  badgeImg?: string
  badgeText?: string
  badgeTextColor?: string
}) {
  const [imgErr, setImgErr] = useState(false)
  const list = pilotos ?? PILOTOS_2026
  const drv = value && value !== 'NONE' ? list.find(p => p.codigo === value) ?? null : null
  const color = drv ? (TEAM_COLORS[drv.equipa] ?? '#888') : '#888'
  const photoUrl = drv ? getDriverPhoto(drv.codigo) : null

  return (
    <div className="space-y-3">
      <div>
        <label className="label">{label}</label>
        <select
          className="select"
          value={value}
          onChange={e => { setImgErr(false); onChange(e.target.value) }}
        >
          <option value="">Selecciona...</option>
          {includeNone && <option value="NONE">Nenhum Piloto</option>}
          {list.map(p => (
            <option key={p.codigo} value={p.codigo} disabled={disabledCodes.includes(p.codigo)}>
              {disabledCodes.includes(p.codigo) ? `✕ ${p.nome} (não participa)` : `${p.nome} (${p.equipa})`}
            </option>
          ))}
        </select>
      </div>
      {drv && (
        <div
          className="rounded-2xl overflow-hidden border-2 flex items-center gap-4 p-3 transition-all duration-300"
          style={{ borderColor: color + '88', background: color + '15', boxShadow: `0 0 20px ${color}33` }}
        >
          <div
            className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2"
            style={{ borderColor: color + '66', background: color + '22' }}
          >
            {photoUrl && !imgErr ? (
              <img src={photoUrl} alt={drv.nome} className="w-full h-full object-cover object-top" onError={() => setImgErr(true)} />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-2xl font-black" style={{ color }}>{drv.codigo}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-black text-xl leading-tight">{drv.nome}</div>
            <div className="text-sm font-bold mt-1" style={{ color }}>{drv.equipa}</div>
            <div
              className="mt-2 inline-block px-2 py-0.5 rounded text-xs font-black text-white"
              style={{ background: color }}
            >
              ✓ Selecionado
            </div>
          </div>
          {badgeImg && (
            <img src={badgeImg} alt="badge" className="w-20 h-20 object-contain flex-shrink-0 drop-shadow-lg" />
          )}
          {badgeText && !badgeImg && (
            <div className="flex-shrink-0 text-center px-1">
              {badgeText.split(' ').map((word, i) => (
                <div key={i} className="font-black text-sm uppercase leading-tight tracking-wider" style={{ color: badgeTextColor ?? '#fff' }}>{word}</div>
              ))}
            </div>
          )}
          <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ background: color }} />
        </div>
      )}
      {value === 'NONE' && (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-gray-400 text-sm font-bold">
          ✕ Nenhum piloto selecionado
        </div>
      )}
    </div>
  )
}

function QBox({ code, question, pts }: { code: string; question: string; pts: string }) {
  return (
    <div className="flex items-start gap-2 mb-4">
      <div className="flex-1 bg-yellow-400 rounded-lg px-3 py-2">
        <p className="text-black text-sm font-black">{code} · {question}</p>
      </div>
      <div className="bg-yellow-400/20 border border-yellow-400/50 rounded-lg px-2.5 py-2 flex-shrink-0">
        <span className="text-yellow-300 font-black text-sm">{pts}</span>
      </div>
    </div>
  )
}

function flagToCC(emoji: string): string {
  if (!emoji) return ''
  const pts = Array.from(emoji).map(c => (c.codePointAt(0) ?? 0) - 0x1F1E6)
  if (pts.length < 2 || pts[0] < 0 || pts[0] > 25) return ''
  return String.fromCharCode(65 + pts[0], 65 + pts[1])
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
  const gpDisabled = (gp.round === 12 || gp.round === 13 || gp.round === 14) ? ['HAD'] : []
  const gpPilotos = (gp.round === 12 || gp.round === 13 || gp.round === 14)
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

    const missing: string[] = []
    if (!form.p1_primeiro) missing.push('P1 — 1º lugar')
    if (!form.p1_segundo)  missing.push('P1 — 2º lugar')
    if (!form.p1_terceiro) missing.push('P1 — 3º lugar')
    if (!form.p2_equipa)   missing.push('P2 — Equipa Construtora')
    if (!form.p3_lap)      missing.push('P3 — Número de Voltas')
    if (!form.p4_quarto)   missing.push('P4 — 4º lugar')
    if (!form.p4_quinto)   missing.push('P4 — 5º lugar')
    if (!form.p4_sexto)    missing.push('P4 — 6º lugar')
    if (!form.p5_duelo)    missing.push('P5 — Duelo 1')
    if (!form.p6_duelo)    missing.push('P6 — Duelo 2')
    if (!form.p7_duelo)    missing.push('P7 — Duelo 3')
    if (!form.p8_margem)   missing.push('P8 — Margem de Vitória')
    if (!form.p9_retire)   missing.push('P9 — First to Retire')
    if (!form.p10_dotd)    missing.push('P10 — Driver of the Day')
    if (!form.p11_fl)      missing.push('P11 — Volta Mais Rápida')
    if (!form.p12_classif) missing.push('P12 — Nº Classificados')
    if (!form.p13_especial) missing.push('P13 — Pergunta Especial')
    if (!form.p14_sc)      missing.push('P14 — Safety Car')
    if (!form.p15_outsider) missing.push('P15 — Outsider')
    if (missing.length > 0) {
      setError('Previsão incompleta. Falta responder: ' + missing.join(', '))
      return
    }

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
          const gpCC = flagToCC(gp.emoji_bandeira ?? '')
          const bgUrl = gpCC ? `/Pilotos/${gpCC}.png` : null
          const flagUrl = gpCC ? `/flags/${gpCC}.png` : null

          return (
            <div className="card overflow-hidden p-0">
              {/* GP Background Banner */}
              <div className="relative overflow-hidden" style={{ minHeight: 400 }}>
                {bgUrl ? (
                  <img
                    src={bgUrl}
                    alt={gp.nome}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="absolute inset-0" style={{
                    background: '#0a0a0a',
                    backgroundImage: 'repeating-conic-gradient(#1a1a1a 0% 25%, transparent 0% 50%)',
                    backgroundSize: '20px 20px',
                  }} />
                )}
                {/* Strong dark gradient — heavier at bottom so text pops */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.82) 100%)' }} />
                {/* Top checkered stripe */}
                <div className="absolute top-0 left-0 right-0" style={{ height: 6, background: 'repeating-linear-gradient(90deg, #fff 0 12px, #000 12px 24px)' }} />
                {/* GP title — centrado verticalmente na parte inferior */}
                <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4">
                  {/* Badge de pontos */}
                  <div className="flex justify-end mb-3">
                    <div className="bg-yellow-400/25 border-2 border-yellow-400/60 rounded-xl px-4 py-1.5 backdrop-blur-sm">
                      <span className="text-yellow-300 font-black text-lg">6 pts</span>
                    </div>
                  </div>
                  {/* Bandeira + Nome */}
                  <div className="flex items-center gap-3 mb-2">
                    {flagUrl && <img src={flagUrl} alt={gpCC} className="h-10 w-auto rounded shadow-xl" />}
                    <div>
                      <div className="text-white font-black text-3xl leading-tight drop-shadow-xl">GP {gp.nome}</div>
                      <div className="text-white/70 text-xs font-bold uppercase tracking-widest mt-0.5">Top 6 Classificados</div>
                    </div>
                  </div>
                  {/* Pergunta */}
                  <div className="bg-yellow-400 rounded-lg px-3 py-2">
                    <p className="text-black text-sm font-black">
                      P1 · Qual é a sua previsão para os 6 primeiros classificados do {gpNameFull}?
                    </p>
                  </div>
                </div>
                {/* Bottom checkered stripe */}
                <div className="absolute bottom-0 left-0 right-0" style={{ height: 5, background: 'repeating-linear-gradient(90deg, #fff 0 12px, #000 12px 24px)' }} />
              </div>

              {/* Selection slots */}
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

        {/* P2 — 2ª / 3ª Equipa */}
        <div className="card">
          <QBox code="P2" question={config?.p2Label ?? `Qual será a segunda equipa, que vai pontuar mais no ${gpNameFull}?`} pts="1 pt" />
          <div className="grid grid-cols-2 gap-2">
            {EQUIPAS_2026.map(eq => {
              const color = TEAM_COLORS[eq] ?? '#555'
              const isSelected = form.p2_equipa === eq
              // Use black text for light-coloured teams
              const lightTeams = ['McLaren', 'Haas', 'Alpine', 'Williams', 'Audi', 'Mercedes']
              const textColor = lightTeams.includes(eq) ? '#000' : '#fff'
              return (
                <button
                  key={eq}
                  type="button"
                  onClick={() => setField('p2_equipa', eq)}
                  className="relative rounded-xl px-3 py-3 font-black text-sm uppercase tracking-wide transition-all duration-200 overflow-hidden"
                  style={{
                    background: color,
                    color: textColor,
                    outline: isSelected ? `3px solid #fff` : '3px solid transparent',
                    outlineOffset: '2px',
                    boxShadow: isSelected ? `0 0 18px ${color}aa` : 'none',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                  }}
                >
                  {isSelected && (
                    <span className="absolute top-1.5 right-2 text-xs font-black opacity-80">✓</span>
                  )}
                  {eq}
                </button>
              )
            })}
          </div>
        </div>

        {/* P3 — Volta de Avanço */}
        <div className="card">
          <QBox code="P3" question={`Quantos pilotos levarão a volta de avanço (LAP) no ${gpNameFull}?`} pts="1 pt" />
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
          <QBox code="P5" question={`Qual piloto vai terminar na frente do outro no ${gpNameFull}?`} pts="1 pt" />
          {config
            ? <DuelSelector cfg={config.p5} value={form.p5_duelo ?? ''} onChange={v => setField('p5_duelo', v)} />
            : <PilotoSelect label="Piloto" value={form.p5_duelo ?? ''} onChange={v => setField('p5_duelo', v)} />
          }
        </div>

        {/* P6 — Duelo 2 */}
        <div className="card">
          <QBox code="P6" question={`Qual piloto vai terminar na frente do outro no ${gpNameFull}?`} pts="1 pt" />
          {config
            ? <DuelSelector cfg={config.p6} value={form.p6_duelo ?? ''} onChange={v => setField('p6_duelo', v)} />
            : <PilotoSelect label="Piloto" value={form.p6_duelo ?? ''} onChange={v => setField('p6_duelo', v)} />
          }
        </div>

        {/* P7 — Duelo 3 */}
        <div className="card">
          <QBox code="P7" question={`Qual piloto vai terminar na frente do outro no ${gpNameFull}?`} pts="1 pt" />
          {config
            ? <DuelSelector cfg={config.p7} value={form.p7_duelo ?? ''} onChange={v => setField('p7_duelo', v)} />
            : <PilotoSelect label="Piloto" value={form.p7_duelo ?? ''} onChange={v => setField('p7_duelo', v)} />
          }
        </div>

        {/* P8 — Margem de vitória */}
        <div className="card">
          <QBox code="P8" question="Qual será a margem de victória, do prímeiro a cruzar a linha de chegada?" pts="1 pt" />
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
          <QBox code="P9" question={`Quem será o primeiro piloto, First to Retire no ${gpNameFull}?`} pts="3 pts" />
          <PilotoSelectWithCard label="Piloto" value={form.p9_retire ?? ''} onChange={v => setField('p9_retire', v)} includeNone pilotos={gpPilotos} disabledCodes={gpDisabled} badgeImg="/logos/first-to-retire.webp" />
        </div>

        {/* P10 — Driver of the Day */}
        <div className="card">
          <QBox code="P10" question={`Quem será o piloto eleito 'Driver of the Day' no ${gpNameFull}?`} pts="2 pts" />
          <PilotoSelectWithCard label="Piloto" value={form.p10_dotd ?? ''} onChange={v => setField('p10_dotd', v)} pilotos={gpPilotos} disabledCodes={gpDisabled} badgeImg="/logos/driver-of-the-day.webp" />
        </div>

        {/* P11 — Volta mais rápida */}
        <div className="card">
          <QBox code="P11" question={`Qual piloto fará a volta mais rápida no ${gpNameFull}?`} pts="1 pt" />
          <PilotoSelectWithCard label="Piloto" value={form.p11_fl ?? ''} onChange={v => setField('p11_fl', v)} pilotos={gpPilotos} disabledCodes={gpDisabled} badgeImg="/logos/fastest-lap.png" />
        </div>

        {/* P12 — Nº classificados */}
        <div className="card">
          <QBox code="P12" question={`Quantos pilotos classificados, terminaram a corrida no ${gpNameFull}?`} pts="1 pt" />
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
          <QBox code="P13" question={config?.p13Label ?? "Qual piloto terminará a corrida na posição mais alta?"} pts="1 pt" />
          {config
            ? <DriverGrid options={config.p13Options} value={form.p13_especial ?? ''} onChange={v => setField('p13_especial', v)} />
            : <PilotoSelect label="Piloto" value={form.p13_especial ?? ''} onChange={v => setField('p13_especial', v)} />
          }
        </div>

        {/* P14 — Safety Car */}
        {(() => {
          const p14Opts = config?.p14Options ?? (gp.round >= 10 ? P14_MULTI : P14_BINARY)
          const isMulti = p14Opts.length > 2
          return (
            <div className="card">
              <QBox code="P14" question={isMulti ? `Vamos ter um Safety Car ou Virtual Safety Car no ${gpNameFull}?` : `Haverá um Safety Car na pista durante o ${gpNameFull}?`} pts="3 pts" />
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
          <QBox code="P15" question={config?.p15Label ?? "Qual piloto terminará a corrida na posição mais alta?"} pts="1 pt" />
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
