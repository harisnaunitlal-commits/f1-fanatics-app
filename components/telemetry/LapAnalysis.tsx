import type { TelemetryState, SectorColour, LapTimeLine } from '@/lib/telemetry/engine'
import { LineChart, type Series } from './charts'
import { fmtLap } from './ui'
import { RacePace } from './RacePace'

const SECTOR_CLS: Record<NonNullable<SectorColour>, string> = { purple: 'text-purple-400 font-black', green: 'text-green-400 font-bold', yellow: 'text-yellow-300' }

export function LapAnalysis({ s, focus }: { s: TelemetryState; focus: string[] }) {
  const rows = s.tower.filter(r => !r.out || r.lastLap !== null)
  const overall = s.fastestLap?.code
  const lines: LapTimeLine[] = (focus.length ? focus : s.tower.slice(0, 3).map(r => r.code)).map(c => s.lapTimes.find(l => l.code === c)).filter((l): l is LapTimeLine => !!l && l.laps.length > 0)
  const all = lines.flatMap(l => l.laps.map(x => x.t))
  const yMin = all.length ? Math.floor(Math.min(...all) * 2) / 2 : 90
  const yMax = all.length ? Math.min(Math.ceil(Math.max(...all) * 2) / 2, yMin + 6) : 100
  const xMax = Math.max(s.leaderLap, 2)
  const seen = new Map<string, number>()
  const series: Series[] = lines.map(l => {
    const k = (seen.get(l.colour) ?? 0) + 1
    seen.set(l.colour, k)
    return { key: l.code, color: k > 1 ? '#ffffff' : l.colour, x: l.laps.map(x => x.lap), y: l.laps.map(x => (x.t <= yMax ? x.t : null)), width: 1.8, dash: k > 1 ? '4 3' : undefined }
  })
  const yt: number[] = []
  for (let v = Math.ceil(yMin); v <= yMax; v += 1) yt.push(v)

  const race = s.kind === 'race'
  return (
    <div className="space-y-5">
      {race && <RacePace s={s} focus={focus} />}
      {!race && <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2 text-left">Piloto</th>
              <th className="py-2 px-2 text-right">Última volta</th>
              <th className="py-2 px-2 text-right">S1</th>
              <th className="py-2 px-2 text-right">S2</th>
              <th className="py-2 px-2 text-right">S3</th>
              <th className="py-2 px-2 text-right">Melhor</th>
              <th className="py-2 px-2 text-right">Vel. máx.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.num} className={`border-b border-gray-800/50 ${r.out ? 'opacity-40' : ''} ${focus.includes(r.code) ? 'bg-white/[0.05]' : ''}`}>
                <td className="py-1 px-2 text-center tabular-nums text-gray-400">{r.pos}</td>
                <td className="py-1 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: r.colour }} /><b>{r.code}</b></span></td>
                <td className={`py-1 px-2 text-right tabular-nums ${overall === r.code && r.lastLap === r.bestLap ? 'text-purple-400 font-black' : ''}`}>{fmtLap(r.lastLap)}</td>
                {[0, 1, 2].map(i => (
                  <td key={i} className={`py-1 px-2 text-right tabular-nums ${r.sectorColour[i] ? SECTOR_CLS[r.sectorColour[i] as NonNullable<SectorColour>] : 'text-gray-600'}`}>{r.sectors[i] != null ? (r.sectors[i] as number).toFixed(3) : '—'}</td>
                ))}
                <td className={`py-1 px-2 text-right tabular-nums ${overall === r.code ? 'text-purple-400 font-black' : 'text-gray-300'}`}>{fmtLap(r.bestLap)}</td>
                <td className="py-1 px-2 text-right tabular-nums text-gray-300">{r.topSpeed ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-gray-600 mt-2"><span className="text-purple-400 font-bold">Roxo</span> = melhor sector da sessão · <span className="text-green-400 font-bold">verde</span> = melhor pessoal · <span className="text-yellow-300">amarelo</span> = mais lento. Velocidade máxima = melhor da &quot;speed trap&quot;.</p>
      </div>}

      {series.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tempos por volta (s)</span>
            {lines.map((l, i) => <span key={l.code} className="inline-flex items-center gap-1 text-xs"><span className="w-3 h-1 rounded" style={{ background: series[i].color }} /><b>{l.code}</b></span>)}
          </div>
          <LineChart series={series} xMin={1} xMax={xMax} yMin={yMin} yMax={yMax} height={170} yTicks={yt} xTicks={Array.from({ length: Math.floor(xMax / 10) + 1 }, (_, i) => i * 10).filter(v => v >= 1).concat(1)} fmtY={v => `${v}`} />
          <p className="text-[10px] text-gray-600">Voltas de box, de Safety Car e a 1ª volta ficam de fora. Mostra os pilotos destacados pelo admin (ou o top 3).</p>
        </div>
      )}
    </div>
  )
}
