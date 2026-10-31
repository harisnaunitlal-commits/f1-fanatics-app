// Corner numbers for the track map. OpenF1 has no circuit layout, so they come from MultiViewer's public circuit
// data (the same one used by FastF1): x/y of every numbered corner in the same coordinate system as the car positions.
// A third-party source can disappear or be shifted, so it is only used when it lines up with the outline we drew
// from the real cars; otherwise no corner numbers are shown.

export interface Corner { n: string; x: number; y: number; angle: number }

interface MvCircuit { corners?: { number: number; letter?: string; angle: number; trackPosition: { x: number; y: number } }[] }

const cache = new Map<string, { at: number; v: Corner[] | null }>()

async function load(circuitKey: number, year: number): Promise<Corner[] | null> {
  const k = `${circuitKey}|${year}`
  const hit = cache.get(k)
  if (hit && Date.now() - hit.at < (hit.v ? 86_400_000 : 600_000)) return hit.v
  let v: Corner[] | null = null
  for (const y of [year, year - 1]) {
    try {
      const res = await fetch(`https://api.multiviewer.app/api/v1/circuits/${circuitKey}/${y}`, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(6000), next: { revalidate: 86_400 } })
      if (!res.ok) continue
      const j = await res.json() as MvCircuit
      const c = (j.corners ?? []).map(c => ({ n: `${c.number}${c.letter ?? ''}`, x: c.trackPosition.x, y: c.trackPosition.y, angle: c.angle }))
      if (c.length) { v = c; break }
    } catch { /* try the previous year, then give up quietly */ }
  }
  cache.set(k, { at: Date.now(), v })
  return v
}

export async function trackCorners(circuitKey: number, year: number, outline: { x: number; y: number }[]): Promise<Corner[] | null> {
  const corners = await load(circuitKey, year)
  if (!corners || outline.length < 20) return null
  const xs = outline.map(p => p.x), ys = outline.map(p => p.y)
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1)
  const near = corners.filter(c => outline.some(p => Math.hypot(p.x - c.x, p.y - c.y) < span * 0.05)).length
  return near >= corners.length * 0.75 ? corners : null
}
