'use client'

import { useEffect, useState } from 'react'
import { flagSrc, type StateResponse } from '@/lib/telemetry/shared'
import { windowById } from '@/lib/telemetry/windows'
import type { SectorColour, TelemetryState, TowerRow, RejoinSim } from '@/lib/telemetry/engine'
import { fmtLap, COMPOUND } from '../ui'
import { STATUS, NEUTRAL_BANNER, Tyre, Tower, StintTimeline, RcRow, RejoinCard, SessionClockBox, clock } from '../TelemetryView'
import { SessionResults } from '../SessionResults'
import { TrackMap } from '../TrackMap'
import { TelemetryCompare } from '../TelemetryCompare'
import { PositionChart, OvertakeFeed } from '../PositionChart'
import { LapAnalysis, LapTimesChart } from '../LapAnalysis'
import { Championship } from '../Championship'
import { TrackLimitsPanel } from '../TrackLimits'
import { RadioPanel } from '../RadioPanel'
import { TyreHistory } from '../TyreHistory'
import { RaceSetsTable, RaceSetsLine } from '../RaceSets'
import { PlayBoards } from '../PlayBoards'
import { PitWindowChart, SafetyCarPanel, StintPaceTable } from '../StrategyPanels'

const POLL_MS = 5000
const SECTOR_CLS: Record<NonNullable<SectorColour>, string> = { purple: 'text-purple-400 font-black', green: 'text-green-400 font-bold', yellow: 'text-yellow-300' }

// All the windows of one browser profile share ONE poll: whoever fetches first broadcasts the answer to the others,
// so 10 windows do not mean 10 times the load on the server. Every ~5 s at most one fetch per driver choice.
function useLiveState(drivers: string[]) {
  const key = drivers.join(',')
  const [data, setData] = useState<StateResponse | null>(null)
  const [receivedAt, setReceivedAt] = useState(0)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let stop = false
    let busy = false
    let last = 0
    const ch = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(`f1w:${key}`) : null
    if (ch) {
      ch.onmessage = e => {
        const m = e.data as { j: StateResponse; at: number }
        if (stop || !m || m.at <= last) return
        last = m.at; setData(m.j); setReceivedAt(m.at); setErr(null)
      }
    }
    async function tick() {
      if (busy || Date.now() - last < POLL_MS - 600) return
      busy = true
      try {
        const res = await fetch(`/api/telemetria/state?full=1${key ? `&d=${key}` : ''}`, { cache: 'no-store' })
        const j = await res.json() as StateResponse
        if (stop) return
        const at = Date.now()
        last = at; setData(j); setReceivedAt(at); setErr(res.ok ? null : (j.message ?? `Erro ${res.status}`))
        ch?.postMessage({ j, at })
      } catch { if (!stop) setErr('Sem ligação ao servidor.') }
      busy = false
    }
    tick()
    const id = setInterval(tick, POLL_MS + Math.floor(Math.random() * 500))
    return () => { stop = true; clearInterval(id); ch?.close() }
  }, [key])

  return { data, receivedAt, err }
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-sm text-gray-500 py-6 text-center">{children}</p>
const H = ({ children }: { children: React.ReactNode }) => <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{children}</h3>

// ── new panels (only for the admin windows) ──

// Big tower for a second screen: large type, readable from the sofa.
function BigTower({ s, favCode, featured }: { s: TelemetryState; favCode: string | null; featured: string[] }) {
  return (
    <table className="w-full text-[1.15rem] leading-tight">
      <tbody>
        {s.tower.map(r => {
          const fl = s.fastestLap?.code === r.code
          const hl = r.code === favCode || featured.includes(r.code)
          return (
            <tr key={r.num} className={`border-b border-white/5 ${r.out ? 'opacity-40' : ''} ${hl ? 'bg-yellow-400/10' : ''}`}>
              <td className="py-1.5 px-2 w-9 text-center font-black tabular-nums text-gray-300">{r.pos}</td>
              <td className="py-1.5 px-1">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-6 rounded-sm shrink-0" style={{ background: r.colour }} />
                  <span className="font-black tracking-wide">{r.code}</span>
                  {r.inPit && <span className="text-[10px] font-bold bg-blue-600 px-1 rounded">BOX</span>}
                  {r.out && <span className="text-[10px] font-bold bg-red-700 px-1 rounded">FORA</span>}
                  {fl && <span className="text-purple-400 text-sm">⏱</span>}
                </span>
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-gray-100 font-semibold">{r.out ? '—' : r.gapLabel}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-gray-400">{r.out ? '' : r.intervalLabel}</td>
              <td className="py-1.5 px-2 text-center"><Tyre compound={r.tyre} age={r.tyreAge} /></td>
              <td className="py-1.5 px-2 text-center tabular-nums text-gray-400">{r.stops}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function SectorsTable({ s, focus }: { s: TelemetryState; focus: string[] }) {
  const overall = s.fastestLap?.code
  const rows = s.tower.filter(r => !r.out || r.lastLap !== null)
  return (
    <div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
            <th className="py-2 px-2 w-8">#</th>
            <th className="py-2 px-2 text-left">Piloto</th>
            <th className="py-2 px-2 text-right">Última</th>
            <th className="py-2 px-2 text-right">S1</th>
            <th className="py-2 px-2 text-right">S2</th>
            <th className="py-2 px-2 text-right">S3</th>
            <th className="py-2 px-2 text-right">Melhor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.num} className={`border-b border-gray-800/50 ${r.out ? 'opacity-40' : ''} ${focus.includes(r.code) ? 'bg-white/[0.06]' : ''}`}>
              <td className="py-1 px-2 text-center tabular-nums text-gray-400">{r.pos}</td>
              <td className="py-1 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: r.colour }} /><b>{r.code}</b></span></td>
              <td className={`py-1 px-2 text-right tabular-nums ${overall === r.code && r.lastLap === r.bestLap ? 'text-purple-400 font-black' : ''}`}>{fmtLap(r.lastLap)}</td>
              {[0, 1, 2].map(i => (
                <td key={i} className={`py-1 px-2 text-right tabular-nums ${r.sectorColour[i] ? SECTOR_CLS[r.sectorColour[i] as NonNullable<SectorColour>] : 'text-gray-600'}`}>{r.sectors[i] != null ? (r.sectors[i] as number).toFixed(3) : '—'}</td>
              ))}
              <td className={`py-1 px-2 text-right tabular-nums ${overall === r.code ? 'text-purple-400 font-black' : 'text-gray-300'}`}>{fmtLap(r.bestLap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-600 mt-2"><span className="text-purple-400 font-bold">Roxo</span> melhor da sessão · <span className="text-green-400 font-bold">verde</span> melhor pessoal · <span className="text-yellow-300">amarelo</span> mais lento. Sectores da última volta completa.</p>
    </div>
  )
}

function SpeedTrap({ s }: { s: TelemetryState }) {
  const rows = s.tower.filter(r => r.topSpeed != null).sort((a, b) => (b.topSpeed as number) - (a.topSpeed as number))
  if (rows.length === 0) return <Empty>Ainda sem velocidades máximas.</Empty>
  const top = rows[0].topSpeed as number, low = (rows[rows.length - 1].topSpeed as number)
  return (
    <ul className="space-y-1">
      {rows.map((r, i) => {
        const w = 35 + 65 * (((r.topSpeed as number) - low) / Math.max(top - low, 1))
        return (
          <li key={r.num} className="flex items-center gap-2 text-sm">
            <span className="w-5 text-right text-gray-500 tabular-nums text-xs">{i + 1}</span>
            <span className="w-10 font-black">{r.code}</span>
            <span className="relative flex-1 h-5 rounded bg-white/5 overflow-hidden"><span className="absolute inset-y-0 left-0 rounded" style={{ width: `${w}%`, background: r.colour, opacity: 0.85 }} /></span>
            <span className="w-16 text-right font-bold tabular-nums">{r.topSpeed} <span className="text-[10px] text-gray-500">km/h</span></span>
            <span className="w-12 text-right text-[11px] tabular-nums text-gray-500">{i === 0 ? '' : `-${(top - (r.topSpeed as number))}`}</span>
          </li>
        )
      })}
    </ul>
  )
}

// Positions won/lost since the end of lap 1 (the first lap the engine can place everybody).
function Gains({ s }: { s: TelemetryState }) {
  const rows = s.tower.map(r => {
    const line = s.lapChart.find(l => l.code === r.code)
    const first = line?.pos.find(p => p !== null) ?? null
    return { r, first, gain: first !== null && !r.out ? first - r.pos : null }
  }).filter(x => x.first !== null).sort((a, b) => (b.gain ?? -99) - (a.gain ?? -99))
  if (rows.length === 0) return <Empty>Aparece depois da 1.ª volta.</Empty>
  return (
    <ul className="space-y-1">
      {rows.map(({ r, first, gain }) => (
        <li key={r.num} className="flex items-center gap-2 text-sm">
          <span className="w-1 h-5 rounded-sm" style={{ background: r.colour }} />
          <span className="w-10 font-black">{r.code}</span>
          <span className="text-xs text-gray-500 tabular-nums w-24">P{first} → {r.out ? 'FORA' : `P${r.pos}`}</span>
          <span className={`ml-auto font-black tabular-nums text-lg ${gain === null ? 'text-gray-600' : gain > 0 ? 'text-green-400' : gain < 0 ? 'text-red-400' : 'text-gray-500'}`}>{gain === null ? '—' : gain > 0 ? `▲ ${gain}` : gain < 0 ? `▼ ${-gain}` : '='}</span>
        </li>
      ))}
    </ul>
  )
}

function PitLog({ s }: { s: TelemetryState }) {
  if (s.pitLog.length === 0) return <Empty>Ainda sem paragens.</Empty>
  const best = Math.min(...s.pitLog.map(p => p.stopS ?? Infinity))
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
          <th className="py-2 px-2 text-left">Piloto</th>
          <th className="py-2 px-2 text-center">Volta</th>
          <th className="py-2 px-2 text-center">Pneus</th>
          <th className="py-2 px-2 text-right">Parado</th>
          <th className="py-2 px-2 text-right">Pit lane</th>
        </tr>
      </thead>
      <tbody>
        {s.pitLog.map((p, i) => {
          const a = p.from ? COMPOUND[p.from] : null, b = p.to ? COMPOUND[p.to] : null
          const fastest = p.stopS !== null && p.stopS === best
          return (
            <tr key={i} className="border-b border-gray-800/50">
              <td className="py-1.5 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: p.colour }} /><b>{p.code}</b></span></td>
              <td className="py-1.5 px-2 text-center tabular-nums text-gray-300">{p.lap ?? '—'}</td>
              <td className="py-1.5 px-2 text-center">
                <span className="inline-flex items-center gap-1 text-xs font-black">
                  <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] ${a?.cls ?? 'border-gray-600 text-gray-500'}`}>{a?.letter ?? '?'}</span>
                  <span className="text-gray-500">→</span>
                  <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] ${b?.cls ?? 'border-gray-600 text-gray-500'}`}>{b?.letter ?? '?'}</span>
                </span>
              </td>
              <td className={`py-1.5 px-2 text-right tabular-nums font-bold ${fastest ? 'text-purple-400' : ''}`}>{p.stopS !== null ? `${p.stopS.toFixed(1)} s` : '—'}</td>
              <td className="py-1.5 px-2 text-right tabular-nums text-gray-400">{p.laneS !== null ? `${p.laneS.toFixed(1)} s` : '—'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const PW_LABEL: Record<string, string> = { 'sem-dados': 'sem histórico', cedo: 'ainda cedo', janela: 'JANELA ABERTA', tarde: 'ATRASADO', 'sem-mais': 'sem mais paragens', 'na-box': 'NA BOX' }

function DriverCard({ s, code, data }: { s: TelemetryState; code: string | null; data: StateResponse }) {
  const r: TowerRow | undefined = s.tower.find(x => x.code === code)
  if (!r) return <Empty>Escolhe um piloto no painel de janelas (ex.: VER).</Empty>
  const pace = s.racePace.find(x => x.code === r.code)
  const pw = s.pitWindows.find(x => x.code === r.code)
  const sim: RejoinSim | undefined = s.rejoin.find(x => x.code === r.code)
  const tl = s.trackLimits.find(x => x.code === r.code)
  const mine = s.penalties.filter(p => p.code === r.code)
  const play = data.play?.me
  const ahead = s.tower.find(x => x.pos === r.pos - 1), behind = s.tower.find(x => x.pos === r.pos + 1)
  const Cell = ({ k, v, tone }: { k: string; v: React.ReactNode; tone?: string }) => <div className="bg-black/30 rounded-lg px-3 py-2"><div className="text-[10px] uppercase tracking-wide text-gray-500">{k}</div><div className={`text-lg font-black tabular-nums ${tone ?? ''}`}>{v}</div></div>
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3" style={{ borderLeft: `6px solid ${r.colour}`, paddingLeft: 12 }}>
        <div>
          <div className="text-4xl font-black leading-none">{r.code}</div>
          <div className="text-sm text-gray-400">{r.name} · {r.team}</div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-5xl font-black text-yellow-300 leading-none">{r.out ? 'FORA' : `P${r.pos}`}</div>
          {r.inPit && <span className="text-[10px] font-bold bg-blue-600 px-1.5 py-0.5 rounded">NA BOX</span>}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Cell k="Líder" v={r.gapLabel} />
        <Cell k="Intervalo" v={r.intervalLabel} />
        <Cell k="Volta" v={r.lap} />
        <Cell k="Pneu" v={<Tyre compound={r.tyre} age={r.tyreAge} />} />
        <Cell k="Paragens" v={r.stops} />
        <Cell k="Vel. máx." v={r.topSpeed ? `${r.topSpeed}` : '—'} />
        <Cell k="Última" v={fmtLap(r.lastLap)} tone={s.fastestLap?.code === r.code && r.lastLap === r.bestLap ? 'text-purple-400' : ''} />
        <Cell k="Melhor" v={fmtLap(r.bestLap)} tone={s.fastestLap?.code === r.code ? 'text-purple-400' : ''} />
        <Cell k="Degradação" v={r.degPerLap === null ? '—' : `${(r.degPerLap + 0.035).toFixed(2)} s/v`} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-black/30 rounded-lg px-3 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">S{i + 1}</div>
            <div className={`text-base tabular-nums ${r.sectorColour[i] ? SECTOR_CLS[r.sectorColour[i] as NonNullable<SectorColour>] : 'text-gray-500'}`}>{r.sectors[i] != null ? (r.sectors[i] as number).toFixed(3) : '—'}</div>
          </div>
        ))}
      </div>
      {s.kind === 'race' && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-black/30 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">À frente</div>
            {ahead ? <div><b>{ahead.code}</b> <span className="tabular-nums text-gray-300">{r.intervalLabel}</span></div> : <div className="text-gray-500">líder</div>}
          </div>
          <div className="bg-black/30 rounded-lg px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-gray-500">Atrás</div>
            {behind ? <div><b>{behind.code}</b> <span className="tabular-nums text-gray-300">{behind.intervalLabel}</span></div> : <div className="text-gray-500">último</div>}
          </div>
        </div>
      )}
      <RaceSetsLine sets={data.scene?.race_sets} t={r} race={s.kind === 'race'} />
      {s.kind === 'race' && pw && (
        <div className="bg-black/30 rounded-lg px-3 py-2 text-sm">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Janela de paragem</div>
          <b>{PW_LABEL[pw.status]}</b>
          {pw.windowFrom !== null && <span className="text-gray-300"> · voltas {pw.windowFrom}–{pw.windowTo}</span>}
          {pw.expected !== null && <span className="text-gray-500"> · {pw.stops}/{pw.expected} paragens</span>}
        </div>
      )}
      {s.kind === 'race' && sim && (
        <div className="bg-black/30 rounded-lg px-3 py-2 text-sm">
          <div className="text-[10px] uppercase tracking-wide text-gray-500">Se parasse agora</div>
          <b>P{sim.toPos}</b> <span className="text-gray-300">(perde ~{sim.lossS.toFixed(0)} s{sim.carAheadCode ? `, atrás de ${sim.carAheadCode}` : ''}) · {sim.cleanAir ? 'ar limpo' : 'apanha tráfego'}</span>
        </div>
      )}
      {pace && pace.laps.length > 0 && (
        <div className="bg-black/30 rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Últimas voltas</div>
          <div className="flex gap-1.5 flex-wrap text-xs tabular-nums">
            {pace.laps.map(l => (
              <span key={l.lap} className="rounded bg-white/5 px-1.5 py-1 text-center">
                <span className="block text-[9px] text-gray-500">V{l.lap}{l.flag ? ` · ${l.flag}` : ''}</span>
                <b>{fmtLap(l.t)}</b>
                {l.delta !== null && <span className={`block text-[10px] ${l.delta > 0 ? 'text-red-400' : 'text-green-400'}`}>{l.delta > 0 ? '+' : ''}{l.delta.toFixed(2)}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {r.stints.map((st, i) => {
          const c = st.compound ? COMPOUND[st.compound] : null
          const end = st.lapEnd ?? Math.max(r.lap, st.lapStart)
          return <span key={i} className="text-[11px] font-black text-black/80 rounded px-2 py-0.5" style={{ background: c?.bar ?? '#555' }}>{c?.letter ?? '?'} · V{st.lapStart}–{end}</span>
        })}
      </div>
      {(tl && tl.count > 0) && <div className="text-xs text-yellow-300">🚧 Track limits: {tl.count} infracções · {tl.status}{tl.penaltySecs ? ` · +${tl.penaltySecs}s` : ''}</div>}
      {mine.length > 0 && <ul className="text-xs text-orange-300 space-y-0.5">{mine.map((p, i) => <li key={i}>⚖️ {p.message.replace(/ \(\d{1,2}:\d{2}:\d{2}\)$/, '')}</li>)}</ul>}
      {play && <div className="text-xs text-gray-300">🎮 Os teus pontos F1 Play: <b className="text-yellow-300">{play.total}</b>{play.rank ? ` (#${play.rank})` : ''}</div>}
    </div>
  )
}

function Weather({ s }: { s: TelemetryState }) {
  const w = s.weather
  if (!w) return <Empty>Sem dados de meteorologia.</Empty>
  const Cell = ({ k, v, sub, tone }: { k: string; v: string; sub?: string; tone?: string }) => <div className={`rounded-xl px-4 py-3 ${tone ?? 'bg-black/30'}`}><div className="text-[10px] uppercase tracking-wide text-gray-400">{k}</div><div className="text-3xl font-black tabular-nums">{v}</div>{sub && <div className="text-xs text-gray-400">{sub}</div>}</div>
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <Cell k="🌡️ Ar" v={`${w.air.toFixed(0)}°`} />
      <Cell k="🛣️ Pista" v={`${w.track.toFixed(0)}°`} sub={w.trackTrend ? `${w.trackTrend > 0 ? '↗' : '↘'} ${Math.abs(w.trackTrend)}° / 10 min` : 'estável'} />
      <Cell k="💧 Humidade" v={`${w.humidity.toFixed(0)}%`} />
      <Cell k="💨 Vento" v={`${w.wind.toFixed(1)} m/s`} sub={`${Math.round(w.windDir)}°`} />
      <Cell k="Chuva" v={w.rain ? '🌧️ SIM' : '☀️ NÃO'} tone={w.rain ? 'bg-blue-700' : 'bg-black/30'} />
    </div>
  )
}

function AlertScreen({ s, session }: { s: TelemetryState; session: string }) {
  const map: Partial<Record<typeof s.status, { bg: string; fg: string; icon: string; pulse?: boolean }>> = {
    RED: { bg: '#dc2626', fg: '#fff', icon: '🚨', pulse: true },
    SC: { bg: '#f97316', fg: '#111', icon: '🚗', pulse: true },
    SC_ENDING: { bg: '#fb923c', fg: '#111', icon: '🚗', pulse: true },
    VSC: { bg: '#facc15', fg: '#111', icon: '🟡', pulse: true },
    VSC_ENDING: { bg: '#fde047', fg: '#111', icon: '🟡', pulse: true },
    FINISHED: { bg: '#f5f5f5', fg: '#111', icon: '🏁' },
    GREEN: { bg: '#052e16', fg: '#86efac', icon: '🟢' },
    NOT_STARTED: { bg: '#1f2937', fg: '#d1d5db', icon: '⏳' },
  }
  const m = map[s.status] ?? map.NOT_STARTED!
  const yellow = s.yellowSectors.length > 0 && s.status === 'GREEN'
  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center text-center px-6 ${m.pulse ? 'animate-pulse' : ''}`} style={{ background: yellow ? '#713f12' : m.bg, color: yellow ? '#fde047' : m.fg }}>
      <div className="text-[18vmin] leading-none">{yellow ? '🟡' : m.icon}</div>
      <div className="font-black tracking-wide leading-tight" style={{ fontSize: 'min(9vw, 14vh)' }}>{yellow ? 'AMARELA' : STATUS[s.status].label}</div>
      {yellow && <div className="font-bold text-[5vmin]">Sector {s.yellowSectors.join(', ')}</div>}
      <div className="mt-[3vmin] font-semibold opacity-80" style={{ fontSize: 'min(3.2vw, 5vh)' }}>{session}{s.kind === 'race' ? ` · VOLTA ${s.leaderLap}${s.totalLaps ? `/${s.totalLaps}` : ''}` : ''}</div>
    </div>
  )
}

function StateWindow({ data, receivedAt }: { data: StateResponse; receivedAt: number }) {
  const s = data.state!, scene = data.scene!, session = data.session!, gp = data.gp
  const st = STATUS[s.status]
  const banner = NEUTRAL_BANNER[s.status]
  return (
    <div className="space-y-3">
      {banner && (
        <div className={`rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 animate-pulse ${banner.cls}`}>
          <span className="text-3xl leading-none">{banner.icon}</span>
          <span className="text-3xl font-black tracking-wide leading-none">{st.label}</span>
          <span className="text-sm font-semibold opacity-90">{banner.text}</span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xl font-black px-4 py-1 rounded-full ${scene.mode === 'live' ? 'bg-red-600 animate-pulse' : 'bg-gray-700'}`}>{scene.mode === 'live' ? '● AO VIVO' : `↺ REPLAY${scene.replay_playing ? ` ${scene.replay_speed}×` : ' · PAUSA'}`}</span>
            <span className={`text-xl font-black px-4 py-1 rounded-full ${st.cls}`}>{st.label}</span>
            {s.kind === 'race' && <span className="text-xl font-black tabular-nums bg-black/40 rounded-xl px-4 py-1">VOLTA {s.leaderLap}{s.totalLaps ? `/${s.totalLaps}` : ''}</span>}
            <span className="text-xs text-gray-500 tabular-nums">{clock(s.t)}</span>
          </div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">{session.country}</div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            {flagSrc(gp?.emoji) && <img src={flagSrc(gp?.emoji)!} alt="" className="w-8 h-5 rounded-[3px] object-cover ring-1 ring-white/15" />}
            {gp ? `GP ${gp.nome} · ` : ''}{session.name}
          </h1>
        </div>
        {s.kind !== 'race' && <div className="ml-auto"><SessionClockBox data={data} receivedAt={receivedAt} sessionName={session.name} /></div>}
      </div>
      {scene.banner && <div className="rounded-xl border-2 border-yellow-400/70 bg-yellow-400/10 px-4 py-2 text-yellow-100 font-semibold">📣 {scene.banner}</div>}
      {s.yellowSectors.length > 0 && <div className="text-sm font-bold text-yellow-300">🟡 Amarela nos sectores: {s.yellowSectors.join(', ')}</div>}
    </div>
  )
}

function PlayWindow({ data }: { data: StateResponse }) {
  const play = data.play
  if (!play) return <Empty>Esta transmissão ainda não está ligada a um GP.</Empty>
  return (
    <div className="space-y-4">
      {play.closed && play.leaderboard.length > 0 && <PlayBoards play={play} gpName={data.gp?.nome ?? null} />}
      {!play.me ? <Empty>Não submeteste previsões neste GP.</Empty> : (
        <div>
          <div className="flex items-end gap-3">
            <span className="text-6xl font-black text-yellow-300 tabular-nums">{play.me.total}</span>
            <span className="text-sm text-gray-400 pb-2">pts{play.me.rank ? ` · #${play.me.rank} de ${play.participants}` : ''} · provisórios</span>
          </div>
          <ul className="mt-3 divide-y divide-gray-800/60">
            {play.me.lines.map(l => (
              <li key={l.field} className="flex items-center gap-2 py-1 text-xs">
                <span className="w-40 text-gray-400 leading-tight">{l.label}</span>
                <span className="w-24 font-bold text-gray-200 truncate">{l.mine ?? '—'}</span>
                <span className="w-24 text-gray-500 truncate">{l.live ?? (l.field === 'p10_dotd' ? 'voto oficial' : '—')}</span>
                <span className={`ml-auto font-black ${l.pts > 0 ? 'text-green-400' : 'text-gray-600'}`}>{l.pts > 0 ? `+${l.pts}` : '·'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Body({ id, data, receivedAt, drivers }: { id: string; data: StateResponse; receivedAt: number; drivers: string[] }) {
  const s = data.state!, scene = data.scene!, session = data.session!
  const favCode = data.favCode ?? null
  const featured = scene.featured
  const focus = drivers.length ? drivers : Array.from(new Set([...(favCode ? [favCode] : []), ...featured]))
  const rejoinCodes = drivers.length ? drivers : Array.from(new Set([...(favCode ? [favCode] : []), ...featured]))
  const rejoinList = (rejoinCodes.length ? rejoinCodes : s.tower.filter(r => !r.out).slice(0, 8).map(r => r.code)).map(c => s.rejoin.find(x => x.code === c)).filter((x): x is RejoinSim => !!x)

  switch (id) {
    case 'estado': return <StateWindow data={data} receivedAt={receivedAt} />
    case 'alerta': return <AlertScreen s={s} session={`${data.gp ? `GP ${data.gp.nome} · ` : ''}${session.name}`} />
    case 'direccao': return (
      <div>
        <div className="mb-2 text-xs text-gray-400">SC {s.events.sc} · VSC {s.events.vsc} · Bandeira vermelha {s.events.red}{s.deletedLaps ? ` · ⏱ ${s.deletedLaps} tempos anulados` : ''}</div>
        {s.yellowSectors.length > 0 && <div className="mb-2 text-xs font-bold text-yellow-300">🟡 Amarela nos sectores: {s.yellowSectors.join(', ')}</div>}
        {s.raceControl.length === 0 ? <Empty>Sem mensagens ainda.</Empty> : <ul>{s.raceControl.map((r, i) => <RcRow key={i} r={r} />)}</ul>}
      </div>
    )
    case 'penalizacoes': return s.penalties.length === 0 ? <Empty>Nenhuma penalização até agora.</Empty> : <ul>{s.penalties.map((r, i) => <RcRow key={i} r={r} />)}</ul>
    case 'meteo': return <Weather s={s} />
    case 'radio': return <RadioPanel isAdmin />
    case 'torre': return s.results ? <SessionResults data={s.results} favCode={favCode} featured={featured} /> : <BigTower s={s} favCode={favCode} featured={featured} />
    case 'tabela': return s.results ? <SessionResults data={s.results} favCode={favCode} featured={featured} /> : <Tower s={s} favCode={favCode} featured={featured} />
    case 'sectores': return <SectorsTable s={s} focus={focus} />
    case 'velocidades': return <SpeedTrap s={s} />
    case 'ganhos': return <Gains s={s} />
    case 'campeonato': return s.championship ? <Championship data={s.championship} favCode={favCode} featured={featured} /> : <Empty>O campeonato em directo só existe em corridas e sprints.</Empty>
    case 'play': return <PlayWindow data={data} />
    case 'janela-box': return <PitWindowChart s={s} />
    case 'stints': return <StintTimeline s={s} />
    case 'undercut': return (
      <div className="space-y-4">
        <div className="rounded-xl bg-black/30 p-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Perda numa paragem</div>
          <div className="text-4xl font-black text-yellow-300">{s.pitLoss.nowS.toFixed(1)} s</div>
          <div className="text-[11px] text-gray-400">
            {s.pitLoss.source === 'medida' ? `mediana de ${s.pitLoss.samples} paragens desta corrida (${s.pitLoss.greenS.toFixed(1)} s em pista livre)` : 'estimativa — ainda sem paragens medidas'}
            {s.pitLoss.nowS !== s.pitLoss.greenS && ' · reduzida pelo VSC/SC'}
          </div>
        </div>
        <div>
          <H>Janela de undercut</H>
          {s.undercuts.length === 0 ? <p className="text-sm text-gray-500">Sem janelas abertas neste momento.</p> : (
            <ul className="space-y-1.5">
              {s.undercuts.map((u, i) => (
                <li key={i} className="text-sm flex items-center gap-2">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${u.strength === 'forte' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>{u.strength.toUpperCase()}</span>
                  <span><b>{u.attacker}</b> sobre <b>{u.target}</b> · {u.intervalS.toFixed(1)} s · pneus {u.attackerAge}v vs {u.targetAge}v</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    )
    case 'safety-car': return <SafetyCarPanel s={s} />
    case 'ritmo-stint': return <StintPaceTable s={s} />
    case 'se-parasse': return rejoinList.length === 0 ? <Empty>Sem simulação (só em corrida).</Empty> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{rejoinList.map(r => <RejoinCard key={r.code} sim={r} row={s.tower.find(t => t.code === r.code)} />)}</div>
    case 'boxes': return <PitLog s={s} />
    case 'ritmo': return <LapAnalysis s={s} focus={focus} />
    case 'tempos-volta': return <LapTimesChart s={s} focus={drivers} showEmpty />
    case 'sets-corrida': return <RaceSetsTable sets={scene.race_sets} s={s} favCode={favCode} featured={focus} />
    case 'pneus-fds': return <div className="space-y-5">{scene.race_sets && <RaceSetsTable sets={scene.race_sets} s={s} favCode={favCode} featured={focus} />}<TyreHistory data={data.tyreHistory ?? null} allocation={scene.tyre_allocation} /></div>
    case 'mapa': return <TrackMap outline={data.outline} corners={data.corners} pitLane={data.pitLane} cars={s.map} favCode={favCode} featured={focus} fill />
    case 'posicoes': return <PositionChart lines={s.lapChart} highlight={focus} totalLaps={s.totalLaps} leaderLap={s.leaderLap} />
    case 'ultrapassagens': return <OvertakeFeed items={s.overtakes} />
    case 'limites': return <TrackLimitsPanel s={s} />
    case 'comparar': return data.compare ? <TelemetryCompare data={data.compare} /> : <Empty>{drivers.length < 2 ? 'Escolhe 2 pilotos no painel de janelas.' : 'Ainda não há voltas completas destes pilotos.'}</Empty>
    case 'ficha': return <DriverCard s={s} code={drivers[0] ?? favCode ?? s.tower[0]?.code ?? null} data={data} />
    default: return <Empty>Janela desconhecida: {id}</Empty>
  }
}

export default function WindowView({ id, drivers, zoom, header, bg }: { id: string; drivers: string[]; zoom: number; header: boolean; bg: 'dark' | 'black' }) {
  const def = windowById(id)
  const { data, receivedAt, err } = useLiveState(drivers)

  // the launcher script finds the window by this exact title prefix
  useEffect(() => { document.title = `F1W-${id}|${def?.title ?? id}` }, [id, def])

  const ready = !!(data?.ready && data.state && data.scene && data.session)
  const alert = id === 'alerta' && ready
  return (
    <div className="min-h-screen" style={{ background: alert ? undefined : bg === 'black' ? '#000' : '#0c0c12', zoom }}>
      {!alert && header && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/10 text-[11px]">
          <span>{def?.icon}</span>
          <b className="uppercase tracking-widest text-yellow-400">{def?.title ?? id}</b>
          {ready && <span className="text-gray-500 truncate">{data!.gp ? `GP ${data!.gp.nome} · ` : ''}{data!.session!.name}</span>}
          <span className="ml-auto flex items-center gap-1.5 text-gray-500">
            <span className={`w-2 h-2 rounded-full ${err ? 'bg-orange-500' : data?.scene?.mode === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
            {err ? 'sem ligação' : data?.scene?.mode === 'live' ? 'AO VIVO' : 'replay'}
          </span>
        </div>
      )}
      <div className={alert ? '' : 'p-3'}>
        {!data ? <Empty>A ligar à telemetria…</Empty>
          : !ready ? <Empty>{data.message ?? err ?? 'Telemetria indisponível.'}</Empty>
          : <Body id={id} data={data} receivedAt={receivedAt} drivers={drivers} />}
        {!alert && err && ready && <p className="mt-2 text-[11px] text-orange-300">⚠️ {err} — a mostrar os últimos dados.</p>}
      </div>
    </div>
  )
}
