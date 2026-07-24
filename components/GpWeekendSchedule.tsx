'use client'

import { useState, useEffect } from 'react'

type SessionDef = {
  key: string
  label: string
  startUtc: string | null
  durationMin: number
  type: 'fp' | 'qual' | 'race' | 'sprint_qual' | 'sprint_race'
}

function fmt24(utcStr: string): string {
  return new Date(utcStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function fmtDayHeader(utcStr: string): string {
  const d = new Date(utcStr)
  const weekday = d.toLocaleDateString('pt', { weekday: 'long' })
  const day     = d.getDate()
  const month   = d.toLocaleDateString('pt', { month: 'short' }).replace('.', '')
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
    { key: 'fp1',    label: 'Treino Livre 1',    startUtc: fp1,  durationMin: 60,  type: 'fp' },
    { key: 'sq',     label: 'Sprint Qualifying', startUtc: fp2,  durationMin: 60,  type: 'sprint_qual' },
    { key: 'sprint', label: 'Sprint Race',        startUtc: fp3,  durationMin: 45,  type: 'sprint_race' },
    { key: 'qual',   label: 'Qualifying',         startUtc: qual, durationMin: 60,  type: 'qual' },
    { key: 'race',   label: 'Grande Prémio',      startUtc: race, durationMin: 120, type: 'race' },
  ]
  return [
    { key: 'fp1',  label: 'Treino Livre 1', startUtc: fp1,  durationMin: 60,  type: 'fp' },
    { key: 'fp2',  label: 'Treino Livre 2', startUtc: fp2,  durationMin: 60,  type: 'fp' },
    { key: 'fp3',  label: 'Treino Livre 3', startUtc: fp3,  durationMin: 60,  type: 'fp' },
    { key: 'qual', label: 'Qualifying',      startUtc: qual, durationMin: 60,  type: 'qual' },
    { key: 'race', label: 'Grande Prémio',  startUtc: race, durationMin: 120, type: 'race' },
  ]
}

const SESSION_ICON: Record<string, string> = {
  fp: '🔵', qual: '⚡', race: '🏁', sprint_qual: '⚡', sprint_race: '🏃',
}

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
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const sessions = buildSessions(fp1Start, fp2Start, fp3Start, qualifyingStart, raceStart, isSprint)
    .filter(s => s.startUtc)

  if (sessions.length === 0) return null

  // Group by local day
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
      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(0,0,0,0.45)' }}>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-sm">📅</span>
          <span className="text-xs font-black text-gray-300 uppercase tracking-widest">Programa do Fim de Semana</span>
          <span className="ml-auto text-[10px] text-gray-600 font-medium">hora local</span>
        </div>

        {/* Day blocks */}
        {Array.from(dayMap.entries()).map(([dayKey, daySessions], dayIdx) => {
          const isLastDay = dayIdx === dayMap.size - 1
          const hasRace = daySessions.some(s => s.type === 'race')
          const hasQual = daySessions.some(s => s.type === 'qual' || s.type === 'sprint_qual')

          const dayAccent = hasRace
            ? 'border-f1red/40 text-f1red'
            : hasQual
            ? 'border-yellow-500/30 text-yellow-400'
            : 'border-blue-500/20 text-blue-300'

          return (
            <div key={dayKey} className={`${!isLastDay ? 'border-b border-white/8' : ''}`}>
              {/* Day header */}
              <div className={`flex items-center gap-2 px-4 py-2 border-l-2 ${dayAccent}`}
                style={{ background: hasRace ? 'rgba(225,6,0,0.08)' : hasQual ? 'rgba(234,179,8,0.06)' : 'rgba(59,130,246,0.06)' }}>
                <span className={`text-[11px] font-black uppercase tracking-widest ${dayAccent.split(' ')[1]}`}>
                  {fmtDayHeader(daySessions[0].startUtc!)}
                </span>
              </div>

              {/* Sessions */}
              {daySessions.map((s, i) => {
                const status = getStatus(s.startUtc!, s.durationMin, now)
                const isQual = s.type === 'qual' || s.type === 'sprint_qual'
                const isRace = s.type === 'race'

                const rowBg = status === 'live'
                  ? 'rgba(225,6,0,0.12)'
                  : isRace && status === 'upcoming'
                  ? 'rgba(225,6,0,0.05)'
                  : isQual && status === 'upcoming'
                  ? 'rgba(234,179,8,0.05)'
                  : 'transparent'

                const nameCls = status === 'done'
                  ? 'text-gray-600 line-through'
                  : isRace
                  ? 'text-white font-black text-base'
                  : isQual
                  ? 'text-yellow-300 font-bold'
                  : 'text-gray-300 font-medium'

                const timeCls = status === 'done'
                  ? 'text-gray-700'
                  : isRace
                  ? 'text-f1red font-black text-base'
                  : isQual
                  ? 'text-yellow-400 font-black'
                  : 'text-gray-400 font-bold'

                return (
                  <div
                    key={s.key}
                    className={`flex items-center justify-between px-4 py-2.5 gap-3 ${i < daySessions.length - 1 ? 'border-b border-white/5' : ''}`}
                    style={{ background: rowBg }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-base w-5 text-center shrink-0 ${status === 'done' ? 'grayscale opacity-30' : ''}`}>
                        {status === 'done' ? '✓' : SESSION_ICON[s.type]}
                      </span>
                      <span className={`truncate ${nameCls}`}>{s.label}</span>
                      {status === 'live' && (
                        <span className="text-[9px] font-black bg-f1red text-white px-2 py-0.5 rounded-full animate-pulse shrink-0">
                          AO VIVO
                        </span>
                      )}
                    </div>
                    <span className={`tabular-nums shrink-0 ${timeCls}`}>
                      {fmt24(s.startUtc!)}
                    </span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {/* Betting reminder countdown */}
      {showReminder && qualCd && (
        <div className="rounded-xl border border-yellow-600/30 px-4 py-3"
          style={{ background: 'rgba(161,98,7,0.15)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-black text-yellow-400 uppercase tracking-widest mb-0.5">
                ⚠️ Lembra-te de apostar!
              </p>
              <p className="text-[11px] text-yellow-600/80">
                F1 Fantasy &amp; F1 Predict fecham antes do Qualifying
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(qualCd.d > 0
                ? [{ v: qualCd.d, l: 'DIA' + (qualCd.d !== 1 ? 'S' : '') }, { v: qualCd.h, l: 'HRS' }, { v: qualCd.m, l: 'MIN' }]
                : [{ v: qualCd.h, l: 'HRS' }, { v: qualCd.m, l: 'MIN' }, { v: qualCd.s, l: 'SEG' }]
              ).map((u, i) => (
                <div key={u.l} className="flex items-center gap-1">
                  {i > 0 && <span className="text-xs font-black text-yellow-800 pb-2.5">:</span>}
                  <div className="flex flex-col items-center">
                    <div className="rounded-md px-2 py-0.5 min-w-[30px] text-center border border-yellow-700/40" style={{ background: 'rgba(0,0,0,0.35)' }}>
                      <span className="text-sm font-black tabular-nums text-yellow-300">
                        {String(u.v).padStart(2, '0')}
                      </span>
                    </div>
                    <span className="text-[8px] text-yellow-800 font-bold tracking-widest mt-0.5">{u.l}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
