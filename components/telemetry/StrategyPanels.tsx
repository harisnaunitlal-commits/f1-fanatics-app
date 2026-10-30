import type { TelemetryState, PitWindowRow, StintStat, NeutralPeriod, RejoinSim } from '@/lib/telemetry/engine'
import { COMPOUND } from './ui'

const NAME: Record<string, string> = { SOFT: 'Macio', MEDIUM: 'Médio', HARD: 'Duro', INTERMEDIATE: 'Intermédio', WET: 'Chuva' }
const f2 = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`

const STATUS: Record<PitWindowRow['status'], { label: string; cls: string }> = {
  'sem-dados': { label: 'sem histórico', cls: 'bg-gray-700 text-gray-300' },
  cedo: { label: 'cedo', cls: 'bg-gray-700 text-gray-200' },
  janela: { label: 'JANELA ABERTA', cls: 'bg-green-700 text-white' },
  tarde: { label: 'ATRASADO', cls: 'bg-orange-600 text-white' },
  'sem-mais': { label: 'sem mais paragens', cls: 'bg-sky-900 text-sky-200' },
  'na-box': { label: 'NA BOX', cls: 'bg-blue-600 text-white' },
}

// Laps of the Safety Car / VSC / red flag periods as shaded bands (needs lap numbers from race control)
export function Bands({ neutral, total, lap }: { neutral: NeutralPeriod[]; total: number; lap: number }) {
  return (
    <>
      {neutral.filter(n => n.fromLap).map((n, i) => {
        const a = (n.fromLap as number), b = n.toLap ?? lap
        const left = ((a - 1) / total) * 100, width = Math.max(((b - a + 1) / total) * 100, 0.8)
        const col = n.kind === 'RED' ? 'rgba(239,68,68,.30)' : n.kind === 'SC' ? 'rgba(249,115,22,.32)' : 'rgba(250,204,21,.25)'
        return <span key={i} className="absolute top-0 bottom-0" style={{ left: `${left}%`, width: `${width}%`, background: col }} title={`${n.kind === 'SC' ? 'Safety Car' : n.kind === 'VSC' ? 'Virtual Safety Car' : 'Bandeira vermelha'} · voltas ${a}–${n.toLap ?? '…'}`} />
      })}
    </>
  )
}

// Top 10: stints (with laps per set), expected next pit window and Safety Car periods on one lap axis
export function PitWindowChart({ s }: { s: TelemetryState }) {
  const total = Math.max(s.totalLaps ?? 0, s.leaderLap, 10)
  const rows = s.pitWindows
  if (rows.length === 0) return <p className="text-xs text-gray-500">A janela de paragem aparece depois do arranque da corrida.</p>
  const hint = s.strategyHint
  const expected = hint ? Math.max(1, Math.round(hint.typicalStops)) : null
  const ticks = Array.from({ length: Math.floor(total / 10) + 1 }, (_, i) => i * 10).filter(v => v > 0 && v <= total)
  return (
    <div>
      <div className="relative ml-[3.25rem] mr-[8.5rem] h-4 text-[9px] text-gray-500">
        {ticks.map(v => <span key={v} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${(v / total) * 100}%` }}>{v}</span>)}
      </div>
      <div className="space-y-1.5">
        {rows.map(w => {
          const tower = s.tower.find(t => t.code === w.code)
          const st = STATUS[w.status]
          return (
            <div key={w.code} className="flex items-center gap-2">
              <span className="w-12 text-xs font-black text-gray-200 flex items-center gap-1.5"><span className="text-[10px] text-gray-500 font-bold w-3.5 text-right">{w.pos}</span>{w.code}</span>
              <div className="relative h-6 flex-1 rounded bg-white/5 overflow-hidden">
                <Bands neutral={s.neutral} total={total} lap={s.leaderLap} />
                {(tower?.stints ?? []).map((sg, i) => {
                  const end = sg.lapEnd ?? Math.max(tower?.lap ?? 0, sg.lapStart)
                  const left = ((sg.lapStart - 1) / total) * 100, width = ((end - sg.lapStart + 1) / total) * 100
                  const c = sg.compound ? COMPOUND[sg.compound] : null
                  return (
                    <span key={i} className="absolute top-1 bottom-1 rounded-sm flex items-center justify-center text-[9px] font-black text-black/80 overflow-hidden border-r border-black/50" style={{ left: `${left}%`, width: `${width}%`, background: c?.bar ?? '#555' }} title={`${NAME[sg.compound ?? ''] ?? '?'} · voltas ${sg.lapStart}–${end} (${end - sg.lapStart + 1}v)`}>
                      {width > 4 ? `${c?.letter ?? '?'} ${end - sg.lapStart + 1}` : ''}
                    </span>
                  )
                })}
                {w.windowFrom !== null && w.windowTo !== null && (
                  <span className="absolute top-0 bottom-0 border-2 border-dashed border-green-400/90 bg-green-400/15 rounded-sm" style={{ left: `${((w.windowFrom - 1) / total) * 100}%`, width: `${Math.max(((w.windowTo - w.windowFrom + 1) / total) * 100, 1.2)}%` }} title={`Janela prevista: voltas ${w.windowFrom}–${w.windowTo}`} />
                )}
                <span className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: `${(Math.min(s.leaderLap, total) / total) * 100}%` }} />
              </div>
              <span className={`w-[8.25rem] text-center text-[9px] font-black px-1.5 py-1 rounded ${st.cls}`}>
                {st.label}{w.expected !== null ? ` · ${w.stops}/${w.expected}` : ` · ${w.stops}`}
              </span>
            </div>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-[11px] text-gray-400">
        {['SOFT', 'MEDIUM', 'HARD'].map(k => <span key={k} className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: COMPOUND[k].bar }} />{NAME[k]}</span>)}
        <span className="inline-flex items-center gap-1"><span className="w-4 h-3 border-2 border-dashed border-green-400 bg-green-400/15 rounded-sm" />janela de paragem prevista</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(249,115,22,.5)' }} />Safety Car</span>
        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: 'rgba(250,204,21,.45)' }} />VSC</span>
        <span className="inline-flex items-center gap-1"><span className="w-0.5 h-3 bg-white" />volta actual</span>
      </div>
      <p className="text-[10px] text-gray-600 mt-1.5 leading-relaxed">
        {expected !== null
          ? <>Neste circuito, nas últimas edições, houve em média <b className="text-gray-400">{hint!.typicalStops.toFixed(1)} paragens por piloto</b> (sem contar Safety Car nem bandeira vermelha), por isso esperamos <b className="text-gray-400">{expected}</b>{hint!.firstStopLap ? <> e a 1.ª costuma ser à volta <b className="text-gray-400">{hint!.firstStopLap}</b></> : null}. Quem já fez essas paragens fica &quot;sem mais paragens&quot; e não volta a aparecer com janela de undercut. A estratégia real pode variar com o ritmo, o clima e os incidentes.</>
          : 'Sem histórico de paragens para este circuito: as janelas não são previstas, só se vêem os stints.'}
      </p>
    </div>
  )
}

// Is a stop under the Safety Car worth it for this driver? Judged by the pit window, not by the mere fact that a stop is cheaper.
function Worth({ w, lap }: { w?: PitWindowRow; lap: number }) {
  if (!w || w.status === 'sem-dados') return <span className="text-gray-500">sem histórico do circuito</span>
  if (w.status === 'sem-mais') return <span className="text-sky-300">já fez as paragens previstas</span>
  if (w.status === 'na-box') return <span className="text-blue-300">está na box</span>
  if (w.status === 'janela' || w.status === 'tarde') return <span className="text-green-300 font-bold">sim: está na janela, paragem barata</span>
  const n = w.windowFrom !== null ? w.windowFrom - lap : null
  if (n !== null && n <= 8) return <span className="text-yellow-300">talvez: a janela abre em {n} voltas</span>
  return <span className="text-gray-500">cedo: só {w.stintLaps} voltas neste pneu</span>
}

// Safety Car / VSC: where everybody would come out if they pitted now, and which stops are worth it
export function SafetyCarPanel({ s }: { s: TelemetryState }) {
  const active = s.status === 'SC' || s.status === 'SC_ENDING' || s.status === 'VSC' || s.status === 'VSC_ENDING' || s.status === 'RED'
  if (!active) return null
  const kind = s.status.startsWith('VSC') ? 'VSC' : s.status === 'RED' ? 'RED' : 'SC'
  const period = [...s.neutral].reverse().find(n => n.kind === kind) ?? s.neutral[s.neutral.length - 1]
  const title = kind === 'VSC' ? 'VIRTUAL SAFETY CAR' : kind === 'RED' ? 'BANDEIRA VERMELHA' : 'SAFETY CAR'
  const col = kind === 'VSC' ? 'bg-yellow-400 text-black' : kind === 'RED' ? 'bg-red-600 text-white' : 'bg-orange-500 text-black'
  const top = s.tower.filter(t => !t.out).slice(0, 10)
  const win = new Map(s.pitWindows.map(w => [w.code, w]))
  const leader = s.rejoin.find(r => r.code === top[0]?.code)
  const rows = top.map(t => ({ t, r: s.rejoin.find(x => x.code === t.code), w: win.get(t.code) })).filter((x): x is { t: typeof top[number]; r: RejoinSim; w: PitWindowRow | undefined } => !!x.r)
  return (
    <div className="rounded-2xl border-2 border-orange-400/70 bg-orange-950/20 p-4 space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-sm font-black px-3 py-1 rounded-full ${col}`}>🚨 {title}</span>
        <span className="text-xs text-gray-300">{period?.fromLap ? `anunciado na volta ${period.fromLap}` : 'em curso'} · a perda numa paragem cai para ~{s.pitLoss.nowS.toFixed(0)} s (em pista livre são {s.pitLoss.greenS.toFixed(0)} s)</span>
      </div>
      {leader && (
        <p className="text-sm text-gray-200">
          <b>Líder ({top[0].code})</b>: se parar agora, sai em <b className={leader.toPos > leader.fromPos ? 'text-red-400' : 'text-green-400'}>P{leader.toPos}</b>
          {leader.carAheadCode ? <> atrás de <b>{leader.carAheadCode}</b></> : ' ainda na frente'}{leader.carBehindCode ? <>, com <b>{leader.carBehindCode}</b> a {leader.carBehindGapS?.toFixed(1)} s</> : ''}.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
              <th className="py-1 px-1.5 text-center w-7">#</th><th className="py-1 px-1.5 text-left">Piloto</th><th className="py-1 px-1.5 text-center">Pneu</th>
              <th className="py-1 px-1.5 text-center">Se parar agora</th><th className="py-1 px-1.5 text-center">Perde/ganha</th><th className="py-1 px-1.5 text-left">Vale a pena?</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ t, r, w }) => {
              const d = r.toPos - r.fromPos
              const c = t.tyre ? COMPOUND[t.tyre] : null
              return (
                <tr key={t.code} className="border-b border-gray-800/50">
                  <td className="py-1 px-1.5 text-center text-gray-400 tabular-nums">{t.pos}</td>
                  <td className="py-1 px-1.5"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: t.colour }} /><b>{t.code}</b></span></td>
                  <td className="py-1 px-1.5 text-center">{c ? <span className="inline-flex items-center gap-1"><span className={`inline-flex w-4 h-4 rounded-full border-2 items-center justify-center text-[9px] font-black ${c.cls}`}>{c.letter}</span><span className="text-gray-400 tabular-nums">{t.tyreAge}v</span></span> : '—'}</td>
                  <td className="py-1 px-1.5 text-center tabular-nums font-bold">P{r.toPos}{r.carAheadCode ? <span className="text-gray-500 font-normal"> atrás de {r.carAheadCode}</span> : ''}</td>
                  <td className={`py-1 px-1.5 text-center tabular-nums font-black ${d <= 0 ? 'text-green-400' : d <= 2 ? 'text-yellow-300' : 'text-red-400'}`}>{d === 0 ? '=' : d > 0 ? `▼${d}` : `▲${-d}`}</td>
                  <td className="py-1 px-1.5 text-[11px]"><Worth w={w} lap={s.leaderLap} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-gray-500 leading-relaxed">Calculado com os intervalos actuais e o tempo real das paragens desta corrida (reduzido para ~50% sob SC e ~55% sob VSC). Quem para sob o SC perde menos tempo, mas perde posição para quem fica fora; o OpenF1 não dá a geometria da pit lane, por isso a saída das boxes é estimada pelo tempo, não por metros.</p>
    </div>
  )
}

// What each tyre change did to the pace (top 10): raw and with the fuel burn taken out
export function StintPaceTable({ s }: { s: TelemetryState }) {
  const rows = s.racePace.slice(0, 10).map(r => ({ r, ch: r.stints.map((st, i) => ({ st, prev: i > 0 ? r.stints[i - 1] : null })).filter(x => x.prev && x.st.vsPrev !== null) }))
  const any = rows.some(x => x.ch.length > 0)
  return (
    <div>
      {!any ? <p className="text-xs text-gray-500">Ainda ninguém completou um stint novo com voltas limpas suficientes para comparar.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
                <th className="py-1 px-1.5 text-left">Piloto</th><th className="py-1 px-1.5 text-left">Mudança</th><th className="py-1 px-1.5 text-right">Voltas</th>
                <th className="py-1 px-1.5 text-right" title="Mediana das voltas limpas do stint">Ritmo</th><th className="py-1 px-1.5 text-right" title="Ritmo do stint novo menos o anterior">Δ ritmo</th><th className="py-1 px-1.5 text-right" title="Mesma diferença tirando o combustível que o carro já gastou (~0,035 s/volta)">Δ sem combustível</th><th className="py-1 px-1.5 text-right">Degr. s/v</th>
              </tr>
            </thead>
            <tbody>
              {rows.flatMap(({ r, ch }) => ch.map(({ st, prev }, i) => {
                const a = (prev as StintStat).compound, b = st.compound
                const fuel = st.vsPrevFuel
                return (
                  <tr key={`${r.code}-${i}`} className="border-b border-gray-800/50">
                    <td className="py-1 px-1.5"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: r.colour }} /><b>{r.code}</b></span></td>
                    <td className="py-1 px-1.5 whitespace-nowrap">{NAME[a ?? ''] ?? '?'} → <b>{NAME[b ?? ''] ?? '?'}</b></td>
                    <td className="py-1 px-1.5 text-right tabular-nums text-gray-400">{st.lapStart}–{st.lapEnd ?? '…'}</td>
                    <td className="py-1 px-1.5 text-right tabular-nums text-gray-300">{st.pace?.toFixed(2)}</td>
                    <td className={`py-1 px-1.5 text-right tabular-nums font-bold ${(st.vsPrev as number) < 0 ? 'text-green-400' : 'text-red-400'}`}>{f2(st.vsPrev as number)}</td>
                    <td className={`py-1 px-1.5 text-right tabular-nums ${fuel === null ? 'text-gray-600' : fuel < 0 ? 'text-green-400' : 'text-red-400'}`}>{fuel === null ? '—' : f2(fuel)}</td>
                    <td className="py-1 px-1.5 text-right tabular-nums text-gray-400">{st.deg === null ? '—' : f2(st.deg)}</td>
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-gray-600 mt-1.5 leading-relaxed">Δ ritmo = mediana das voltas limpas do stint novo menos a do stint anterior, em s/volta (negativo = mais rápido). Como o carro fica mais leve a cada volta, a coluna &quot;sem combustível&quot; tira ~0,035 s por volta de corrida para mostrar o efeito do pneu em si. Estimativa: ignora tráfego, clima e modo do motor.</p>
    </div>
  )
}
