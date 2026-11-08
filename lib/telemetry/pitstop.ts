// Stationary time of a pit stop (the one the DHL Fastest Pit Stop Award measures). OpenF1 publishes it as pit.stop_duration, but
// sometimes only after the session. Until then it is estimated from the car's speed in the pit lane: the stretch where the car did
// not move. Resolution is the car_data rate (about 4 samples a second), so the estimate is good to roughly +-0.3 s.
import { of1, isoNoZ } from './openf1'

interface CarSample { date: string; speed: number }

const cache = new Map<string, number | null>()   // null = looked, no stop found
const STILL_KMH = 2

export interface StopRef { key: string; num: number; at: string; laneS: number | null }

export function stationary(samples: CarSample[]): number | null {
  const s = samples.map(x => ({ t: Date.parse(x.date), v: x.speed })).filter(x => Number.isFinite(x.t)).sort((a, b) => a.t - b.t)
  let best: number | null = null
  for (let i = 0; i < s.length; i++) {
    if (s[i].v > STILL_KMH) continue
    let j = i
    while (j + 1 < s.length && s[j + 1].v <= STILL_KMH) j++
    if (i > 0 && j + 1 < s.length) {   // the run needs a moving sample on both sides, otherwise the window cut it
      const dur = ((s[j].t + s[j + 1].t) / 2 - (s[i - 1].t + s[i].t) / 2) / 1000
      if (best === null || dur > best) best = dur
    }
    i = j
  }
  return best !== null && best >= 1 && best <= 45 ? Math.round(best * 10) / 10 : null
}

// Estimates at most `maxNew` stops per call (each is one car_data request); the rest fill in on the next polls.
export async function estimateStops(sessionKey: number, stops: StopRef[], maxNew = 3): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>()
  let fetched = 0
  for (const st of stops) {
    const ck = `${sessionKey}|${st.key}`
    if (cache.has(ck)) { out.set(st.key, cache.get(ck) ?? null); continue }
    if (fetched >= maxNew) continue
    fetched++
    const exit = Date.parse(st.at)
    if (!Number.isFinite(exit)) continue
    const lane = Math.min(Math.max(st.laneS ?? 30, 8), 60)
    try {
      const rows = await of1<CarSample>('car_data', [['session_key', '', sessionKey], ['driver_number', '', st.num], ['date', '>=', isoNoZ(exit - (lane + 3) * 1000)], ['date', '<=', isoNoZ(exit + 2000)]], 86_400)
      if (rows.length < 10) continue   // data not there yet: try again next time
      const v = stationary(rows)
      cache.set(ck, v)
      out.set(st.key, v)
    } catch { /* next poll */ }
  }
  return out
}
