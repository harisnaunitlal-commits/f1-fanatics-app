'use client'

import { useState, useEffect } from 'react'

function fmt(utc: string) {
  return new Date(utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDay(utc: string) {
  return new Date(utc).toLocaleDateString('pt', { weekday: 'long', day: 'numeric', month: 'long' })
}

function countdown(openUtc: string): string {
  const diff = new Date(openUtc).getTime() - Date.now()
  if (diff <= 0) return ''
  const s = Math.floor(diff / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function QualifyingLocked({
  gpEmoji, gpNome, qualifyingStart,
}: {
  gpEmoji: string | null
  gpNome: string
  qualifyingStart: string
}) {
  // Qualifying: start → start+60min | Submissions open: start+120min (1h after quali ends)
  const qualEnd  = new Date(new Date(qualifyingStart).getTime() + 60 * 60 * 1000).toISOString()
  const openAt   = new Date(new Date(qualifyingStart).getTime() + 2 * 60 * 60 * 1000).toISOString()

  const [cd, setCd] = useState(countdown(openAt))

  useEffect(() => {
    const t = setInterval(() => setCd(countdown(openAt)), 1000)
    return () => clearInterval(t)
  }, [openAt])

  return (
    <div className="max-w-lg mx-auto mt-12 px-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🔒</div>
        <h1 className="text-2xl font-bold">Submissões ainda não abertas</h1>
        <p className="text-gray-400 mt-1 text-sm">{gpEmoji} GP {gpNome}</p>
      </div>

      {/* Qualifying card */}
      <div className="rounded-2xl border-2 border-yellow-400/60 overflow-hidden mb-4"
        style={{ background: 'rgba(250,204,21,0.06)', boxShadow: '0 0 24px rgba(250,204,21,0.15)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-yellow-400/20"
          style={{ background: 'rgba(250,204,21,0.10)' }}>
          <span className="text-sm">⚡</span>
          <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">Qualifying</span>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-yellow-300 font-bold text-base capitalize">{fmtDay(qualifyingStart)}</p>
          <p className="text-white font-black text-3xl mt-1 tabular-nums">
            {fmt(qualifyingStart)} <span className="text-gray-500 text-xl">–</span> {fmt(qualEnd)}
          </p>
        </div>
      </div>

      {/* Open time card */}
      <div className="rounded-2xl border-2 border-f1red/40 overflow-hidden mb-4"
        style={{ background: 'rgba(225,6,0,0.06)', boxShadow: '0 0 20px rgba(225,6,0,0.12)' }}>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-f1red/20"
          style={{ background: 'rgba(225,6,0,0.10)' }}>
          <span className="text-sm">🏎️</span>
          <span className="text-xs font-black text-f1red uppercase tracking-widest">Submissões abrem</span>
        </div>
        <div className="px-4 py-4 text-center">
          <p className="text-gray-300 font-bold text-base capitalize">{fmtDay(openAt)}</p>
          <p className="text-white font-black text-3xl mt-1 tabular-nums">{fmt(openAt)}</p>
          <p className="text-gray-500 text-xs mt-1">1h após o fim do Qualifying · hora local</p>
        </div>
      </div>

      <a href="/predict" className="btn-primary w-full text-center block">Ver outros GPs</a>
    </div>
  )
}
