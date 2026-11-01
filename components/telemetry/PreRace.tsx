'use client'

import { useEffect, useState } from 'react'
import { flagSrc, type StateResponse } from '@/lib/telemetry/shared'
import { Section, fmtLap } from './ui'
import { RaceSetsTable } from './RaceSets'
import type { ResultRow } from '@/lib/telemetry/engine'

const hhmm = (ms: number) => new Date(ms).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })

function fmtCountdown(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Last qualifying phase the driver reached (Q1/Q2/Q3)
const phaseOf = (r: ResultRow): string => {
  const last = r.phaseTimes.reduce<number>((acc, v, i) => (v !== null ? i : acc), -1)
  return last >= 0 ? `Q${last + 1}` : ''
}

function GridRow({ r, mine }: { r: ResultRow; mine: boolean }) {
  return (
    <tr className={`border-b border-gray-800/50 ${mine ? 'bg-yellow-400/10' : ''}`}>
      <td className="py-1.5 px-2 text-center font-black tabular-nums text-gray-300 w-9">{r.pos}</td>
      <td className="py-1.5 px-2">
        <span className="inline-flex items-center gap-2">
          <span className="w-1 h-5 rounded-sm shrink-0" style={{ background: r.colour }} />
          <span className="font-black tracking-wide">{r.code}</span>
          <span className="text-xs text-gray-500 hidden sm:inline">{r.name.split(' ').slice(-1)[0]}</span>
          {mine && <span className="text-[9px] font-bold text-yellow-300">★ TEU</span>}
        </span>
      </td>
      <td className="py-1.5 px-2 text-right tabular-nums text-gray-300">{fmtLap(r.best)}</td>
      <td className="py-1.5 px-2 text-right text-[10px] text-gray-500">{phaseOf(r)}</td>
    </tr>
  )
}

// What the page shows from 3 h before the race: the finished session is gone, only the start grid and the new tyre sets stay.
export function PreRace({ data, receivedAt, err }: { data: StateResponse; receivedAt: number; err: string | null }) {
  const [, force] = useState(0)
  useEffect(() => { const id = setInterval(() => force(n => n + 1), 1000); return () => clearInterval(id) }, [])

  const pre = data.preRace!
  const s = data.state!, scene = data.scene!, session = data.session!, gp = data.gp
  const nowSrv = Date.now() + ((data.serverNow ?? receivedAt) - receivedAt)   // the server's clock, not the viewer's
  const left = pre.startMs - nowSrv
  const grid = (s.results?.rows ?? []).slice().sort((a, b) => a.pos - b.pos)
  const half = Math.ceil(grid.length / 2)
  const favCode = data.favCode ?? null

  return (
    <div className="space-y-4">
      {err && <div className="text-xs text-orange-300 bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2">⚠️ {err} — a mostrar os últimos dados recebidos.</div>}

      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[22px] font-black px-5 py-1.5 rounded-full bg-amber-500 text-black">PRÉ-CORRIDA</span>
              <span className="text-xs text-gray-500">a corrida começa às {hhmm(pre.startMs)}</span>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">{session.country}</div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              {flagSrc(gp?.emoji) && <img src={flagSrc(gp?.emoji)!} alt="" className="w-8 h-5 rounded-[3px] object-cover ring-1 ring-white/15" />}
              {gp ? `GP ${gp.nome} · ` : ''}Corrida
            </h1>
          </div>
          <div className="ml-auto rounded-2xl bg-red-950 border border-red-600/60 px-5 py-3 text-white">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-80">{left > 0 ? 'Luzes apagam-se em' : 'A começar'}</div>
            <div className="text-5xl font-black tabular-nums leading-none tracking-tight mt-1">{fmtCountdown(left)}</div>
          </div>
        </div>
        {s.weather && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-300">
            <span className="bg-black/30 rounded-md px-2 py-1">🌡️ Ar {s.weather.air.toFixed(0)}°</span>
            <span className="bg-black/30 rounded-md px-2 py-1">🛣️ Pista {s.weather.track.toFixed(0)}°</span>
            <span className="bg-black/30 rounded-md px-2 py-1">💧 {s.weather.humidity.toFixed(0)}%</span>
            <span className="bg-black/30 rounded-md px-2 py-1">💨 {s.weather.wind.toFixed(1)} m/s</span>
            <span className={`rounded-md px-2 py-1 ${s.weather.rain ? 'bg-blue-700 text-white font-bold' : 'bg-black/30'}`}>{s.weather.rain ? '🌧️ A CHOVER' : '☀️ Sem chuva'}</span>
          </div>
        )}
      </div>

      {scene.banner && <div className="rounded-xl border-2 border-yellow-400/70 bg-yellow-400/10 px-4 py-3 text-yellow-100 font-semibold">📣 {scene.banner}</div>}

      <Section title="Grelha de partida" hint="pela classificação da qualificação · penalizações podem alterar a ordem">
        {pre.gridImage && <img src={pre.gridImage} alt="Grelha de partida" className="w-full max-w-2xl mx-auto rounded-xl mb-4" />}
        {grid.length === 0 ? <p className="text-sm text-gray-500">A grelha aparece quando a qualificação estiver classificada.</p> : (
          <div className="grid gap-x-6 md:grid-cols-2">
            {[grid.slice(0, half), grid.slice(half)].map((part, i) => (
              <table key={i} className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
                    <th className="py-2 px-2 w-9">#</th><th className="py-2 px-2 text-left">Piloto</th><th className="py-2 px-2 text-right">Melhor tempo</th><th className="py-2 px-2" />
                  </tr>
                </thead>
                <tbody>{part.map(r => <GridRow key={r.num} r={r} mine={r.code === favCode} />)}</tbody>
              </table>
            ))}
          </div>
        )}
      </Section>

      <Section title="Pneus novos disponíveis para a corrida" hint="só os sets novos · folha da Pirelli">
        <RaceSetsTable sets={scene.race_sets} s={s} favCode={favCode} featured={scene.featured} />
      </Section>

      <p className="text-[10px] text-gray-600 text-center">Esta página muda sozinha para a transmissão ao vivo quando a corrida começar · Dados: OpenF1 (openf1.org) · projecto não-oficial, sem ligação à Formula 1</p>
    </div>
  )
}
