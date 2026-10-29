import type { ChampRow } from './engine'

// Pure maths for the title fight (no I/O) so it can be tested on its own.
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
const pts = (pos: number): number => POINTS[pos - 1] ?? 0

// Tie-break: equal points are decided by the number of wins. If the leader has more wins than a rival could
// ever reach (even winning every race left, today's included), a tie already counts as the title.
export interface TieBreak { wins: Record<string, number>; racesLeftInclThis: number }

export interface TitleRival { code: string; name: string; colour: string; pointsNow: number; margin: number; alive: boolean; need: number }
export interface TitleScenario { rival: string; rows: { rivalFinish: string; leaderNeeds: string }[] }
export interface TitleCondition { leaderFinish: string; rivals: { code: string; colour: string; mustFinish: string }[] }
export type TitleMode = 'live' | 'prerace' | 'done'
export interface TitleInfo {
  mode: TitleMode                 // live: race in progress · prerace: next race still to run · done: no races left
  raceName: string | null         // the race the scenarios refer to (live or next)
  leader: { code: string; name: string; colour: string; pointsNow: number; pointsStart: number; wins: number }
  remainingRaces: number
  remainingMax: number            // most points still on offer after this race
  rivals: TitleRival[]            // drivers still mathematically able to catch the leader before this race ends
  clinchedIfEndsNow: boolean      // live: would be champion if the race ended now · prerace/done: already champion
  canClinchThisRace: boolean      // against the closest rival, at least one result closes the title in this race
  needed: number                  // largest lead needed over any rival to be champion after this race
  tieFavours: boolean             // a points tie against every rival in the fight would be won on wins
  minPoints: number | null        // prerace: points the leader must score in this race if the toughest rival wins it (<= 0: any result)
  minPointsRival: string | null
  scenario: TitleScenario | null
  conditions: TitleCondition[]    // if the leader finishes P1 / P2: where each rival must finish for the title to be settled in this race
}

function finishLabel(p: number): string { return p >= 11 ? 'fora dos pontos' : `P${p}` }

export function titleInfo(
  drivers: ChampRow[], remainingRaces: number, remainingSprints: number,
  mode: TitleMode = 'live', raceName: string | null = null, tie?: TieBreak,
): TitleInfo | null {
  if (drivers.length < 2) return null
  const leader = drivers[0]
  const remainingMax = remainingRaces * 25 + remainingSprints * 8
  const others = drivers.slice(1)
  const fav = (code: string): boolean => !!tie && (tie.wins[leader.code] ?? 0) > (tie.wins[code] ?? 0) + tie.racesLeftInclThis
  const needFor = (code: string): number => remainingMax + (fav(code) ? 0 : 1)

  // a rival is still in the fight today if, with a perfect race today, they could pass the leader's total
  // even after the leader scores nothing more
  const inFight = others.filter(d => d.pointsStart + 25 + remainingMax >= leader.pointsStart)
  const rivals: TitleRival[] = inFight.slice(0, 4).map(d => ({
    code: d.code, name: d.name, colour: d.colour, pointsNow: d.pointsNow, margin: leader.pointsNow - d.pointsNow,
    alive: d.pointsNow + remainingMax >= leader.pointsNow, need: needFor(d.code),
  }))
  // before the race (or with none left) the title is already decided only if the lead beats everything still on offer, today's race included
  const extra = mode === 'prerace' ? 25 : 0
  const clinchedIfEndsNow = others.every(d => leader.pointsNow - d.pointsNow >= needFor(d.code) + extra)
  const needed = Math.max(remainingMax, ...inFight.map(d => needFor(d.code)))
  const tieFavours = inFight.length > 0 ? inFight.every(d => fav(d.code)) : fav(others[0].code)

  // what the leader needs today against the closest rival (by points before the race)
  let scenario: TitleScenario | null = null
  const closest = [...others].sort((a, b) => b.pointsStart - a.pointsStart)[0]
  if (closest) {
    const gap0 = leader.pointsStart - closest.pointsStart
    const rows: TitleScenario['rows'] = []
    for (const c of [1, 2, 3, 4, 5, 6, 11]) {
      // smallest points the leader must score to finish with the lead needed over this rival
      const need = needFor(closest.code) - gap0 + pts(c)
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
      const thr = leader.pointsStart - r.pointsStart + lp - remainingMax + (fav(r.code) ? 1 : 0)   // rival must score strictly less than thr
      let must: string
      if (thr > 25) continue                                             // nothing the rival can do (even a win) keeps the fight alive
      if (thr <= 0) must = 'impossível'
      else { let p = 1; while (p <= 10 && pts(p) >= thr) p++; must = p >= 11 ? 'fora dos pontos' : `P${p} ou pior` }
      rs.push({ code: r.code, colour: r.colour, mustFinish: must })
    }
    conditions.push({ leaderFinish: label, rivals: rs })
  }

  // worst case before the race: the toughest rival wins it. Points the leader must then score in the same race.
  let minPoints: number | null = null
  let minPointsRival: string | null = null
  if (mode === 'prerace') {
    for (const r of others) {
      const need = needFor(r.code) - (leader.pointsStart - r.pointsStart) + 25
      if (minPoints === null || need > minPoints) { minPoints = need; minPointsRival = r.code }
    }
  }

  const canClinchThisRace = !!scenario && scenario.rows.some(r => r.leaderNeeds !== 'não chega hoje')
  return {
    mode, raceName, canClinchThisRace, conditions, minPoints, minPointsRival, tieFavours,
    leader: { code: leader.code, name: leader.name, colour: leader.colour, pointsNow: leader.pointsNow, pointsStart: leader.pointsStart, wins: tie?.wins[leader.code] ?? 0 },
    remainingRaces, remainingMax, rivals, clinchedIfEndsNow, needed, scenario,
  }
}
