import type { RaceSets, RaceSetsRow } from '@/lib/telemetry/shared'
import type { TelemetryState, TowerRow } from '@/lib/telemetry/engine'
import { COMPOUND } from './ui'

const KEYS = [['S', 'SOFT'], ['M', 'MEDIUM'], ['H', 'HARD']] as const

// New sets of each compound the driver still has for the race. In the race a set counts as taken once a pit stop has fitted that compound
// (the start tyre is not counted: it is often a used set from qualifying). Before the race, or in other sessions, nothing is crossed out.
function remaining(row: RaceSetsRow, t: TowerRow | undefined, race: boolean): Record<'S' | 'M' | 'H', { have: number; left: number }> {
  const fitted: Record<string, number> = {}
  if (race && t) t.stints.slice(1).forEach(st => { if (st.compound) fitted[st.compound] = (fitted[st.compound] ?? 0) + 1 })
  const out = {} as Record<'S' | 'M' | 'H', { have: number; left: number }>
  for (const [k, compound] of KEYS) out[k] = { have: row[k][0], left: Math.max(0, row[k][0] - (fitted[compound] ?? 0)) }
  return out
}

function Sets({ compound, have, left }: { compound: string; have: number; left: number }) {
  const c = COMPOUND[compound]
  if (have === 0) return <span className="text-gray-700 text-xs">—</span>
  return (
    <span className="inline-flex gap-0.5" title={`${left} de ${have} ${c.name.toLowerCase()}s novos por usar`}>
      {Array.from({ length: have }, (_, i) => i < left
        ? <span key={i} className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] font-black ${c.cls}`}>{c.letter}</span>
        : <span key={i} className="inline-flex w-5 h-5 rounded-full border-2 border-gray-700 text-gray-700 items-center justify-center text-[10px] font-black line-through opacity-60">{c.letter}</span>)}
    </span>
  )
}

export function RaceSetsTable({ sets, s, favCode, featured }: { sets: RaceSets | null | undefined; s: TelemetryState; favCode: string | null; featured: string[] }) {
  if (!sets || Object.keys(sets).length === 0) {
    return <p className="text-sm text-gray-500">Ainda sem os sets para a corrida. O admin acrescenta-os todos os domingos, a partir da folha da Pirelli.</p>
  }
  const race = s.kind === 'race'
  const rows = s.tower.filter(t => sets[t.code]).map(t => ({ t, r: sets[t.code], rem: remaining(sets[t.code], t, race) }))
  const missing = s.tower.filter(t => !sets[t.code]).map(t => t.code)
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
            <th className="py-2 px-2 text-center w-8">#</th>
            <th className="py-2 px-2 text-left">Piloto</th>
            <th className="py-2 px-2 text-left">Macios novos</th>
            <th className="py-2 px-2 text-left">Médios novos</th>
            <th className="py-2 px-2 text-left">Duros novos</th>
            <th className="py-2 px-2 text-right">Novos por usar</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ t, rem }) => {
            const left = rem.S.left + rem.M.left + rem.H.left
            const mine = t.code === favCode, feat = featured.includes(t.code)
            return (
              <tr key={t.num} className={`border-b border-gray-800/50 ${t.out ? 'opacity-40' : ''} ${mine ? 'bg-yellow-400/10' : feat ? 'bg-white/[0.04]' : ''}`}>
                <td className="py-1.5 px-2 text-center tabular-nums text-gray-400">{t.pos}</td>
                <td className="py-1.5 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: t.colour }} /><b>{t.code}</b></span></td>
                <td className="py-1.5 px-2"><Sets compound="SOFT" {...rem.S} /></td>
                <td className="py-1.5 px-2"><Sets compound="MEDIUM" {...rem.M} /></td>
                <td className="py-1.5 px-2"><Sets compound="HARD" {...rem.H} /></td>
                <td className="py-1.5 px-2 text-right tabular-nums font-bold text-gray-200">{left}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-600 mt-2">
        Só os sets <b>novos</b> da folha da Pirelli para a corrida (inseridos pelo admin).
        {race ? ' Na corrida, cada paragem risca um set novo desse composto (assume que se monta um novo; o pneu de partida não conta, porque muitas vezes é um set usado da qualificação). É uma estimativa: o OpenF1 não diz que set é.' : ' Na corrida, cada paragem passa a riscar um set novo.'}
        {missing.length > 0 && ` Sem dados: ${missing.join(', ')}.`}
      </p>
    </div>
  )
}

// One line for the driver card
export function RaceSetsLine({ sets, t, race }: { sets: RaceSets | null | undefined; t: TowerRow; race: boolean }) {
  const r = sets?.[t.code]
  if (!r) return null
  const rem = remaining(r, t, race)
  return (
    <div className="bg-black/30 rounded-lg px-3 py-2 text-sm">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Sets novos para a corrida</div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Sets compound="SOFT" {...rem.S} /><Sets compound="MEDIUM" {...rem.M} /><Sets compound="HARD" {...rem.H} />
      </div>
    </div>
  )
}
