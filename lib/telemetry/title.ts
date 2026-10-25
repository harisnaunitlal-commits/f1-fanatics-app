import type { ChampRow } from './engine'

// Pure maths for the title fight (no I/O) so it can be tested on its own.
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const pts = (pos: number): number => POINTS[pos - 1] ?? 0

export interface TitleRival { code: string; name: string; colour: string; pointsNow: number; margin: number; alive: boolean }
export interface TitleScenario { rival: string; rows: { rivalFinish: string; leaderNeeds: string }[] }
export interface TitleCondition { leaderFinish: string; rivals: { code: string; colour: string; mustFinish: string }[] }
export type TitleMode = 'live' | 'prerace' | 'done'
export interface TitleInfo {
  mode: TitleMode                 // live: race in progress · prerace: next race still to run · done: no races left
  raceName: string | null         // the race the scenarios refer to (live or next)
  leader: { code: string; name: string; colour: string; pointsNow: number; pointsStart: number }
  remainingRaces: number
  remainingMax: number            // most points still on offer after this race
  rivals: TitleRival[]            // drivers still mathematically able to catch the leader before this race ends
  clinchedIfEndsNow: boolean      // live: would be champion if the race ended now · prerace/done: already champion
  canClinchThisRace: boolean      // against the closest rival, at least one result closes the title in this race
  needed: number                  // lead over every rival needed to be champion today (> remainingMax)
  scenario: TitleScenario | null
  conditions: TitleCondition[]    // if the leader finishes P1 / P2: where each rival must finish for the title to be settled in this race
}

function finishLabel(p: number): string { return p >= 11 ? 'fora dos pontos' : `P${p}` }

export function titleInfo(drivers: ChampRow[], remainingRaces: number, remainingSprints: number, mode: TitleMode = 'live', raceName: string | null = null): TitleInfo | null {
  if (drivers.length < 2) return null
  const leader = drivers[0]
  const remainingMax = remainingRaces * 25 + remainingSprints * 8
  const others = drivers.slice(1)
  // a rival is still in the fight today if, with a perfect race today, they could pass the leader's total
  // even after the leader scores nothing more
  const rivals: TitleRival[] = others.filter(d => d.pointsStart + 25 + remainingMax >= leader.pointsStart).slice(0, 4).map(d => ({
    code: d.code, name: d.name, colour: d.colour, pointsNow: d.pointsNow, margin: leader.pointsNow - d.pointsNow,
    alive: d.pointsNow + remainingMax >= leader.pointsNow,
  }))
  // before the race (or with none left) the title is already decided only if the lead beats everything still on offer, today's race included
  const open = mode === 'prerace' ? remainingMax + 25 : remainingMax
  const clinchedIfEndsNow = others.every(d => leader.pointsNow - d.pointsNow > open)
  const needed = remainingMax + 1

  // what the leader needs today against the closest rival (by points before the race)
  let scenario: TitleScenario | null = null
  const closest = [...others].sort((a, b) => b.pointsStart - a.pointsStart)[0]
  if (closest) {
    const gap0 = leader.pointsStart - closest.pointsStart
    const rows: TitleScenario['rows'] = []
    for (const c of [1, 2, 3, 4, 5, 6, 11]) {
      // smallest points the leader must score to finish with a lead above remainingMax
      const need = remainingMax + 1 - gap0 + pts(c)
      let best = 0
      for (let k = 1; k <= 22; k++) if (pts(k) >= need) best = k
      rows.push({
        rivalFinish: finishLabel(c),
        leaderNeeds: need <= 0 ? 'já garantido' : best === 0 ? 'não chega hoje' : best === 1 ? 'ganhar' : `P${best} ou melhor`,
      })
    }
    scenario = { rival: closest.code, rows }
  }
  // for each leader result (win, 2nd): the worst each rival may finish. A rival with pts(p) >= threshold keeps the fight alive.
  const conditions: TitleCondition[] = []
  for (const [label, lp] of [['ganhar', 25], ['ser 2.º', 18]] as const) {
    const rs: TitleCondition['rivals'] = []
    for (const r of others) {
      if (r.pointsStart + 25 + remainingMax < leader.pointsStart) continue
      const thr = leader.pointsStart - r.pointsStart + lp - remainingMax   // rival must score strictly less than thr
      let must: string
      if (thr > 25) continue                                             // nothing the rival can do (even a win) keeps the fight alive
      if (thr <= 0) must = 'impossível'
      else { let p = 1; while (p <= 10 && pts(p) >= thr) p++; must = p >= 11 ? 'fora dos pontos' : `P${p} ou pior` }
      rs.push({ code: r.code, colour: r.colour, mustFinish: must })
    }
    conditions.push({ leaderFinish: label, rivals: rs })
  }
  const canClinchThisRace = !!scenario && scenario.rows.some(r => r.leaderNeeds !== 'não chega hoje')
  return { mode, raceName, canClinchThisRace, conditions, leader: { code: leader.code, name: leader.name, colour: leader.colour, pointsNow: leader.pointsNow, pointsStart: leader.pointsStart }, remainingRaces, remainingMax, rivals, clinchedIfEndsNow, needed, scenario }
}
