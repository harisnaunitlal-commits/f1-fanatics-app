// Lap telemetry comparison: turns raw car_data samples of two laps into aligned series.
// OpenF1 has no distance channel, so distance is integrated from speed and both laps are normalised to 0..1.

export interface CarSample { date: string; speed: number | null; throttle: number | null; brake: number | null; n_gear: number | null; rpm: number | null; drs: number | null }

export interface LapTrace {
  code: string
  colour: string
  lap: number
  lapTime: number
  t: number[]
  speed: number[]
  throttle: number[]
  brake: number[]
  gear: number[]
  drs: number[]
  topSpeed: number
  minSpeed: number
}

export interface CompareData {
  mode: 'best' | 'last'
  a: LapTrace
  b: LapTrace
  fractions: number[]
  delta: number[] // tA - tB at each fraction of the lap: positive = A is behind
}

export const COMPARE_POINTS = 120

export function resampleLap(samples: CarSample[], startMs: number, lapTime: number, meta: { code: string; colour: string; lap: number }, points = COMPARE_POINTS): LapTrace | null {
  const s = samples
    .map(x => ({ ...x, tms: Date.parse(x.date) }))
    .filter(x => x.tms >= startMs - 300 && x.tms <= startMs + lapTime * 1000 + 300 && x.speed != null)
    .sort((a, b) => a.tms - b.tms)
  if (s.length < 20) return null

  const tau = s.map(x => Math.max(0, (x.tms - startMs) / 1000))
  const dist: number[] = [0]
  for (let i = 1; i < s.length; i++) {
    const dt = tau[i] - tau[i - 1]
    dist.push(dist[i - 1] + (((s[i - 1].speed as number) + (s[i].speed as number)) / 2 / 3.6) * dt)
  }
  const total = dist[dist.length - 1]
  if (total <= 0) return null
  const lastTau = tau[tau.length - 1]
  const scale = lastTau > 0 && Math.abs(lastTau - lapTime) / lapTime < 0.03 ? lapTime / lastTau : 1
  const frac = dist.map(d => d / total)

  const out: LapTrace = { ...meta, lapTime, t: [], speed: [], throttle: [], brake: [], gear: [], drs: [], topSpeed: 0, minSpeed: 999 }
  let j = 0
  for (let k = 0; k < points; k++) {
    const f = k / (points - 1)
    while (j < s.length - 2 && frac[j + 1] < f) j++
    const f0 = frac[j], f1 = frac[j + 1]
    const w = f1 > f0 ? Math.min(1, Math.max(0, (f - f0) / (f1 - f0))) : 0
    const lerp = (a: number, b: number) => a + (b - a) * w
    const near = w < 0.5 ? s[j] : s[j + 1]
    out.t.push(lerp(tau[j], tau[j + 1]) * scale)
    const sp = lerp(s[j].speed as number, s[j + 1].speed as number)
    out.speed.push(Math.round(sp))
    out.throttle.push(Math.round(lerp(s[j].throttle ?? 0, s[j + 1].throttle ?? 0)))
    out.brake.push(near.brake && near.brake > 0 ? 100 : 0)
    out.gear.push(near.n_gear ?? 0)
    out.drs.push((near.drs ?? 0) >= 10 ? 1 : 0)
    out.topSpeed = Math.max(out.topSpeed, sp)
    out.minSpeed = Math.min(out.minSpeed, sp)
  }
  out.topSpeed = Math.round(out.topSpeed); out.minSpeed = Math.round(out.minSpeed)
  return out
}

export function compareLaps(mode: 'best' | 'last', a: LapTrace, b: LapTrace): CompareData {
  const fractions = a.t.map((_, i) => i / (a.t.length - 1))
  return { mode, a, b, fractions, delta: a.t.map((t, i) => Math.round((t - b.t[i]) * 1000) / 1000) }
}
