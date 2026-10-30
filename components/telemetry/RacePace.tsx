import type { TelemetryState, RacePaceRow, PaceLap } from '@/lib/telemetry/engine'
import { COMPOUND, fmtLap } from './ui'

// Race pace: last 5 laps of every running car with the tyre on each lap and how much each lap lost or gained
// against the one before, plus 5/10-lap averages and the tyre degradation estimate for the current stint.

const f1 = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`

function LapCell({ l }: { l: PaceLap }) {
  const c = l.compound ? COMPOUND[l.compound] : null
  const tag = l.flag === 'pit' ? 'BOX' : l.flag === 'out' ? 'SAÍDA' : l.flag === 'neutral' ? 'SC/VSC' : null
  const tone = l.delta === null ? 'text-gray-500' : l.delta <= -0.15 ? 'text-green-400' : l.delta >= 0.35 ? 'text-red-400' : l.delta >= 0.1 ? 'text-orange-300' : 'text-gray-300'
  return (
    <td className="py-1 px-1.5 text-right align-top" style={{ borderTop: `2px solid ${c?.bar ?? '#444'}` }}>
      <div className={`tabular-nums text-xs sm:text-sm ${tag ? 'text-gray-500' : 'text-gray-100'}`}>{fmtLap(l.t)}</div>
      <div className={`text-[10px] tabular-nums leading-none mt-0.5 ${tag ? 'text-sky-300 font-bold' : tone}`}>{tag ?? (l.delta === null ? '—' : f1(l.delta))}</div>
    </td>
  )
}

function Row({ r, focus, laps }: { r: RacePaceRow; focus: boolean; laps: number[] }) {
  const c = r.tyre ? COMPOUND[r.tyre] : null
  const byLap = new Map(r.laps.map(l => [l.lap, l]))
  const gain = r.avg5 !== null && r.prev5 !== null ? r.avg5 - r.prev5 : null
  return (
    <tr className={`border-b border-gray-800/50 ${focus ? 'bg-white/[0.05]' : ''}`}>
      <td className="py-1 px-1.5 text-center tabular-nums text-gray-400 align-top">{r.pos}</td>
      <td className="py-1 px-1.5 align-top"><span className="inline-flex items-center gap-2"><span className="w-1 h-5 rounded-sm" style={{ background: r.colour }} /><b>{r.code}</b></span></td>
      <td className="py-1 px-1.5 align-top whitespace-nowrap">
        {c ? <span className="inline-flex items-center gap-1"><span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] font-black ${c.cls}`}>{c.letter}</span><span className="text-[11px] text-gray-400 tabular-nums">{r.stintLaps}v</span></span> : <span className="text-gray-600">—</span>}
      </td>
      {laps.map(n => byLap.get(n) ? <LapCell key={n} l={byLap.get(n) as PaceLap} /> : <td key={n} className="py-1 px-1.5 text-right text-gray-700 align-top">—</td>)}
      <td className="py-1 px-1.5 text-right tabular-nums text-xs text-gray-200 align-top">{r.avg5 === null ? '—' : fmtLap(r.avg5)}<div className="text-[10px] text-gray-500">{r.avg10 === null ? '' : `10v ${fmtLap(r.avg10)}`}</div></td>
      <td className={`py-1 px-1.5 text-right tabular-nums text-xs align-top ${gain === null ? 'text-gray-600' : gain <= -0.1 ? 'text-green-400' : gain >= 0.1 ? 'text-red-400' : 'text-gray-300'}`}>{gain === null ? '—' : f1(gain)}</td>
      <td className={`py-1 px-1.5 text-right tabular-nums text-xs font-bold align-top ${r.deg === null ? 'text-gray-600' : r.deg >= 0.08 ? 'text-red-400' : r.deg >= 0.03 ? 'text-orange-300' : 'text-green-400'}`}>{r.deg === null ? '—' : f1(r.deg)}</td>
    </tr>
  )
}

export function RacePace({ s, focus }: { s: TelemetryState; focus: string[] }) {
  const rows = s.racePace
  if (rows.length === 0) return <p className="text-sm text-gray-500">Ainda sem voltas suficientes para mostrar o ritmo.</p>
  // columns = the last 5 lap numbers of the leader's window
  const lastLap = Math.max(...rows.flatMap(r => r.laps.map(l => l.lap)))
  const laps = [lastLap - 4, lastLap - 3, lastLap - 2, lastLap - 1, lastLap].filter(n => n >= 1)
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
              <th className="py-2 px-1.5 text-center w-7">#</th>
              <th className="py-2 px-1.5 text-left">Piloto</th>
              <th className="py-2 px-1.5 text-left" title="Pneu actual e voltas feitas neste conjunto">Pneu</th>
              {laps.map(n => <th key={n} className="py-2 px-1.5 text-right">V{n}</th>)}
              <th className="py-2 px-1.5 text-right" title="Média das últimas 5 voltas limpas (e das últimas 10)">Média 5v</th>
              <th className="py-2 px-1.5 text-right" title="Média das últimas 5 voltas menos a média das 5 anteriores (negativo = a ficar mais rápido)">vs 5 ant.</th>
              <th className="py-2 px-1.5 text-right" title="Perda de ritmo por volta causada pelo desgaste do pneu, já com a correcção do combustível">Degr. s/v</th>
            </tr>
          </thead>
          <tbody>{rows.map(r => <Row key={r.code} r={r} focus={focus.includes(r.code)} laps={laps} />)}</tbody>
        </table>
      </div>
      <div className="text-[10px] text-gray-500 leading-relaxed space-y-0.5">
        <p>Cada volta mostra o tempo e, por baixo, <b className="text-gray-300">quanto perdeu (+) ou ganhou (−) face à volta anterior</b>. A cor da linha em cima é o pneu da volta (<span className="text-red-400">macio</span>, <span className="text-yellow-300">médio</span>, <span className="text-gray-200">duro</span>). BOX = volta de entrada na box · SAÍDA = volta de saída · SC/VSC = volta neutralizada (não conta nas médias).</p>
        <p><b className="text-gray-300">Degr. s/v</b> = quanto o piloto perde por volta por causa do pneu neste stint (inclinação das últimas ≤10 voltas limpas, somando ~0,035 s/volta que o carro ganha por gastar combustível). Positivo e alto = pneu a acabar; perto de 0 = pneu estável. É do próprio piloto, <u>não</u> é relativo ao líder.</p>
      </div>
    </div>
  )
}
