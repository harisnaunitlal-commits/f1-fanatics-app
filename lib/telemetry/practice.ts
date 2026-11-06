// Free practice: split every driver's laps into runs (out lap -> in lap) and sort them into qualifying simulations
// (short runs, one fast lap) and race simulations (long runs of consecutive laps). Fuel load and engine modes are unknown,
// so the UI always shows how many laps each number is built on.
import type { OF1Lap, OF1Stint } from './engine'

const FUEL = 0.035            // s per lap of fuel burn, same estimate as the race pace panel
const QUALI_RUN_MAX = 4       // clean laps in a run to count as a qualifying simulation
const QUALI_WINDOW = 1.04     // a quali lap must be within 4% of the session's best lap
const PUSH_WINDOW = 1.02      // laps within 2% of the driver's own best count as push laps
const RACE_RUN_MIN = 5        // clean laps in a row for a race simulation
const SLOW_LAP = 1.07         // laps slower than 107% of the run's median are dropped (traffic, yellow flags)
const RACE_WINDOW = 1.10      // a run whose average is slower than 110% of the session's best lap is not a race simulation

export interface QualiSimRow {
  code: string; colour: string
  best: number; lap: number
  compound: string | null; tyreAge: number | null
  gap: number                  // to the best qualifying simulation lap of the session
  pushLaps: number             // laps within 2% of their best in qualifying-type runs
}
export interface RaceSimRun {
  code: string; colour: string
  compound: string | null; tyreAgeStart: number | null
  lapStart: number; lapEnd: number; laps: number   // laps used (slow laps removed)
  avg5: number                 // mean of the first 5 used laps: the same distance for every run, so runs of different length compare fairly
  avg: number                  // mean lap time of all the used laps of the run
  deg: number | null           // s/lap lost to the tyres (slope + fuel burn correction)
}
export interface PracticeSim { quali: QualiSimRow[]; race: RaceSimRun[] }

function slope(pts: { x: number; y: number }[]): number | null {
  const n = pts.length
  if (n < 3) return null
  const mx = pts.reduce((a, p) => a + p.x, 0) / n, my = pts.reduce((a, p) => a + p.y, 0) / n
  let num = 0, den = 0
  for (const p of pts) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2 }
  return den === 0 ? null : num / den
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export interface PracticeDriver { num: number; code: string; colour: string }

export function buildPracticeSim(
  drivers: PracticeDriver[],
  lapsBy: Map<number, OF1Lap[]>,
  stints: OF1Stint[],
  isComplete: (l: OF1Lap) => boolean,
  deleted: Set<string>,
): PracticeSim {
  type Clean = { lap: number; t: number }
  type Run = { d: PracticeDriver; clean: Clean[] }
  const runs: Run[] = []

  for (const d of drivers) {
    const arr = lapsBy.get(d.num) ?? []
    // runs start at lap 1 and at every pit-out lap
    const groups: OF1Lap[][] = []
    for (const l of arr) {
      if (groups.length === 0 || l.is_pit_out_lap) groups.push([l])
      else groups[groups.length - 1].push(l)
    }
    groups.forEach((g, gi) => {
      const hasNext = gi < groups.length - 1
      const body = g.slice(1, hasNext ? g.length - 1 : g.length)   // out lap and (when the car came in) in lap do not count
      const clean = body
        .filter(l => isComplete(l) && l.lap_duration != null && !deleted.has(`${d.code}|${(l.lap_duration as number).toFixed(3)}`))
        .map(l => ({ lap: l.lap_number, t: l.lap_duration as number }))
      if (clean.length) runs.push({ d, clean })
    })
  }

  const stintAt = (num: number, lap: number): OF1Stint | undefined =>
    stints.find(s => s.driver_number === num && s.lap_start != null && s.lap_start <= lap && (s.lap_end == null || s.lap_end >= lap))
  const ageAt = (num: number, lap: number): number | null => {
    const s = stintAt(num, lap)
    return s ? (s.tyre_age_at_start ?? 0) + lap - (s.lap_start as number) : null
  }

  const all = runs.flatMap(r => r.clean.map(c => c.t))
  if (all.length === 0) return { quali: [], race: [] }
  const sessionBest = Math.min(...all)

  // ── qualifying simulations: short runs, best lap of each driver ──
  const quali: QualiSimRow[] = []
  for (const d of drivers) {
    const short = runs.filter(r => r.d.num === d.num && r.clean.length <= QUALI_RUN_MAX).flatMap(r => r.clean)
      .filter(c => c.t <= sessionBest * QUALI_WINDOW)
    if (short.length === 0) continue
    const best = short.reduce((a, c) => (c.t < a.t ? c : a))
    quali.push({
      code: d.code, colour: d.colour, best: best.t, lap: best.lap,
      compound: stintAt(d.num, best.lap)?.compound ?? null, tyreAge: ageAt(d.num, best.lap),
      gap: 0, pushLaps: short.filter(c => c.t <= best.t * PUSH_WINDOW).length,
    })
  }
  quali.sort((a, b) => a.best - b.best)
  for (const q of quali) q.gap = q.best - (quali[0]?.best ?? q.best)

  // ── race simulations: long runs ──
  const race: RaceSimRun[] = []
  for (const r of runs) {
    if (r.clean.length < RACE_RUN_MIN) continue
    const med = median(r.clean.map(c => c.t))
    const kept = r.clean.filter(c => c.t <= med * SLOW_LAP)
    if (kept.length < RACE_RUN_MIN) continue
    const avg = kept.reduce((a, c) => a + c.t, 0) / kept.length
    const avg5 = kept.slice(0, RACE_RUN_MIN).reduce((a, c) => a + c.t, 0) / RACE_RUN_MIN
    if (avg > sessionBest * RACE_WINDOW) continue
    const sl = slope(kept.map(c => ({ x: c.lap, y: c.t })))
    race.push({
      code: r.d.code, colour: r.d.colour,
      compound: stintAt(r.d.num, kept[0].lap)?.compound ?? null, tyreAgeStart: ageAt(r.d.num, kept[0].lap),
      lapStart: kept[0].lap, lapEnd: kept[kept.length - 1].lap, laps: kept.length, avg, avg5, deg: sl === null ? null : sl + FUEL,
    })
  }
  race.sort((a, b) => a.avg5 - b.avg5)
  return { quali, race }
}
