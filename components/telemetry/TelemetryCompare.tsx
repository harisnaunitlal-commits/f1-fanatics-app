import type { CompareData } from '@/lib/telemetry/compare'
import { LineChart, type Series } from './charts'
import { fmtLap } from './ui'

// Two drivers get the same colour when they share a team: the second one is drawn dashed and lighter.
export function TelemetryCompare({ data }: { data: CompareData }) {
  const { a, b, fractions } = data
  const sameColour = a.colour.toLowerCase() === b.colour.toLowerCase()
  const colB = sameColour ? '#ffffff' : b.colour
  const x = fractions
  const pct = [0, 0.25, 0.5, 0.75, 1]
  const mk = (key: string, which: 'a' | 'b', y: (number | null)[], extra: Partial<Series> = {}): Series => ({ key, color: which === 'a' ? a.colour : colB, x, y, ...extra })
  const diff = a.lapTime - b.lapTime
  const maxDelta = Math.max(0.2, ...data.delta.map(Math.abs))
  const yd = Math.ceil(maxDelta * 10) / 10

  const Legend = () => (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
      {[a, b].map((t, i) => (
        <span key={t.code} className="inline-flex items-center gap-2">
          <span className="w-4 h-1 rounded" style={{ background: i === 0 ? a.colour : colB }} />
          <b>{t.code}</b>
          <span className="text-gray-400 tabular-nums">V{t.lap} · {fmtLap(t.lapTime)}</span>
          <span className="text-xs text-gray-500">máx {t.topSpeed} · mín {t.minSpeed} km/h</span>
        </span>
      ))}
      <span className={`font-bold tabular-nums ${diff > 0 ? 'text-orange-300' : 'text-green-400'}`}>
        {diff === 0 ? 'iguais' : `${diff > 0 ? b.code : a.code} mais rápido ${Math.abs(diff).toFixed(3)} s`}
      </span>
    </div>
  )

  const Label = ({ children }: { children: React.ReactNode }) => <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-3 mb-0.5">{children}</div>
  const xt = { xTicks: pct, fmtX: (v: number) => `${Math.round(v * 100)}%` }

  return (
    <div>
      <Legend />
      <Label>Velocidade (km/h)</Label>
      <LineChart height={150} series={[mk('a', 'a', a.speed), mk('b', 'b', b.speed, { dash: sameColour ? '4 3' : undefined })]} xMin={0} xMax={1} yMin={0} yMax={360} yTicks={[0, 100, 200, 300]} {...xt} />
      <Label>Acelerador (%) e travão</Label>
      <LineChart height={110} series={[
        mk('ta', 'a', a.throttle, { fill: true }), mk('tb', 'b', b.throttle, { dash: sameColour ? '4 3' : undefined }),
        mk('ba', 'a', a.brake.map(v => (v ? 100 : null)), { width: 3, opacity: 0.9 }), mk('bb', 'b', b.brake.map(v => (v ? 108 : null)), { width: 3, opacity: 0.9 }),
      ]} xMin={0} xMax={1} yMin={0} yMax={112} yTicks={[0, 50, 100]} {...xt} />
      <Label>Mudança</Label>
      <LineChart height={90} series={[mk('ga', 'a', a.gear, { step: true }), mk('gb', 'b', b.gear, { step: true, dash: sameColour ? '4 3' : undefined })]} xMin={0} xMax={1} yMin={1} yMax={8} yTicks={[2, 4, 6, 8]} {...xt} />
      <Label>{`Diferença de tempo (s) — acima de 0, ${a.code} está atrás`}</Label>
      <LineChart height={110} series={[{ key: 'd', color: '#facc15', x, y: data.delta, width: 2 }]} xMin={0} xMax={1} yMin={-yd} yMax={yd} yTicks={[-yd, 0, yd]} fmtY={v => v.toFixed(1)} zeroLine {...xt} />
      <p className="text-[10px] text-gray-600 mt-2">Distância estimada a partir da velocidade (o OpenF1 não tem canal de distância); as duas voltas são alinhadas por percentagem da volta. O canal DRS não está disponível em 2026.</p>
    </div>
  )
}
