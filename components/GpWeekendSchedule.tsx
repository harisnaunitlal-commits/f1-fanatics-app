'use client'

import { useState, useEffect, useCallback } from 'react'

type SessionDef = {
  key: string
  label: string
  startUtc: string | null
  durationMin: number
  type: 'fp1' | 'fp2' | 'fp3' | 'qual' | 'race' | 'sprint_qual' | 'sprint_race'
}

type ResultRow = {
  position: number
  acronym: string
  driver_name: string
  team: string
  team_colour: string
  time: string
  gap: string
}

function fmt24(utcStr: string): string {
  return new Date(utcStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function localDateStr(utcStr: string): string {
  return new Date(utcStr).toLocaleDateString('en-CA')
}

function fmtDayHeader(utcStr: string): string {
  const d = new Date(utcStr)
  const weekday = d.toLocaleDateString('pt', { weekday: 'long' })
  const day   = d.getDate()
  const month = d.toLocaleDateString('pt', { month: 'short' }).replace('.', '')
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day} ${month.charAt(0).toUpperCase() + month.slice(1)}`
}

function getStatus(startUtc: string, durationMin: number, now: Date): 'done' | 'live' | 'upcoming' {
  const start = new Date(startUtc).getTime()
  const end   = start + durationMin * 60000
  const t     = now.getTime()
  if (t > end)    return 'done'
  if (t >= start) return 'live'
  return 'upcoming'
}

function countdownTo(utcStr: string, now: Date) {
  const diff = new Date(utcStr).getTime() - now.getTime()
  if (diff <= 0) return null
  const s = Math.floor(diff / 1000)
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, totalSec: s }
}

function buildSessions(
  fp1: string | null, fp2: string | null, fp3: string | null,
  qual: string | null, race: string | null, isSprint: boolean
): SessionDef[] {
  if (isSprint) return [
    { key: 'fp1',         label: 'FP1',              startUtc: fp1,  durationMin: 60,  type: 'fp1' },
    { key: 'sprint_qual', label: 'Sprint Qualifying', startUtc: fp2,  durationMin: 60,  type: 'sprint_qual' },
    { key: 'sprint_race', label: 'Sprint Race',       startUtc: fp3,  durationMin: 45,  type: 'sprint_race' },
    { key: 'qual',        label: 'Qualifying',        startUtc: qual, durationMin: 60,  type: 'qual' },
    { key: 'race',        label: 'Grande Prémio',     startUtc: race, durationMin: 120, type: 'race' },
  ]
  return [
    { key: 'fp1',  label: 'FP1',          startUtc: fp1,  durationMin: 60,  type: 'fp1' },
    { key: 'fp2',  label: 'FP2',          startUtc: fp2,  durationMin: 60,  type: 'fp2' },
    { key: 'fp3',  label: 'FP3',          startUtc: fp3,  durationMin: 60,  type: 'fp3' },
    { key: 'qual', label: 'Qualifying',   startUtc: qual, durationMin: 60,  type: 'qual' },
    { key: 'race', label: 'Grande Prémio', startUtc: race, durationMin: 120, type: 'race' },
  ]
}

const SESSION_ICON: Record<string, string> = {
  fp1: '🔵', fp2: '🔵', fp3: '🔵',
  qual: '⚡', race: '🏁',
  sprint_qual: '⚡', sprint_race: '🏃',
}

// ── Inline results panel ────────────────────────────────────────────────────
function ResultsPanel({ sessionKey, startUtc, label }: { sessionKey: string; startUtc: string; label: string }) {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<ResultRow[] | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const date = localDateStr(startUtc)
    fetch(`/api/session-results?type=${sessionKey}&date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setResults(data.results ?? [])
      })
      .catch(() => setError('Erro ao carregar resultados.'))
      .finally(() => setLoading(false))
  }, [sessionKey, startUtc])

  const isPractice = ['fp1', 'fp2', 'fp3'].includes(sessionKey)

  return (
    <div className="mx-3 mb-2 rounded-xl overflow-hidden border border-white/10" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/8"
        style={{ background: 'rgba(255,255,255,0.04)' }}>
        <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">
          📊 Resultados · {label}
        </span>
        <span className="text-[9px] text-gray-600">OpenF1</span>
      </div>

      {loading && (
        <div className="py-4 text-center text-xs text-gray-500 animate-pulse">A carregar...</div>
      )}
      {error && (
        <div className="py-3 px-3 text-xs text-yellow-600">{error}</div>
      )}
      {results && results.length === 0 && (
        <div className="py-3 px-3 text-xs text-gray-600">Sem dados disponíveis.</div>
      )}

      {results && results.length > 0 && (
        <div className="max-h-80 overflow-y-auto">
          {results.map((r, i) => {
            const colour = r.team_colour ? `#${r.team_colour.replace('#', '')}` : '#888'
            const medal  = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
            return (
              <div
                key={r.position}
                className={`flex items-center gap-2 px-3 py-1.5 ${i < results.length - 1 ? 'border-b border-white/5' : ''}`}
                style={{ background: i < 3 ? 'rgba(255,255,255,0.03)' : 'transparent' }}
              >
                {/* Position / Medal */}
                <span className="text-xs font-black w-5 text-center shrink-0"
                  style={{ color: i < 3 ? colour : '#6b7280' }}>
                  {medal ?? r.position}
                </span>

                {/* Team colour bar */}
                <div className="w-0.5 h-5 rounded-full shrink-0" style={{ background: colour }} />

                {/* Driver info */}
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-black text-white mr-1.5">{r.acronym}</span>
                  <span className="text-[10px] text-gray-400 truncate">{r.driver_name}</span>
                  <div className="text-[9px] text-gray-600 truncate">{r.team}</div>
                </div>

                {/* Time + Gap on same line */}
                <div className="flex items-center gap-2 shrink-0">
                  {isPractice && i > 0 && (
                    <span className="text-[9px] text-gray-500 tabular-nums">{r.gap}</span>
                  )}
                  <span className="text-xs font-black tabular-nums"
                    style={{ color: i === 0 ? colour : '#9ca3af' }}>
                    {isPractice ? r.time : `P${r.position}`}
                  </span>
                </div>
              </div>
            )
          })}
          <div className="px-3 py-1.5 text-[9px] text-gray-700 text-right border-t border-white/5">
            Fonte: OpenF1 API · openf1.org
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ──────────────────────────────────────────────────────────
export default function GpWeekendSchedule({
  fp1Start, fp2Start, fp3Start, qualifyingStart, raceStart,
  isSprint = false, deadlineFantasy,
}: {
  fp1Start: string | null
  fp2Start: string | null
  fp3Start: string | null
  qualifyingStart: string | null
  raceStart: string | null
  isSprint?: boolean
  deadlineFantasy?: string | null
}) {
  const [now, setNow]           = useState(new Date())
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const toggle = useCallback((key: string) => {
    setExpanded(prev => prev === key ? null : key)
  }, [])

  const sessions = buildSessions(fp1Start, fp2Start, fp3Start, qualifyingStart, raceStart, isSprint)
    .filter(s => s.startUtc)

  if (sessions.length === 0) return null

  const dayMap = new Map<string, SessionDef[]>()
  for (const s of sessions) {
    const key = new Date(s.startUtc!).toDateString()
    if (!dayMap.has(key)) dayMap.set(key, [])
    dayMap.get(key)!.push(s)
  }

  const qualDeadline = deadlineFantasy ?? qualifyingStart
  const qualCd = qualDeadline ? countdownTo(qualDeadline, now) : null
  const showReminder = qualCd !== null && qualCd.totalSec > 0 && qualCd.totalSec < 48 * 3600

  return (
    <div className="mt-5 space-y-3">

      {/* Schedule card */}
      <div className="rounded-2xl overflow-hidden border-2 border-yellow-400"
        style={{ background: 'rgba(0,0,0,0.55)', boxShadow: '0 0 24px rgba(250,204,21,0.20)' }}>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10"
          style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-sm">📅</span>
          <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">Programa do Fim de Semana</span>
          <span className="ml-auto text-[10px] text-gray-600 font-medium">hora local</span>
        </div>

        {/* Day blocks */}
        {Array.from(dayMap.entries()).map(([dayKey, daySessions], dayIdx) => {
          const isLastDay = dayIdx === dayMap.size - 1

          return (
            <div key={dayKey} className={!isLastDay ? 'border-b border-white/8' : ''}>

              {/* Day header — always yellow */}
              <div className="flex items-center gap-2 px-4 py-2 border-l-2 border-yellow-400/50"
                style={{ background: 'rgba(250,204,21,0.06)' }}>
                <span className="text-[11px] font-black uppercase tracking-widest text-yellow-400">
                  {fmtDayHeader(daySessions[0].startUtc!)}
                </span>
              </div>

              {/* Sessions */}
              {daySessions.map((s, i) => {
                const status  = getStatus(s.startUtc!, s.durationMin, now)
                const isQual  = s.type === 'qual' || s.type === 'sprint_qual'
                const isRaceS = s.type === 'race'
                const isFp    = ['fp1', 'fp2', 'fp3'].includes(s.type)
                const isDone  = status === 'done'
                const isOpen  = expanded === s.key

                const rowBg = status === 'live' ? 'rgba(225,6,0,0.12)'
                  : isRaceS && !isDone ? 'rgba(225,6,0,0.05)'
                  : isQual  && !isDone ? 'rgba(234,179,8,0.04)'
                  : 'transparent'

                // Label colour: done = strikethrough gray; FP = white bold; qual/race = special
                const nameCls = isDone
                  ? 'text-gray-600 line-through'
                  : isRaceS ? 'text-white font-black text-base'
                  : isQual  ? 'text-yellow-300 font-bold'
                  : 'text-white font-bold'   // FP1/FP2/FP3 → white bold

                // Time colour: done = gray; all others = yellow-400
                const timeCls = isDone
                  ? 'text-gray-700'
                  : isRaceS ? 'text-f1red font-black text-base'
                  : 'text-yellow-400 font-black'

                return (
                  <div key={s.key} className={i < daySessions.length - 1 || isOpen ? 'border-b border-white/5' : ''}>
                    <div
                      className={`flex items-center justify-between px-4 py-2.5 gap-3 ${isDone ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
                      style={{ background: rowBg }}
                      onClick={() => isDone && toggle(s.key)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`text-base w-5 text-center shrink-0 ${isDone ? 'opacity-40' : ''}`}>
                          {isDone ? '✓' : SESSION_ICON[s.type]}
                        </span>
                        <span className={`truncate ${nameCls}`}>{s.label}</span>
                        {status === 'live' && (
                          <span className="text-[9px] font-black bg-f1red text-white px-2 py-0.5 rounded-full animate-pulse shrink-0">
                            AO VIVO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`tabular-nums ${timeCls}`}>{fmt24(s.startUtc!)}</span>
                        {isDone && (
                          <span className="text-[10px] text-yellow-600 font-bold">
                            {isOpen ? '▲' : '📊'}
                          </span>
                        )}
                      </div>
                    </div>

                    {isDone && isOpen && (
                      <ResultsPanel sessionKey={s.type} startUtc={s.startUtc!} label={s.label} />
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Betting reminder */}
      {showReminder && qualCd && (
        <div className="rounded-xl border border-yellow-400/40 px-4 py-3 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: '#000', boxShadow: '0 0 16px rgba(250,204,21,0.15)' }}>
          <p className="text-sm font-bold text-white">
            ⚠️ Lembra-te de apostar no F1 Fantasy e F1 Predict
          </p>
          <div className="flex items-center gap-1 shrink-0">
            {(qualCd.d > 0
              ? [{ v: qualCd.d, l: 'DIA' + (qualCd.d !== 1 ? 'S' : '') }, { v: qualCd.h, l: 'HRS' }, { v: qualCd.m, l: 'MIN' }]
              : [{ v: qualCd.h, l: 'HRS' }, { v: qualCd.m, l: 'MIN' }, { v: qualCd.s, l: 'SEG' }]
            ).map((u, i) => (
              <div key={u.l} className="flex items-center gap-1">
                {i > 0 && <span className="text-xs font-black text-gray-500 pb-2.5">:</span>}
                <div className="flex flex-col items-center">
                  <div className="rounded-md px-2 py-0.5 min-w-[30px] text-center border border-white/20"
                    style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <span className="text-sm font-black tabular-nums text-white">{String(u.v).padStart(2, '0')}</span>
                  </div>
                  <span className="text-[8px] text-gray-500 font-bold tracking-widest mt-0.5">{u.l}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
