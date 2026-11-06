import type { WeatherInfo } from '@/lib/telemetry/engine'
import { LineChart, type Series } from './charts'

// Temperature change over the last 10 min as a pill: rising (red ▲), falling (blue ▼) or steady.
export function TrendBadge({ delta, big }: { delta: number | null | undefined; big?: boolean }) {
  if (delta === null || delta === undefined) return null
  const steady = Math.abs(delta) < 0.5
  const up = delta > 0
  const cls = steady ? 'bg-gray-500/25 text-gray-300' : up ? 'bg-red-500/25 text-red-300' : 'bg-sky-500/25 text-sky-300'
  const arrow = steady ? '▬' : up ? '▲' : '▼'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-black tabular-nums ${cls} ${big ? 'px-3 py-1 text-base' : 'px-2 py-0.5 text-xs'}`}>
      <span className={big ? 'text-xl leading-none' : 'text-sm leading-none'}>{arrow}</span>
      {steady ? 'estável' : <>{up ? '+' : '−'}{Math.abs(delta).toFixed(1)}°<span className="font-semibold opacity-70 text-[0.7em]">em 10 min</span></>}
    </span>
  )
}

function Tile({ label, value, unit, extra, tone }: { label: string; value: string; unit?: string; extra?: React.ReactNode; tone?: string }) {
  return (
    <div className={`rounded-xl px-4 py-3 flex flex-col gap-1 ${tone ?? 'bg-black/30'}`}>
      <div className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">{label}</div>
      <div className="text-3xl sm:text-4xl font-black tabular-nums leading-none">{value}{unit && <span className="text-lg font-bold text-gray-400 ml-1">{unit}</span>}</div>
      {extra}
    </div>
  )
}

const TRACK_COLOUR = '#f59e0b', AIR_COLOUR = '#38bdf8'

// Track and air temperature from the start of the session until now, on one axis.
export function TempChart({ w }: { w: WeatherInfo }) {
  const h = w.history ?? []
  if (h.length < 3 || !w.historyStart) return null
  const t0 = Date.parse(w.historyStart)
  const lo = Math.floor(Math.min(...h.map(p => p.air)) - 1), hi = Math.ceil(Math.max(...h.map(p => p.track)) + 1)
  const step = hi - lo > 14 ? 5 : 2
  const yTicks: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) yTicks.push(v)
  const xMax = Math.max(h[h.length - 1].m, 10)
  const xStep = xMax > 90 ? 30 : xMax > 40 ? 15 : 10
  const xTicks: number[] = []
  for (let v = 0; v <= xMax; v += xStep) xTicks.push(v)
  const series: Series[] = [
    { key: 'track', color: TRACK_COLOUR, x: h.map(p => p.m), y: h.map(p => p.track), width: 2.2 },
    { key: 'air', color: AIR_COLOUR, x: h.map(p => p.m), y: h.map(p => p.air), width: 2.2 },
  ]
  const clock = (m: number) => new Date(t0 + m * 60_000).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="mt-3 rounded-xl bg-black/30 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Temperatura desde o início da sessão</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded" style={{ background: TRACK_COLOUR }} /><b>Pista</b> <span className="tabular-nums text-gray-300">{w.track.toFixed(1)}°</span></span>
        <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded" style={{ background: AIR_COLOUR }} /><b>Ar</b> <span className="tabular-nums text-gray-300">{w.air.toFixed(1)}°</span></span>
      </div>
      <LineChart series={series} xMin={0} xMax={xMax} yMin={lo} yMax={hi} height={120} yTicks={yTicks} xTicks={xTicks} fmtY={v => `${v}°`} fmtX={clock} />
    </div>
  )
}

export function WeatherStrip({ w }: { w: WeatherInfo }) {
  return (
    <div className="mt-3 text-gray-100">
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      <Tile label="🌡️ Ar" value={w.air.toFixed(0)} unit="°C" extra={<TrendBadge delta={w.airTrend} />} />
      <Tile label="🛣️ Pista" value={w.track.toFixed(0)} unit="°C" extra={<TrendBadge delta={w.trackTrend} big />} />
      <Tile label="💧 Humidade" value={w.humidity.toFixed(0)} unit="%" />
      <Tile label="💨 Vento" value={w.wind.toFixed(1)} unit="m/s" />
      <Tile label="Chuva" value={w.rain ? '🌧️ SIM' : '☀️ NÃO'} tone={w.rain ? 'bg-blue-700 text-white' : undefined} />
    </div>
    <TempChart w={w} />
    </div>
  )
}
