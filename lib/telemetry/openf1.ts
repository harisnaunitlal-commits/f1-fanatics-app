import type { RawSession, OF1Driver, OF1Position, OF1Interval, OF1Stint, OF1Pit, OF1RaceControl, OF1Weather, OF1Lap, OF1Result } from './engine'

const BASE = 'https://api.openf1.org'

// Credentials live only in server env vars (OPENF1_USERNAME / OPENF1_PASSWORD). Tokens last 1 hour.
let tokenCache: { token: string; exp: number } | null = null

async function getToken(): Promise<string | null> {
  const u = process.env.OPENF1_USERNAME, p = process.env.OPENF1_PASSWORD
  if (!u || !p) return null
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token
  try {
    const res = await fetch(`${BASE}/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: u, password: p }), cache: 'no-store',
    })
    if (!res.ok) return null
    const j = await res.json() as { access_token: string; expires_in?: string | number }
    tokenCache = { token: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 }
    return tokenCache.token
  } catch { return null }
}

// Explicit credential test for the control room (getToken above fails silently by design).
export async function checkCredentials(): Promise<{ configured: boolean; ok: boolean; status?: number; expiresIn?: number }> {
  const u = process.env.OPENF1_USERNAME, p = process.env.OPENF1_PASSWORD
  if (!u || !p) return { configured: false, ok: false }
  try {
    const res = await fetch(`${BASE}/token`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: u, password: p }), cache: 'no-store',
    })
    if (!res.ok) return { configured: true, ok: false, status: res.status }
    const j = await res.json() as { expires_in?: string | number }
    return { configured: true, ok: true, expiresIn: Number(j.expires_in) || undefined }
  } catch { return { configured: true, ok: false } }
}

export function hasLiveCredentials(): boolean {
  return !!(process.env.OPENF1_USERNAME && process.env.OPENF1_PASSWORD)
}

type Filter = [key: string, op: '' | '>=' | '<=', value: string | number]

const memo = new Map<string, { at: number; data: unknown[] }>()

// OpenF1 allows 3 req/s without a token and 6 req/s with one: space the real upstream calls out.
let nextSlot = 0
async function throttle(gapMs: number) {
  const now = Date.now()
  const wait = Math.max(0, nextSlot - now)
  nextSlot = Math.max(now, nextSlot) + gapMs
  if (wait) await new Promise(r => setTimeout(r, wait))
}

export async function of1<T>(endpoint: string, filters: Filter[], ttlSec: number): Promise<T[]> {
  const qs = filters.map(([k, op, v]) => `${k}${op || '='}${encodeURIComponent(String(v))}`).join('&')
  const url = `${BASE}/v1/${endpoint}${qs ? `?${qs}` : ''}`
  const hit = memo.get(url)
  if (hit && Date.now() - hit.at < ttlSec * 1000) return hit.data as T[]
  const token = await getToken()
  let res: Response | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await throttle(token ? 200 : 380)
    res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, next: { revalidate: ttlSec } })
    if (res.status !== 429) break
    await new Promise(r => setTimeout(r, 1200 * (attempt + 1)))
  }
  if (!res) throw new Error(`OpenF1 ${endpoint} → sem resposta`)
  if (res.status === 404) { memo.set(url, { at: Date.now(), data: [] }); return [] }
  if (!res.ok) {
    if (hit) return hit.data as T[] // rate-limited or upstream hiccup: keep serving the last good copy
    throw new Error(`OpenF1 ${endpoint} → HTTP ${res.status}`)
  }
  const data = await res.json() as T[]
  memo.set(url, { at: Date.now(), data })
  if (memo.size > 400) memo.delete(memo.keys().next().value as string)
  return data
}

export interface SessionMeta { session_key: number; session_name: string; session_type: string; date_start: string; date_end: string; meeting_key: number; country_name: string; circuit_short_name: string; year: number }

export async function listSessions(year: number): Promise<SessionMeta[]> {
  const rows = await of1<SessionMeta>('sessions', [['year', '', year]], 600)
  return rows.sort((a, b) => Date.parse(a.date_start) - Date.parse(b.date_start))
}

// Loads everything the engine needs for one session. Static datasets are cached for long when the
// session is over (replay) and for a few seconds when it is live. Intervals are fetched as a short
// window around t: they are by far the biggest dataset.
export async function loadRaw(sessionKey: number, tMs: number, live: boolean): Promise<RawSession> {
  const sk: Filter = ['session_key', '', sessionKey]
  const ttl = (liveSec: number) => (live ? liveSec : 3600)
  const from = new Date(tMs - 90_000).toISOString().slice(0, 19)
  const to = new Date(tMs).toISOString().slice(0, 19)
  const [drivers, positions, stints, pits, raceControl, weather, laps, results, intervals] = await Promise.all([
    of1<OF1Driver>('drivers', [sk], live ? 300 : 3600),
    of1<OF1Position>('position', [sk], ttl(4)),
    of1<OF1Stint>('stints', [sk], ttl(15)),
    of1<OF1Pit>('pit', [sk], ttl(8)),
    of1<OF1RaceControl>('race_control', [sk], ttl(6)),
    of1<OF1Weather>('weather', [sk], ttl(30)),
    of1<OF1Lap>('laps', [sk], ttl(12)),
    of1<OF1Result>('session_result', [sk], live ? 60 : 3600),
    of1<OF1Interval>('intervals', [sk, ['date', '>=', from], ['date', '<=', to]], ttl(4)),
  ])
  return { drivers, positions, intervals, stints, pits, raceControl, weather, laps, results }
}
