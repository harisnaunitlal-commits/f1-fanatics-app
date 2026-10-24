import type { SessionResults as Results, ResultRow } from '@/lib/telemetry/engine'
import { COMPOUND, fmtLap } from './ui'

const gap = (s: number | null) => (s === null ? '—' : s === 0 ? '' : `+${s.toFixed(3)}`)

function Tyre({ compound, age }: { compound: string | null; age: number | null }) {
  const c = compound ? COMPOUND[compound] : null
  if (!c) return <span className="text-gray-600">—</span>
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] font-black ${c.cls}`}>{c.letter}</span>
      {age !== null && <span className="text-xs text-gray-500 tabular-nums">{age}</span>}
    </span>
  )
}

function Name({ r, mine, feat }: { r: ResultRow; mine: boolean; feat: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-1 h-5 rounded-sm shrink-0" style={{ background: r.colour }} />
      <span className="font-black tracking-wide">{r.code}</span>
      <span className="text-xs text-gray-500 hidden md:inline">{r.name.split(' ').slice(-1)[0]}</span>
      {mine && <span className="text-[9px] font-bold text-yellow-300">★ TEU</span>}
      {!mine && feat && <span className="text-[9px] font-bold text-gray-400">◆</span>}
      {r.inPit && <span className="text-[9px] font-bold bg-blue-600 text-white px-1 rounded">BOX</span>}
    </span>
  )
}

export function SessionResults({ data, favCode, featured }: { data: Results; favCode: string | null; featured: string[] }) {
  const quali = data.kind === 'quali'
  const started = data.rows.some(r => r.best !== null)
  if (!started) return <p className="text-sm text-gray-500">Ainda sem tempos registados nesta sessão.</p>

  const phaseLabel = !quali ? null
    : data.finished ? 'Qualificação terminada — grelha de partida'
    : data.phaseEnded ? `Q${data.phase} terminou${data.phase && data.phase < 3 ? ` — a aguardar o Q${data.phase + 1}` : ''}`
    : `Q${data.phase} em curso`

  const body: React.ReactNode[] = []
  let lastGroup: number | null = null
  let dangerShown = false
  data.rows.forEach(r => {
    const mine = r.code === favCode
    const feat = featured.includes(r.code)
    if (quali && lastGroup === null && !data.finished) {
      const inGroup = data.rows.filter(x => x.group === r.group).length
      body.push(
        <tr key="head"><td colSpan={8} className="py-1.5 px-2 text-[10px] font-black uppercase tracking-widest text-green-300 bg-green-950/40 border-y border-green-800/50">
          {r.group === 3 ? '🏁 Q3 — luta pela pole' : `Q${r.group}`} · {inGroup} pilotos {data.phaseEnded ? '' : 'em pista'}
        </td></tr>
      )
    }
    if (quali && lastGroup !== null && r.group !== lastGroup) {
      body.push(
        <tr key={`sep${r.group}`}><td colSpan={8} className="py-1.5 px-2 text-[10px] font-black uppercase tracking-widest text-red-300 bg-red-950/40 border-y border-red-900/50">
          ✂ Eliminados no Q{r.group}
        </td></tr>
      )
    }
    if (quali && !dangerShown && r.inDanger) {
      dangerShown = true
      body.push(
        <tr key="danger"><td colSpan={8} className="py-1 px-2 text-[10px] font-black uppercase tracking-widest text-orange-300 bg-orange-950/40 border-y border-orange-800/60">
          ⚠ Zona de eliminação — avançam {data.advance}
        </td></tr>
      )
    }
    lastGroup = r.group
    const elim = r.eliminatedIn !== null
    body.push(
      <tr key={r.num} className={`border-b border-gray-800/50 ${mine ? 'bg-yellow-400/10' : feat ? 'bg-white/[0.04]' : ''} ${elim ? 'opacity-70' : ''} ${r.inDanger ? 'bg-orange-900/10' : ''}`}>
        <td className="py-1.5 px-2 text-center font-bold tabular-nums text-gray-300">{r.pos}</td>
        <td className="py-1.5 px-2"><Name r={r} mine={mine} feat={feat} /></td>
        {quali ? (
          [0, 1, 2].map(i => (
            <td key={i} className={`py-1.5 px-2 text-right tabular-nums text-xs sm:text-sm ${r.group === i + 1 ? (r.phaseTimes[i] !== null && r.pos === data.rows.findIndex(x => x.group === r.group) + 1 ? 'text-purple-400 font-black' : 'text-white font-semibold') : 'text-gray-500'}`}>
              {fmtLap(r.phaseTimes[i])}
            </td>
          ))
        ) : (
          <td className={`py-1.5 px-2 text-right tabular-nums ${r.pos === 1 ? 'text-purple-400 font-black' : 'text-white font-semibold'}`}>{fmtLap(r.best)}</td>
        )}
        <td className="py-1.5 px-2 text-right tabular-nums text-xs text-gray-300">{r.pos === 1 || r.gap === 0 ? '' : gap(r.gap)}</td>
        {!quali && <td className="py-1.5 px-2 text-right tabular-nums text-xs text-gray-500 hidden sm:table-cell">{gap(r.gapPrev)}</td>}
        <td className="py-1.5 px-2 text-center"><Tyre compound={r.bestTyre} age={r.bestTyreAge} /></td>
        {!quali && <td className="py-1.5 px-2 text-center tabular-nums text-gray-400 hidden sm:table-cell">{r.laps}</td>}
        {!quali && (
          <td className={`py-1.5 px-2 text-right tabular-nums text-xs hidden md:table-cell ${r.lastLapColour === 'purple' ? 'text-purple-400 font-bold' : r.lastLapColour === 'green' ? 'text-green-400' : 'text-gray-500'}`}>{fmtLap(r.lastLap)}</td>
        )}
        {quali && (
          <td className="py-1.5 px-2 text-right">
            {elim ? <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-red-700 text-white">ELIM. Q{r.eliminatedIn}</span>
              : r.inDanger ? <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-orange-600 text-white">PERIGO</span>
              : <span className="text-[10px] text-gray-500">{r.best === null && !data.phaseEnded ? 'sem tempo' : `Q${r.group}`}</span>}
          </td>
        )}
      </tr>
    )
  })

  return (
    <div>
      {phaseLabel && (
        <div className={`mb-3 inline-block text-xs font-black px-3 py-1 rounded-full ${data.finished ? 'bg-white text-black' : data.phaseEnded ? 'bg-gray-700 text-gray-100' : 'bg-green-600 text-white'}`}>{phaseLabel}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
              <th className="py-2 px-2 w-8 text-center">#</th>
              <th className="py-2 px-2 text-left">Piloto</th>
              {quali ? <><th className="py-2 px-2 text-right">Q1</th><th className="py-2 px-2 text-right">Q2</th><th className="py-2 px-2 text-right">Q3</th></> : <th className="py-2 px-2 text-right">Melhor volta</th>}
              <th className="py-2 px-2 text-right">Dif. P1</th>
              {!quali && <th className="py-2 px-2 text-right hidden sm:table-cell">Dif. ant.</th>}
              <th className="py-2 px-2 text-center">Pneu</th>
              {!quali && <th className="py-2 px-2 text-center hidden sm:table-cell">Voltas</th>}
              {!quali && <th className="py-2 px-2 text-right hidden md:table-cell">Última</th>}
              {quali && <th className="py-2 px-2 text-right">Estado</th>}
            </tr>
          </thead>
          <tbody>{body}</tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-600 mt-2">
        {quali
          ? 'Contam só os melhores tempos de cada fase. Corte de 2026: 22 carros → 16 (Q1) → 10 (Q2). O pneu mostrado é o da melhor volta de cada piloto.'
          : 'Só conta o melhor tempo. O pneu mostrado é o da melhor volta (e a sua idade em voltas). Tempos anulados por limites da pista não contam.'}
      </p>
    </div>
  )
}
