import type { PositionLine, OvertakeItem } from '@/lib/telemetry/engine'
import { LineChart, type Series } from './charts'
import { COMPOUND } from './ui'

const clock = (iso: string) => new Date(iso).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

export function PositionChart({ lines, highlight, totalLaps, leaderLap }: { lines: PositionLine[]; highlight: string[]; totalLaps: number | null; leaderLap: number }) {
  if (lines.length === 0 || leaderLap < 2) return <p className="text-sm text-gray-500">O gráfico aparece a partir da 2ª volta.</p>
  const n = lines.length
  const xMax = Math.max(leaderLap, 2)
  const hl = new Set(highlight)
  const seen = new Map<string, number>()
  const series: Series[] = lines.map(l => {
    const k = (seen.get(l.colour) ?? 0) + 1
    seen.set(l.colour, k)
    const on = hl.has(l.code)
    return { key: l.code, color: l.colour, x: l.pos.map((_, i) => i + 1), y: l.pos, width: on ? 3 : 1.4, opacity: on || hl.size === 0 ? 1 : 0.45, dash: k > 1 ? '4 3' : undefined, step: false }
  })
  const ticks = [1, 5, 10, 15, 20].filter(t => t <= n)
  const xt = Array.from({ length: Math.floor(xMax / 10) + 1 }, (_, i) => i * 10).filter(v => v >= 1).concat(1)
  return (
    <div>
      <LineChart series={series} xMin={1} xMax={xMax} yMin={1} yMax={n} invertY height={Math.max(220, n * 15)} yTicks={ticks} xTicks={xt} endLabels={lines.map(l => ({ key: l.code, text: l.code }))} />
      <p className="text-[11px] text-gray-600 mt-1">Posição no início de cada volta{totalLaps ? ` (de ${totalLaps})` : ''}. Realçados: o teu piloto e os destacados pelo admin.</p>
    </div>
  )
}

const SOFTNESS: Record<string, number> = { SOFT: 3, MEDIUM: 2, HARD: 1, INTERMEDIATE: 0, WET: -1 }

// One driver of the move: arrow, team colour, code and the tyre he was on (compound + age in laps)
function Side({ up, code, colour, tyre }: { up: boolean; code: string; colour: string; tyre: OvertakeItem['byTyre'] }) {
  const c = tyre.compound ? COMPOUND[tyre.compound] : null
  return (
    <div className="flex items-center gap-2 leading-none">
      <span className={`w-3 text-[10px] ${up ? 'text-green-400' : 'text-red-400'}`}>{up ? '▲' : '▼'}</span>
      <span className="w-1 h-4 rounded-sm shrink-0" style={{ background: colour }} />
      <b className={`w-9 text-sm ${up ? 'text-white' : 'text-gray-300'}`}>{code}</b>
      {c ? <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[9px] font-black shrink-0 ${c.cls}`}>{c.letter}</span> : <span className="w-5 text-gray-600">—</span>}
      <span className="text-xs tabular-nums text-gray-300 whitespace-nowrap">{tyre.age !== null ? `${tyre.age} voltas` : ''}</span>
    </div>
  )
}

// What the tyres say about the move, in two short pills: compound (softer = faster but wears out sooner) and age (younger tyres = fresher)
function Verdict({ o }: { o: OvertakeItem }) {
  const a = o.byTyre, b = o.overTyre
  const step = a.compound && b.compound ? (SOFTNESS[a.compound] ?? 0) - (SOFTNESS[b.compound] ?? 0) : null
  const age = a.age !== null && b.age !== null ? b.age - a.age : null   // + = the overtaker has the fresher tyres
  const pill = (txt: string, tone: 'good' | 'bad' | 'even') => (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap ${tone === 'good' ? 'bg-green-500/20 text-green-300' : tone === 'bad' ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-gray-300'}`}>{txt}</span>
  )
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      {step !== null && (step === 0 ? pill('mesmo composto', 'even') : step > 0 ? pill('pneu mais macio', 'good') : pill('pneu mais duro', 'bad'))}
      {age !== null && (age === 0 ? pill('idade igual', 'even') : age > 0 ? pill(`${age}v mais novo`, 'good') : pill(`${-age}v mais velho`, 'bad'))}
    </div>
  )
}

export function OvertakeFeed({ items }: { items: OvertakeItem[] }) {
  if (items.length === 0) return <p className="text-xs text-gray-500">Sem ultrapassagens registadas ainda.</p>
  return (
    <div>
      <ul className="space-y-1.5">
        {items.map((o, i) => (
          <li key={i} className="flex items-center gap-3 rounded-lg bg-black/20 px-2.5 py-2">
            <div className="w-[52px] shrink-0 text-center leading-tight">
              <div className="text-sm font-black text-gray-100 tabular-nums">P{o.pos}</div>
              <div className="text-[10px] text-gray-500 tabular-nums">{o.lap ? `V${o.lap}` : ''}</div>
              <div className="text-[9px] text-gray-600 tabular-nums">{clock(o.date)}</div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <Side up code={o.by} colour={o.byColour} tyre={o.byTyre} />
              <Side up={false} code={o.over} colour={o.overColour} tyre={o.overTyre} />
            </div>
            <Verdict o={o} />
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-gray-600 pt-2">▲ quem passou · ▼ quem foi passado, cada um com o pneu e as voltas que tinha na altura. <span className="text-green-400">Verde</span> = vantagem de pneus para quem passou. O OpenF1 avisa que esta lista pode estar incompleta.</p>
    </div>
  )
}
