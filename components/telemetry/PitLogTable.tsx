'use client'

import { useState } from 'react'
import type { TelemetryState, PitStopItem } from '@/lib/telemetry/engine'
import { teamKey } from '@/lib/telemetry/engine'
import { getDriverPhoto } from '@/lib/gp-questions'
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

// Image that simply disappears when the file is not there yet (team logos and the Pirelli logo are dropped into /public/logos).
function Img({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [bad, setBad] = useState(false)
  if (!src || bad) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} onError={() => setBad(true)} />
}

// Time standing in the box (the DHL Fastest Pit Stop Award measures this): official when OpenF1 has it, otherwise an estimate from the car's speed.
const stopOf = (p: PitStopItem): number | null => p.stopS ?? p.estS

// Every pit stop of the race, newest first (a new row appears as soon as OpenF1 publishes the stop), or the ranking of the fastest stops.
export function PitLogTable({ s }: { s: TelemetryState }) {
  const [mode, setMode] = useState<'live' | 'fast'>('live')
  if (s.pitLog.length === 0) return <p className="text-sm text-gray-500">Ainda sem paragens.</p>
  const timed = s.pitLog.filter(p => stopOf(p) !== null)
  const fastestStop = timed.length ? timed.reduce((a, b) => ((stopOf(b) as number) < (stopOf(a) as number) ? b : a)) : null
  const officialCount = s.pitLog.filter(p => p.stopS !== null).length
  const rows = mode === 'live' ? s.pitLog : [...timed].sort((a, b) => (stopOf(a) as number) - (stopOf(b) as number))
  const nDrivers = new Set(s.pitLog.map(p => p.code)).size

  return (
    <div>
      <div className="flex flex-wrap items-stretch gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2 content-start">
          {([['live', 'Por ordem (mais recente primeiro)'], ['fast', 'Mais rápidas']] as const).map(([k, label]) => (
            <button key={k} onClick={() => setMode(k)} className={`rounded-full px-3 py-1 text-xs border ${mode === k ? 'bg-white/10 border-white/40' : 'border-gray-700 text-gray-400'}`}>{label}</button>
          ))}
          <span className="text-[10px] text-gray-500 w-full">{s.pitLog.length} paragens · {nDrivers} pilotos</span>
        </div>
        {fastestStop && (
          <div className="ml-auto rounded-xl border border-yellow-400/50 bg-yellow-400/10 px-4 py-3 flex items-center gap-4" style={{ borderLeft: `4px solid ${fastestStop.colour}` }}>
            <div className="relative shrink-0">
              {getDriverPhoto(fastestStop.code)
                ? <Img src={getDriverPhoto(fastestStop.code)} alt={fastestStop.code} className="w-16 h-16 rounded-full object-cover object-top border-2 bg-black/40" />
                : <span className="text-3xl">⚡</span>}
              {fastestStop.team && <Img src={`/logos/teams/${teamKey(fastestStop.team)}.png`} alt={fastestStop.team} className="absolute -bottom-1 -right-2 w-8 h-8 object-contain rounded-full bg-white/90 p-1" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-300">⚡ Pit stop mais rápido do dia</span>
                <Img src="/logos/pirelli.png" alt="Pirelli" className="h-4 object-contain" />
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black tabular-nums leading-none">{fastestStop.stopS === null ? '≈ ' : ''}{(stopOf(fastestStop) as number).toFixed(1)}<span className="text-lg text-gray-300"> s</span></span>
                <span className="text-sm"><b className="text-base">{fastestStop.code}</b>{fastestStop.team ? <span className="text-gray-300"> · {fastestStop.team}</span> : null}</span>
              </div>
              <div className="text-[11px] text-gray-400">volta {fastestStop.lap ?? '—'} · {fastestStop.stopS !== null ? 'tempo oficial parado na box' : 'estimado pela velocidade do carro'}</div>
            </div>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700/60">
              {mode === 'fast' && <th className={`${th} w-8 text-center`}>#</th>}
              <th className={`${th} text-left`}>Piloto</th>
              <th className={`${th} text-center`}>Volta</th>
              <th className={`${th} text-center`}>Pneus</th>
              <th className={`${th} text-right`} title="tempo parado na box, só a troca de pneus (o do prémio DHL de paragem mais rápida)">Troca de pneus</th>
              <th className={`${th} text-right`} title="tempo total da entrada à saída da pit lane">Pit lane</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const v = stopOf(p)
              const top = fastestStop !== null && p === fastestStop
              return (
                <tr key={`${p.code}-${p.at}`} className="border-b border-gray-800/50">
                  {mode === 'fast' && <td className="py-1.5 px-2 text-center tabular-nums text-gray-400">{i + 1}</td>}
                  <td className="py-1.5 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: p.colour }} /><b>{p.code}</b></span></td>
                  <td className="py-1.5 px-2 text-center tabular-nums text-gray-300">{p.lap ?? '—'}</td>
                  <td className="py-1.5 px-2 text-center"><Tyres p={p} /></td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${top ? 'text-purple-400 font-black' : p.stopS !== null ? 'font-bold' : 'text-gray-300'}`} title={p.stopS === null && v !== null ? 'estimado pela velocidade do carro (±0.3 s)' : undefined}>
                    {v === null ? <span className="text-gray-600">{p.estPending ? 'a calcular…' : '—'}</span> : <>{p.stopS === null && <span className="text-gray-500">≈ </span>}{v.toFixed(1)} s</>}
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums text-gray-400">{p.laneS !== null ? `${p.laneS.toFixed(1)} s` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {officialCount < s.pitLog.length && (
        <p className="text-[10px] text-gray-600 mt-2">
          Troca de pneus = tempo parado na box. O OpenF1 só publica o valor oficial depois (por vezes só no fim da corrida): enquanto isso, os valores com ≈ são estimados pela velocidade do carro e podem variar ±0.3 s.
        </p>
      )}
    </div>
  )
}
