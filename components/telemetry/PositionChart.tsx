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

// Tyre delta = difference in tyre age (laps); offset = compound step (softer = faster, but wears out sooner). Positive = the overtaker has the advantage.
function TyreDuel({ o }: { o: OvertakeItem }) {
  const a = o.byTyre, b = o.overTyre
  if (!a.compound || !b.compound) return null
  const ca = COMPOUND[a.compound], cb = COMPOUND[b.compound]
  const delta = a.age !== null && b.age !== null ? b.age - a.age : null   // + = the overtaken car has older tyres
  const step = (SOFTNESS[a.compound] ?? 0) - (SOFTNESS[b.compound] ?? 0)   // + = the overtaker is on the softer tyre
  const chip = (t: typeof a, c: typeof ca) => (
    <span className="inline-flex items-center gap-0.5">
      <span className={`inline-flex w-4 h-4 rounded-full border-2 items-center justify-center text-[8px] font-black ${c?.cls ?? ''}`}>{c?.letter ?? '?'}</span>
      <span className="text-[10px] text-gray-400 tabular-nums">{t.age ?? ''}</span>
    </span>
  )
  return (
    <span className="ml-auto flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-[10px]">
      {chip(a, ca)}<span className="text-gray-600">vs</span>{chip(b, cb)}
      {delta !== null && <span className={`font-bold tabular-nums ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-400'}`} title="Diferença de idade dos pneus (voltas). Positivo: o ultrapassado tinha pneus mais gastos">Δ idade {delta > 0 ? '+' : ''}{delta}v</span>}
      <span className={`font-bold ${step > 0 ? 'text-green-400' : step < 0 ? 'text-red-400' : 'text-gray-400'}`} title="Diferença de composto: mais macio = mais rápido mas gasta mais">{step === 0 ? 'mesmo composto' : step > 0 ? `offset +${step} (mais macio)` : `offset ${step} (mais duro)`}</span>
    </span>
  )
}

export function OvertakeFeed({ items }: { items: OvertakeItem[] }) {
  if (items.length === 0) return <p className="text-xs text-gray-500">Sem ultrapassagens registadas ainda.</p>
  return (
    <ul>
      {items.map((o, i) => (
        <li key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-800/50 text-xs">
          <span className="text-gray-500 tabular-nums w-[88px] shrink-0">{o.lap ? `V${o.lap} · ` : ''}{clock(o.date)}</span>
          <span className="shrink-0"><b>{o.by}</b> passa <b>{o.over}</b></span>
          <TyreDuel o={o} />
          <span className="text-gray-400 w-6 text-right shrink-0">P{o.pos}</span>
        </li>
      ))}
      <li className="text-[10px] text-gray-600 pt-1.5">O OpenF1 avisa que esta lista pode estar incompleta. Pneus de cada um no momento da manobra: <b className="text-gray-400">Δ idade</b> = voltas de diferença (verde: o ultrapassado tinha pneus mais gastos); <b className="text-gray-400">offset</b> = degraus de composto (verde: quem passa tinha o pneu mais macio).</li>
    </ul>
  )
}
