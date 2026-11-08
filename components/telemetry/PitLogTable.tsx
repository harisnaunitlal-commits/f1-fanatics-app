'use client'

import { useState } from 'react'
import type { TelemetryState, PitStopItem } from '@/lib/telemetry/engine'
import { COMPOUND } from './ui'

const th = 'py-2 px-2 text-[10px] text-gray-500 uppercase tracking-wider'

function Tyres({ p }: { p: PitStopItem }) {
  const a = p.from ? COMPOUND[p.from] : null, b = p.to ? COMPOUND[p.to] : null
  return (
    <span className="inline-flex items-center gap-1 text-xs font-black">
      <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] ${a?.cls ?? 'border-gray-600 text-gray-500'}`}>{a?.letter ?? '?'}</span>
      <span className="text-gray-500">→</span>
      <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] ${b?.cls ?? 'border-gray-600 text-gray-500'}`}>{b?.letter ?? '?'}</span>
    </span>
  )
}

// Every pit stop of the race, newest first (a new row appears as soon as OpenF1 publishes the stop), or the ranking of the fastest stops.
export function PitLogTable({ s }: { s: TelemetryState }) {
  const [mode, setMode] = useState<'live' | 'fast'>('live')
  if (s.pitLog.length === 0) return <p className="text-sm text-gray-500">Ainda sem paragens.</p>
  const stops = s.pitLog.map(p => p.stopS).filter((x): x is number => x !== null)
  const best = stops.length ? Math.min(...stops) : null
  const rows = mode === 'live' ? s.pitLog : s.pitLog.filter(p => p.stopS !== null).sort((a, b) => (a.stopS as number) - (b.stopS as number))
  const nDrivers = new Set(s.pitLog.map(p => p.code)).size

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {([['live', 'Por ordem (mais recente primeiro)'], ['fast', 'Mais rápidas']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)} className={`rounded-full px-3 py-1 text-xs border ${mode === k ? 'bg-white/10 border-white/40' : 'border-gray-700 text-gray-400'}`}>{label}</button>
        ))}
        <span className="ml-auto text-[10px] text-gray-500">{s.pitLog.length} paragens · {nDrivers} pilotos</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/60">
              {mode === 'fast' && <th className={`${th} w-8 text-center`}>#</th>}
              <th className={`${th} text-left`}>Piloto</th>
              <th className={`${th} text-center`}>Volta</th>
              <th className={`${th} text-center`}>Pneus</th>
              <th className={`${th} text-right`} title="tempo parado na box">Parado</th>
              <th className={`${th} text-right`} title="tempo total da entrada à saída da pit lane">Pit lane</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const fastest = p.stopS !== null && p.stopS === best
              return (
                <tr key={`${p.code}-${p.at}`} className="border-b border-gray-800/50">
                  {mode === 'fast' && <td className="py-1.5 px-2 text-center tabular-nums text-gray-400">{i + 1}</td>}
                  <td className="py-1.5 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: p.colour }} /><b>{p.code}</b></span></td>
                  <td className="py-1.5 px-2 text-center tabular-nums text-gray-300">{p.lap ?? '—'}</td>
                  <td className="py-1.5 px-2 text-center"><Tyres p={p} /></td>
                  <td className={`py-1.5 px-2 text-right tabular-nums font-bold ${fastest ? 'text-purple-400' : ''}`}>{p.stopS !== null ? `${p.stopS.toFixed(1)} s` : '—'}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-gray-400">{p.laneS !== null ? `${p.laneS.toFixed(1)} s` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
