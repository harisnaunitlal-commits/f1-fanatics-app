import type { RawSession, OF1Driver, OF1Position, OF1Interval, OF1Stint, OF1Pit, OF1RaceControl, OF1Weather, OF1Lap, OF1Result, OF1Overtake, OF1Location, OF1ChampDriver, OF1ChampTeam } from './engine'

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

// Last upstream failure per endpoint (the admin diagnostics show it: a failing call silently serves the last good copy)
export const upstreamErrors = new Map<string, { at: number; msg: string }>()
// Straight call to OpenF1 with no cache of ours (nor Next's): tells whether the empty data is ours or theirs
export async function probe(endpoint: string, sessionKey: number): Promise<string> {
  try {
    const token = await getToken()
    const res = await fetch(`${BASE}/v1/${endpoint}?session_key=${sessionKey}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: 'no-store' })
    const txt = await res.text()
    let n: number | string = '?'
    try { const j = JSON.parse(txt); n = Array.isArray(j) ? j.length : String(j?.detail ?? txt).slice(0, 70) } catch { n = txt.slice(0, 70) }
    return `${endpoint}: HTTP ${res.status}, ${n}`
  } catch (e) { return `${endpoint}: erro ${String(e).slice(0, 60)}` }
}
export const hasToken = (): boolean => !!(tokenCache && tokenCache.exp > Date.now())

// OpenF1 allows 3 req/s without a token and 6 req/s with one: space the real upstream calls out.
let nextSlot = 0
async function throttle(gapMs: number) {
  const now = Date.now()
  const wait = Math.max(0, nextSlot - now)
  nextSlot = Math.max(now, nextSlot) + gapMs
  if (wait) await new Promise(r => setTimeout(r, wait))
}

// Identical requests that are already in flight share one upstream call (many viewers opening at once).
const inflight = new Map<string, Promise<unknown[]>>()

export function of1<T>(endpoint: string, filters: Filter[], ttlSec: number): Promise<T[]> {
  const qs = filters.map(([k, op, v]) => `${k}${op || '='}${encodeURIComponent(String(v))}`).join('&')
  const url = `${BASE}/v1/${endpoint}${qs ? `?${qs}` : ''}`
  const hit = memo.get(url)
  if (hit && Date.now() - hit.at < ttlSec * 1000) return Promise.resolve(hit.data as T[])
  const pending = inflight.get(url)
  if (pending) return pending as Promise<T[]>
  const p = fetchUpstream<T>(endpoint, url, ttlSec, hit?.data as T[] | undefined).finally(() => inflight.delete(url))
  inflight.set(url, p)
  return p
}

async function fetchUpstream<T>(endpoint: string, url: string, ttlSec: number, stale: T[] | undefined): Promise<T[]> {
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
    let body = ''
    try { body = (await res.text()).slice(0, 90) } catch { /* ignore */ }
    upstreamErrors.set(endpoint, { at: Date.now(), msg: `HTTP ${res.status}${token ? '' : ' (sem token)'} ${body}` })
    if (stale) return stale // rate-limited or upstream hiccup: keep serving the last good copy
    throw new Error(`OpenF1 ${endpoint} → HTTP ${res.status}`)
  }
  const data = await res.json() as T[] | { detail?: string }
  if (!Array.isArray(data)) { if (stale) return stale; throw new Error(`OpenF1 ${endpoint} → ${data?.detail ?? 'resposta inesperada'}`.slice(0, 160)) }
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
export const isoNoZ = (ms: number): string => new Date(ms).toISOString().slice(0, 23)

// Live refresh budget (sponsor plan: 60 req/min): position 8s, intervals 5s, location 5s, rc 12s, pit 20s,
// overtakes 20s, laps 25s, stints 40s, weather 60s, results 180s, championship 15min ≈ 50 req/min.
export async function loadRaw(sessionKey: number, tMs: number, live: boolean, sessionName: string): Promise<RawSession> {
  const sk: Filter = ['session_key', '', sessionKey]
  const ttl = (liveSec: number) => (live ? liveSec : 3600)
  const isRace = /race|sprint/i.test(sessionName) && !/qualif|shootout/i.test(sessionName)
  const [drivers, positions, stints, pits, raceControl, weather, laps, results, intervals, locations, overtakes, champDrivers, champTeams] = await Promise.all([
    of1<OF1Driver>('drivers', [sk], live ? 300 : 3600),
    of1<OF1Position>('position', [sk], ttl(8)),
    of1<OF1Stint>('stints', [sk], ttl(40)),
    of1<OF1Pit>('pit', [sk], ttl(20)),
    of1<OF1RaceControl>('race_control', [sk], ttl(12)),
    of1<OF1Weather>('weather', [sk], ttl(60)),
    of1<OF1Lap>('laps', [sk], ttl(25)),
    of1<OF1Result>('session_result', [sk], live ? 180 : 3600),
    isRace ? of1<OF1Interval>('intervals', [sk, ['date', '>=', isoNoZ(tMs - 90_000)], ['date', '<=', isoNoZ(tMs)]], ttl(5)) : Promise.resolve([] as OF1Interval[]),
    of1<OF1Location>('location', [sk, ['date', '>=', isoNoZ(tMs - 3_500)], ['date', '<=', isoNoZ(tMs)]], ttl(5)),
    isRace ? of1<OF1Overtake>('overtakes', [sk], ttl(20)) : Promise.resolve([] as OF1Overtake[]),
    isRace ? of1<OF1ChampDriver>('championship_drivers', [sk], live ? 900 : 3600) : Promise.resolve([] as OF1ChampDriver[]),
    isRace ? of1<OF1ChampTeam>('championship_teams', [sk], live ? 900 : 3600) : Promise.resolve([] as OF1ChampTeam[]),
  ])
  return { drivers, positions, intervals, stints, pits, raceControl, weather, laps, results, overtakes, locations, champDrivers, champTeams }
}

// Lighter load for the public championship page: only what the running order, retirements and the
// championship projection need (no intervals, locations, weather, stints, overtakes). The URLs match the
// ones loadRaw uses, so when the control room follows the same session these calls are shared.
export async function loadRawChamp(sessionKey: number, live: boolean): Promise<RawSession> {
  const sk: Filter = ['session_key', '', sessionKey]
  const ttl = (liveSec: number) => (live ? liveSec : 3600)
  const [drivers, positions, pits, raceControl, laps, results, champDrivers, champTeams] = await Promise.all([
    of1<OF1Driver>('drivers', [sk], live ? 300 : 3600),
    of1<OF1Position>('position', [sk], ttl(8)),
    of1<OF1Pit>('pit', [sk], ttl(20)),
    of1<OF1RaceControl>('race_control', [sk], ttl(12)),
    of1<OF1Lap>('laps', [sk], ttl(25)),
    of1<OF1Result>('session_result', [sk], live ? 180 : 3600),
    of1<OF1ChampDriver>('championship_drivers', [sk], live ? 900 : 3600),
    of1<OF1ChampTeam>('championship_teams', [sk], live ? 900 : 3600),
  ])
  return { drivers, positions, intervals: [], stints: [], pits, raceControl, weather: [], laps, results, overtakes: [], locations: [], champDrivers, champTeams }
}
