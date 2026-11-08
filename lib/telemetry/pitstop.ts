// Stationary time of a pit stop (the one the DHL Fastest Pit Stop Award measures). OpenF1 publishes it as pit.stop_duration, but
// sometimes only after the session. Until then it is estimated from the car's speed in the pit lane: the stretch where the car did
// not move. Resolution is the car_data rate (about 4 samples a second), so the estimate is good to roughly +-0.3 s.
//
// Every stop is estimated ONCE and the result is stored (table pit_stop_times), so it stays fixed: a finished race costs one cheap
// database read per poll, and during a race only the stops that appeared since the last poll are worked out.
import { of1, isoNoZ } from './openf1'
import { createServiceClient } from '@/lib/supabase/service'

interface CarSample { date: string; speed: number }

const STILL_KMH = 2
const MAX_ATTEMPTS = 3          // a stop with no usable data after this many tries is given up on (shown as "—")
const RETRY_AFTER_MS = 60_000   // between tries for the same stop
const SETTLE_MS = 45_000        // the car_data of a stop is complete some seconds after the car leaves the pit lane

export interface StopRef { key: string; num: number; at: string; laneS: number | null }
export type StopEstimates = Map<string, { s: number | null; pending: boolean }>

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

interface Stored { s: number | null; attempts: number; at: number }
// per server instance: what is already settled (final) for each session, so repeated polls do not even touch the database
const settled = new Map<number, Map<string, number | null>>()
const stored = new Map<number, Map<string, Stored>>()
const loadedAt = new Map<number, number>()

const isFinal = (r: Stored): boolean => r.s !== null || r.attempts >= MAX_ATTEMPTS

async function loadStored(sessionKey: number): Promise<Map<string, Stored>> {
  const rows = new Map<string, Stored>()
  try {
    const { data } = await createServiceClient().from('pit_stop_times').select('pit_key, est_s, attempts, updated_at').eq('session_key', sessionKey)
    for (const r of (data ?? []) as { pit_key: string; est_s: number | null; attempts: number; updated_at: string }[]) {
      rows.set(r.pit_key, { s: r.est_s === null ? null : Number(r.est_s), attempts: r.attempts, at: Date.parse(r.updated_at) })
    }
  } catch { /* table unreachable: work with what this instance knows */ }
  return rows
}

// Works out at most `maxNew` stops per call (each one car_data request); everything already settled is just read back.
export async function estimateStops(sessionKey: number, stops: StopRef[], maxNew: number, nowMs = Date.now()): Promise<StopEstimates> {
  const out: StopEstimates = new Map()
  const fin = settled.get(sessionKey) ?? new Map<string, number | null>()
  settled.set(sessionKey, fin)
  const take = (): StopRef[] => stops.filter(st => !fin.has(st.key))

  let need = take()
  if (need.length) {
    // first time this instance meets these stops (or new ones appeared): read what was stored by earlier calls
    let rows = stored.get(sessionKey)
    if (!rows || nowMs - (loadedAt.get(sessionKey) ?? 0) > 20_000) { rows = await loadStored(sessionKey); stored.set(sessionKey, rows); loadedAt.set(sessionKey, nowMs) }
    for (const st of need) { const r = rows.get(st.key); if (r && isFinal(r)) fin.set(st.key, r.s) }
    need = take()

    let done = 0
    for (const st of need) {
      if (done >= maxNew) break
      const exit = Date.parse(st.at)
      if (!Number.isFinite(exit) || nowMs - exit < SETTLE_MS) continue
      const prev = rows.get(st.key)
      if (prev && nowMs - prev.at < RETRY_AFTER_MS) continue
      done++
      const lane = Math.min(Math.max(st.laneS ?? 30, 8), 60)
      let value: number | null = null, usable = false
      try {
        const samples = await of1<CarSample>('car_data', [['session_key', '', sessionKey], ['driver_number', '', st.num], ['date', '>=', isoNoZ(exit - (lane + 3) * 1000)], ['date', '<=', isoNoZ(exit + 2000)]], 86_400)
        usable = samples.length >= 10
        value = usable ? stationary(samples) : null
      } catch { /* counts as a failed try */ }
      const rec: Stored = { s: value, attempts: usable ? MAX_ATTEMPTS : (prev?.attempts ?? 0) + 1, at: nowMs }   // data read but no stop found = final
      rows.set(st.key, rec)
      if (isFinal(rec)) fin.set(st.key, rec.s)
      try {
        await createServiceClient().from('pit_stop_times').upsert({ session_key: sessionKey, pit_key: st.key, est_s: rec.s, attempts: rec.attempts, updated_at: new Date(nowMs).toISOString() })
      } catch { /* kept in memory; written on a later poll */ }
    }
  }

  const rows = stored.get(sessionKey)
  for (const st of stops) {
    if (fin.has(st.key)) out.set(st.key, { s: fin.get(st.key) ?? null, pending: false })
    else out.set(st.key, { s: rows?.get(st.key)?.s ?? null, pending: true })
  }
  return out
}
