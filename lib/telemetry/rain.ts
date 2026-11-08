// Rain probability for the circuit: OpenF1 only says whether it is raining right now, so the chance of rain in the next
// hours comes from Open-Meteo (free forecast, no key). Only the circuit's place name goes out. It is a forecast, not a measurement.
export interface RainForecast {
  probNow: number | null                          // % chance in the current hour
  hours: { atMs: number; prob: number }[]         // next hours, one per full hour
  mmNext: number | null                           // mm expected in the next hour
  source: string
}

const geoCache = new Map<string, { lat: number; lon: number } | null>()
const fcCache = new Map<string, { at: number; value: RainForecast | null }>()

async function getJson(url: string): Promise<any> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), 3500)
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store' })
    return r.ok ? await r.json() : null
  } catch { return null } finally { clearTimeout(timer) }
}

async function geocode(place: string, country: string): Promise<{ lat: number; lon: number } | null> {
  const key = `${place}|${country}`
  if (geoCache.has(key)) return geoCache.get(key) ?? null
  const j = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=8&language=en&format=json`)
  const list: { latitude: number; longitude: number; country?: string }[] = j?.results ?? []
  const hit = list.find(x => x.country && country && x.country.toLowerCase() === country.toLowerCase()) ?? list[0] ?? null
  const v = hit ? { lat: hit.latitude, lon: hit.longitude } : null
  geoCache.set(key, v)
  return v
}

export async function rainForecast(place: string | null | undefined, country: string | null | undefined, nowMs: number): Promise<RainForecast | null> {
  if (!place) return null
  const pos = await geocode(place, country ?? '')
  if (!pos) return null
  const key = `${pos.lat.toFixed(2)},${pos.lon.toFixed(2)}`
  const cached = fcCache.get(key)
  if (cached && nowMs - cached.at < 10 * 60_000) return cached.value
  const j = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&hourly=precipitation_probability,precipitation&forecast_hours=6&timezone=UTC`)
  let value: RainForecast | null = null
  const times: string[] = j?.hourly?.time ?? [], probs: (number | null)[] = j?.hourly?.precipitation_probability ?? [], mm: (number | null)[] = j?.hourly?.precipitation ?? []
  if (times.length) {
    const rows = times.map((t, i) => ({ atMs: Date.parse(t + 'Z'), prob: probs[i], mm: mm[i] })).filter(r => Number.isFinite(r.atMs) && r.prob !== null && r.prob !== undefined)
    // the hour that contains "now" is the current chance; the following ones are the outlook
    const cur = [...rows].reverse().find(r => r.atMs <= nowMs) ?? rows[0]
    if (cur) {
      value = {
        probNow: cur.prob as number,
        hours: rows.filter(r => r.atMs > cur.atMs).slice(0, 3).map(r => ({ atMs: r.atMs, prob: r.prob as number })),
        mmNext: cur.mm ?? null,
        source: 'Open-Meteo',
      }
    }
  }
  fcCache.set(key, { at: nowMs, value })
  return value
}
