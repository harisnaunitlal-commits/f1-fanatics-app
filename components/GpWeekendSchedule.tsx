'use client'

import { useState, useEffect } from 'react'

type Session = {
  key: string
  label: string
  sublabel?: string
  startUtc: string | null
  icon: string
  durationMin: number
  isRace?: boolean
  isQual?: boolean
}

function buildSessions(
  fp1: string | null,
  fp2: string | null,
  fp3: string | null,
  qual: string | null,
  race: string | null,
  isSprint: boolean
): Session[] {
  if (isSprint) {
    return [
      { key: 'fp1',    label: 'Treino Livre 1',     startUtc: fp1,  icon: '🔵', durationMin: 60 },
      { key: 'sq',     label: 'Sprint Qualifying',   startUtc: fp2,  icon: '⚡', durationMin: 60, isQual: true },
      { key: 'sprint', label: 'Sprint Race',         startUtc: fp3,  icon: '🏃', durationMin: 45 },
      { key: 'qual',   label: 'Qualifying',          startUtc: qual, icon: '⏱️', durationMin: 60, isQual: true },
      { key: 'race',   label: 'Grande Prémio',       startUtc: race, icon: '🏁', durationMin: 120, isRace: true },
    ]
  }
  return [
    { key: 'fp1',  label: 'Treino Livre 1',  startUtc: fp1,  icon: '🔵', durationMin: 60 },
    { key: 'fp2',  label: 'Treino Livre 2',  startUtc: fp2,  icon: '🔵', durationMin: 60 },
    { key: 'fp3',  label: 'Treino Livre 3',  startUtc: fp3,  icon: '🔵', durationMin: 60 },
    { key: 'qual', label: 'Qualifying',       startUtc: qual, icon: '⏱️', durationMin: 60, isQual: true },
    { key: 'race', label: 'Grande Prémio',   startUtc: race, icon: '🏁', durationMin: 120, isRace: true },
  ]
}

function formatLocalTime(utcStr: string) {
  return new Date(utcStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDayLabel(utcStr: string, now: Date) {
  const d = new Date(utcStr)
  const todayStr = now.toDateString()
  const tomorrowStr = new Date(now.getTime() + 86400000).toDateString()
  const afterStr    = new Date(now.getTime() + 2 * 86400000).toDateString()
  if (d.toDateString() === todayStr)     return 'Hoje'
  if (d.toDateString() === tomorrowStr)  return 'Amanhã'
  if (d.toDateString() === afterStr)     return 'Depois de amanhã'
  return d.toLocaleDateString('pt', { weekday: 'long', day: 'numeric', month: 'short' })
}

function getStatus(startUtc: string, durationMin: number, now: Date): 'done' | 'live' | 'upcoming' {
  const start = new Date(startUtc).getTime()
  const end   = start + durationMin * 60000
  const t     = now.getTime()
  if (t > end)    return 'done'
  if (t >= start) return 'live'
  return 'upcoming'
}

function countdownTo(targetUtc: string, now: Date) {
  const diff = new Date(targetUtc).getTime() - now.getTime()
  if (diff <= 0) return null
  const totalSec = Math.floor(diff / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return { d, h, m, s, totalSec }
}

export default function GpWeekendSchedule({
  fp1Start,
  fp2Start,
  fp3Start,
  qualifyingStart,
  raceStart,
  isSprint = false,
  deadlineFantasy,
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
  const dayMap = new Map<string, Session[]>()
  for (const s of sessions) {
    const dayKey = new Date(s.startUtc!).toDateString()
    if (!dayMap.has(dayKey)) dayMap.set(dayKey, [])
    dayMap.get(dayKey)!.push(s)
  }

  // Countdown target: qualifying (for Fantasy/Predict reminder)
  const qualDeadline = deadlineFantasy ?? qualifyingStart
  const qualCd = qualDeadline ? countdownTo(qualDeadline, now) : null
  const showQualReminder = qualCd !== null && qualCd.totalSec < 48 * 3600

  return (
    <div className="mt-4 space-y-3">
      {/* Session schedule */}
      <div className="rounded-xl bg-black/30 border border-gray-700/40 overflow-hidden">
        <div className="px-3 py-2 border-b border-gray-700/40">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            📅 Programa do Fim de Semana · hora local
          </p>
        </div>
        <div className="divide-y divide-gray-800/60">
          {Array.from(dayMap.entries()).map(([dayKey, daySessions]) => (
            <div key={dayKey}>
              {/* Day header */}
              <div className="px-3 py-1.5 bg-gray-800/30">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {formatDayLabel(daySessions[0].startUtc!, now)}
                </span>
              </div>
              {/* Sessions of this day */}
              {daySessions.map(s => {
                const status = getStatus(s.startUtc!, s.durationMin, now)
                return (
                  <div
                    key={s.key}
                    className={`flex items-center justify-between px-3 py-2 gap-3 ${
                      status === 'live' ? 'bg-f1red/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm w-5 text-center shrink-0">{s.icon}</span>
                      <span className={`text-sm font-medium truncate ${
                        status === 'done'     ? 'text-gray-600 line-through' :
                        status === 'live'     ? 'text-white font-bold' :
                        s.isRace             ? 'text-f1red font-bold' :
                        s.isQual             ? 'text-yellow-300 font-semibold' :
                                               'text-gray-300'
                      }`}>
                        {s.label}
                      </span>
                      {status === 'live' && (
                        <span className="text-[9px] font-black bg-f1red text-white px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                          AO VIVO
                        </span>
                      )}
                      {status === 'done' && (
                        <span className="text-[9px] text-gray-700 shrink-0">✓</span>
                      )}
                    </div>
                    <span className={`text-sm font-black tabular-nums shrink-0 ${
                      status === 'done' ? 'text-gray-700' :
                      status === 'live' ? 'text-f1red'   :
                      s.isRace         ? 'text-f1red'    :
                      s.isQual         ? 'text-yellow-300' :
                                         'text-gray-400'
                    }`}>
                      {formatLocalTime(s.startUtc!)}
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Qualifying reminder countdown */}
      {showQualReminder && qualCd && (
        <div className="rounded-xl bg-yellow-900/20 border border-yellow-700/40 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-0.5">
                ⚠️ Lembra-te de apostar!
              </p>
              <p className="text-[11px] text-yellow-600">
                F1 Fantasy &amp; F1 Predict fecham antes do Qualifying
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {[
                { v: qualCd.d, l: 'DIAS', hide: qualCd.d === 0 },
                { v: qualCd.h, l: 'HRS'  },
                { v: qualCd.m, l: 'MIN'  },
                { v: qualCd.s, l: 'SEG'  },
              ].filter(u => !u.hide).map((u, i) => (
                <div key={u.l} className="flex items-center gap-1">
                  {i > 0 && <span className="text-xs font-black text-yellow-800 pb-2.5">:</span>}
                  <div className="flex flex-col items-center">
                    <div className="bg-black/40 border border-yellow-700/40 rounded-md px-1.5 py-0.5 min-w-[26px] text-center">
                      <span className="text-xs font-black tabular-nums text-yellow-400">
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
