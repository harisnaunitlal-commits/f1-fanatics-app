import type { WeatherInfo } from '@/lib/telemetry/engine'
import { LineChart, type Series } from './charts'

// Temperature change over the last 10 min as a pill: rising (red ▲), falling (blue ▼) or steady.
export function TrendBadge({ delta, big, label = 'em 10 min' }: { delta: number | null | undefined; big?: boolean; label?: string }) {
  if (delta === null || delta === undefined) return null
  const steady = Math.abs(delta) < 0.5
  const up = delta > 0
  const cls = steady ? 'bg-gray-500/25 text-gray-300' : up ? 'bg-red-500/25 text-red-300' : 'bg-sky-500/25 text-sky-300'
  const arrow = steady ? '▬' : up ? '▲' : '▼'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-black tabular-nums ${cls} ${big ? 'px-3 py-1 text-base' : 'px-2 py-0.5 text-xs'}`}>
      <span className={big ? 'text-xl leading-none' : 'text-sm leading-none'}>{arrow}</span>
      {steady ? 'estável' : <>{up ? '+' : '−'}{Math.abs(delta).toFixed(1)}°<span className="font-semibold opacity-70 text-[0.7em]">{label}</span></>}
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

const TRACK_COLOUR = '#f59e0b'

// Track temperature from the start of the session until now. The axis fits the session's own range, so a swing of 1-2 degrees is visible.
export function TempChart({ w }: { w: WeatherInfo }) {
  const h = w.history ?? []
  if (h.length < 3 || !w.historyStart) return null
  const t0 = Date.parse(w.historyStart)
  const temps = h.map(p => p.track)
  const tMin = Math.min(...temps), tMax = Math.max(...temps)
  const pad = Math.max(0.5, (tMax - tMin) * 0.12)
  const lo = Math.floor((tMin - pad) * 2) / 2, hi = Math.ceil((tMax + pad) * 2) / 2
  const step = [0.5, 1, 2, 5].find(st => (hi - lo) / st <= 6) ?? 5
  const yTicks: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) yTicks.push(Math.round(v * 10) / 10)
  const xMax = Math.max(h[h.length - 1].m, 10)
  const xStep = xMax > 90 ? 30 : xMax > 40 ? 15 : 10
  const xTicks: number[] = []
  for (let v = 0; v <= xMax; v += xStep) xTicks.push(v)
  // a moving average over 5 samples shows the trend through the sun/cloud noise; the raw readings stay behind it
  const smooth = temps.map((_, i) => { const win = temps.slice(Math.max(0, i - 2), i + 3); return win.reduce((x, y) => x + y, 0) / win.length })
  const series: Series[] = [
    { key: 'raw', color: TRACK_COLOUR, x: h.map(p => p.m), y: temps, width: 1.2, opacity: 0.35 },
    { key: 'trend', color: TRACK_COLOUR, x: h.map(p => p.m), y: smooth, width: 2.8 },
  ]
  const clock = (m: number) => new Date(t0 + m * 60_000).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit' })
  const first = temps[0], d = w.track - first
  return (
    <div className="mt-3 rounded-xl bg-black/30 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">🛣️ Temperatura da pista desde o início</span>
        <span className="tabular-nums text-gray-300">agora <b className="text-white">{w.track.toFixed(1)}°</b></span>
        <span className="tabular-nums text-gray-400">mín {tMin.toFixed(1)}° · máx {tMax.toFixed(1)}°</span>
        <TrendBadge delta={Math.round(d * 10) / 10} label="desde o início" />
      </div>
      <LineChart series={series} xMin={0} xMax={xMax} yMin={lo} yMax={hi} height={130} yTicks={yTicks} xTicks={xTicks} fmtY={v => `${v}°`} fmtX={clock} />
      <div className="text-[10px] text-gray-600">linha forte = tendência (média móvel) · linha fina = leituras reais</div>
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
