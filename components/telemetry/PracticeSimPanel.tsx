'use client'

import { useMemo, useState } from 'react'
import type { TelemetryState } from '@/lib/telemetry/engine'
import type { QualiSimRow, RaceSimRun } from '@/lib/telemetry/practice'
import { COMPOUND, fmtLap } from './ui'

const NAME: Record<string, string> = { SOFT: 'Mole', MEDIUM: 'Médio', HARD: 'Duro', INTERMEDIATE: 'Intermédio', WET: 'Chuva' }

function Cmp({ compound, age }: { compound: string | null; age?: number | null }) {
  const c = compound ? COMPOUND[compound] : null
  if (!c) return <span className="text-gray-600">—</span>
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] font-black ${c.cls}`}>{c.letter}</span>
      {age != null && <span className="text-[11px] text-gray-400 tabular-nums">{age === 0 ? 'novo' : `${age}v`}</span>}
    </span>
  )
}

const Code = ({ code, colour }: { code: string; colour: string }) => (
  <span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: colour }} /><b>{code}</b></span>
)

const th = 'py-2 px-2 text-[10px] text-gray-500 uppercase tracking-wider'

function QualiTable({ rows, focus }: { rows: QualiSimRow[]; focus: string[] }) {
  if (rows.length === 0) return <p className="text-sm text-gray-500">Ainda ninguém fez uma volta lançada de simulação de qualificação.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-gray-700/60">
            <th className={`${th} w-8 text-center`}>#</th>
            <th className={`${th} text-left`}>Piloto</th>
            <th className={`${th} text-right`}>Melhor volta</th>
            <th className={`${th} text-right`}>Gap</th>
            <th className={`${th} text-center`}>Pneu</th>
            <th className={`${th} text-right`}>Volta</th>
            <th className={`${th} text-right`} title="voltas a menos de 2% da melhor">Voltas fortes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.code} className={`border-b border-gray-800/50 ${focus.includes(r.code) ? 'bg-white/[0.06]' : ''}`}>
              <td className="py-1 px-2 text-center tabular-nums text-gray-400">{i + 1}</td>
              <td className="py-1 px-2"><Code code={r.code} colour={r.colour} /></td>
              <td className={`py-1 px-2 text-right tabular-nums ${i === 0 ? 'text-purple-400 font-black' : ''}`}>{fmtLap(r.best)}</td>
              <td className="py-1 px-2 text-right tabular-nums text-gray-400">{i === 0 ? '—' : `+${r.gap.toFixed(3)}`}</td>
              <td className="py-1 px-2 text-center"><Cmp compound={r.compound} age={r.tyreAge} /></td>
              <td className="py-1 px-2 text-right tabular-nums text-gray-500">{r.lap}</td>
              <td className="py-1 px-2 text-right tabular-nums text-gray-400">{r.pushLaps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const degCls = (d: number | null) => d === null ? 'text-gray-600' : d >= 0.12 ? 'text-red-400 font-bold' : d >= 0.06 ? 'text-yellow-300' : 'text-green-400'
const degTxt = (d: number) => `${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(2)}`

function RaceTable({ rows, focus }: { rows: RaceSimRun[]; focus: string[] }) {
  const best = rows[0]?.avg5 ?? 0
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-gray-700/60">
            <th className={`${th} w-8 text-center`}>#</th>
            <th className={`${th} text-left`}>Piloto</th>
            <th className={`${th} text-right`} title="média das primeiras 5 voltas de cada stint: a mesma distância para todos">Ritmo 5 voltas</th>
            <th className={`${th} text-right`}>Gap</th>
            <th className={`${th} text-right`} title="média de todas as voltas contadas do stint">Média do stint</th>
            <th className={`${th} text-right`} title="segundos perdidos por volta devido ao pneu (com correcção de combustível)">Degradação</th>
            <th className={`${th} text-right`}>Voltas</th>
            <th className={`${th} text-center`}>Pneu</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.code}-${r.lapStart}`} className={`border-b border-gray-800/50 ${focus.includes(r.code) ? 'bg-white/[0.06]' : ''}`}>
              <td className="py-1 px-2 text-center tabular-nums text-gray-400">{i + 1}</td>
              <td className="py-1 px-2"><Code code={r.code} colour={r.colour} /></td>
              <td className="py-1 px-2 text-right tabular-nums font-semibold">{fmtLap(r.avg5)}</td>
              <td className="py-1 px-2 text-right tabular-nums text-gray-400">{i === 0 ? '—' : `+${(r.avg5 - best).toFixed(3)}`}</td>
              <td className="py-1 px-2 text-right tabular-nums text-gray-500">{fmtLap(r.avg)}</td>
              <td className={`py-1 px-2 text-right tabular-nums ${degCls(r.deg)}`}>{r.deg === null ? '—' : `${degTxt(r.deg)} s/v`}</td>
              <td className="py-1 px-2 text-right tabular-nums text-gray-400" title={`voltas ${r.lapStart}–${r.lapEnd}`}>{r.laps}</td>
              <td className="py-1 px-2 text-center"><Cmp compound={r.compound} age={r.tyreAgeStart} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Head to head of the highlighted drivers: qualifying lap, then race pace on every compound they all ran.
function Versus({ s, focus }: { s: TelemetryState; focus: string[] }) {
  const ps = s.practiceSim!
  const codes = focus.slice(0, 4)
  if (codes.length < 2) return <p className="text-sm text-gray-500">Escolhe 2 ou mais pilotos destacados (mesa de controlo ou janela do admin) para ver a comparação lado a lado.</p>
  const colour = (c: string) => s.tower.find(r => r.code === c)?.colour ?? '#888'
  const bestRun = (code: string, comp: string) => ps.race.filter(r => r.code === code && r.compound === comp).sort((a, b) => b.laps - a.laps || a.avg5 - b.avg5)[0]
  const compounds = Array.from(new Set(ps.race.map(r => r.compound).filter((c): c is string => !!c))).filter(c => codes.every(k => bestRun(k, c)))
  const qs = codes.map(c => ps.quali.find(q => q.code === c))
  const times = qs.filter((q): q is QualiSimRow => !!q).map(q => q.best)
  const refQ = times.length ? Math.min(...times) : null
  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Volta lançada</div>
        <div className="flex flex-wrap gap-2">
          {codes.map((c, i) => {
            const q = qs[i]
            return (
              <div key={c} className="rounded-xl bg-black/30 px-3 py-2 min-w-[130px]" style={{ borderLeft: `3px solid ${colour(c)}` }}>
                <div className="font-black">{c}</div>
                <div className="tabular-nums text-sm">{q ? fmtLap(q.best) : '—'}</div>
                <div className="text-xs text-gray-400 tabular-nums inline-flex items-center gap-1.5">
                  {q && refQ !== null ? (q.best === refQ ? <span className="text-green-400 font-bold">mais rápido</span> : `+${(q.best - refQ).toFixed(3)}`) : 'sem volta'}
                  {q && <Cmp compound={q.compound} age={q.tyreAge} />}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Ritmo de corrida (mesmo composto)</div>
        {compounds.length === 0 ? <p className="text-sm text-gray-500">Nenhum composto em comum com uma simulação de corrida destes pilotos.</p> : (
          <div className="space-y-2">
            {compounds.map(comp => {
              const runs = codes.map(c => bestRun(c, comp))
              const ref = Math.min(...runs.map(r => r.avg5))
              return (
                <div key={comp} className="rounded-xl bg-black/30 px-3 py-2">
                  <div className="text-xs text-gray-400 mb-1 inline-flex items-center gap-2"><Cmp compound={comp} /> {NAME[comp] ?? comp}</div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                    {runs.map((r, i) => (
                      <div key={codes[i]} className="text-sm">
                        <b style={{ color: colour(codes[i]) }}>{codes[i]}</b>{' '}
                        <span className="tabular-nums">{fmtLap(r.avg5)}</span>{' '}
                        <span className={`tabular-nums ${r.avg5 === ref ? 'text-green-400 font-bold' : 'text-gray-400'}`}>{r.avg5 === ref ? 'melhor' : `+${(r.avg5 - ref).toFixed(3)}`}</span>{' '}
                        {r.deg !== null && <span className={`text-xs tabular-nums ${degCls(r.deg)}`}>deg {degTxt(r.deg)}</span>}{' '}
                        <span className="text-[11px] text-gray-500">{r.laps}v</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function PracticeSimPanel({ s, focus }: { s: TelemetryState; focus: string[] }) {
  const ps = s.practiceSim
  const compounds = useMemo(() => {
    const n = new Map<string, number>()
    for (const r of ps?.race ?? []) if (r.compound) n.set(r.compound, (n.get(r.compound) ?? 0) + 1)
    return Array.from(n.entries()).sort((a, b) => b[1] - a[1]).map(([c]) => c)
  }, [ps])
  const [pick, setPick] = useState<string | null>(null)
  if (!ps) return <p className="text-sm text-gray-500">Só nos treinos livres.</p>
  const comp = pick && compounds.includes(pick) ? pick : compounds[0] ?? null
  const runs = ps.race.filter(r => r.compound === comp)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-300 mb-2">Simulação de qualificação</h3>
        <QualiTable rows={ps.quali} focus={focus} />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-300">Simulação de corrida</h3>
          {compounds.map(c => (
            <button key={c} onClick={() => setPick(c)} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs border ${c === comp ? 'bg-white/10 border-white/40' : 'border-gray-700 text-gray-400'}`}>
              <Cmp compound={c} /> {NAME[c] ?? c}
            </button>
          ))}
        </div>
        {runs.length === 0 ? <p className="text-sm text-gray-500">Ainda não há stints longos (5 ou mais voltas seguidas) para analisar.</p> : <RaceTable rows={runs} focus={focus} />}
      </div>
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-300 mb-2">Comparação lado a lado</h3>
        <Versus s={s} focus={focus} />
      </div>
      <p className="text-[10px] text-gray-600">
        Só contam voltas completas: ficam de fora as voltas de saída e de entrada às boxes, as voltas anuladas e as lentas (mais de 7% acima da mediana do stint).
        Simulação de qualificação = runs de até 4 voltas, até 4% da melhor volta. Simulação de corrida = 5 ou mais voltas seguidas; a ordem usa a média das primeiras 5 voltas de cada stint, para comparar a mesma distância.
        Degradação = segundos perdidos por volta, já sem o efeito do combustível a queimar (estimado).
        O combustível, os modos do motor e a evolução da pista não são conhecidos: o ritmo é uma pista, não uma verdade. Compara sempre o mesmo composto e vê quantas voltas há por trás de cada número.
      </p>
    </div>
  )
}
