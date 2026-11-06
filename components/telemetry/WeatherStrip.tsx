import type { WeatherInfo } from '@/lib/telemetry/engine'

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

export function WeatherStrip({ w }: { w: WeatherInfo }) {
  return (
    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-gray-100">
      <Tile label="🌡️ Ar" value={w.air.toFixed(0)} unit="°C" extra={<TrendBadge delta={w.airTrend} />} />
      <Tile label="🛣️ Pista" value={w.track.toFixed(0)} unit="°C" extra={<TrendBadge delta={w.trackTrend} big />} />
      <Tile label="💧 Humidade" value={w.humidity.toFixed(0)} unit="%" />
      <Tile label="💨 Vento" value={w.wind.toFixed(1)} unit="m/s" />
      <Tile label="Chuva" value={w.rain ? '🌧️ SIM' : '☀️ NÃO'} tone={w.rain ? 'bg-blue-700 text-white' : undefined} />
    </div>
  )
}
