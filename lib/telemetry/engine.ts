// Telemetry engine: turns raw OpenF1 datasets into the state shown on /telemetria at a given instant.
// Pure functions, no I/O and no runtime imports, so the same code serves replay and live.

export interface OF1Driver { driver_number: number; name_acronym: string; full_name: string; team_name: string; team_colour: string; headshot_url?: string | null }
export interface OF1Position { date: string; driver_number: number; position: number }
export interface OF1Interval { date: string; driver_number: number; gap_to_leader: number | string | null; interval: number | string | null }
export interface OF1Stint { stint_number: number; driver_number: number; lap_start: number | null; lap_end: number | null; compound: string | null; tyre_age_at_start: number | null }
export interface OF1Pit { date: string; driver_number: number; lap_number: number | null; lane_duration: number | null; pit_duration?: number | null; stop_duration: number | null }
export interface OF1RaceControl { date: string; driver_number: number | null; lap_number: number | null; category: string; flag: string | null; scope: string | null; sector: number | null; message: string }
export interface OF1Weather { date: string; air_temperature: number; track_temperature: number; humidity: number; pressure: number; rainfall: number; wind_speed: number; wind_direction: number }
export interface OF1Lap { driver_number: number; lap_number: number; date_start: string | null; lap_duration: number | null; is_pit_out_lap: boolean | null }
export interface OF1Result { driver_number: number; position: number | null; number_of_laps: number | null; dnf: boolean; dns: boolean; dsq: boolean }

export interface RawSession {
  drivers: OF1Driver[]
  positions: OF1Position[]
  intervals: OF1Interval[]
  stints: OF1Stint[]
  pits: OF1Pit[]
  raceControl: OF1RaceControl[]
  weather: OF1Weather[]
  laps: OF1Lap[]
  results: OF1Result[]
}

export type TrackStatus = 'NOT_STARTED' | 'GREEN' | 'VSC' | 'VSC_ENDING' | 'SC' | 'SC_ENDING' | 'RED' | 'FINISHED'

export interface StintInfo { compound: string | null; lapStart: number; lapEnd: number | null; ageAtStart: number }

export interface TowerRow {
  pos: number
  num: number
  code: string
  name: string
  team: string
  colour: string
  gapLabel: string
  intervalLabel: string
  gapS: number | null
  intervalS: number | null
  lapsDown: number
  lap: number
  lastLap: number | null
  bestLap: number | null
  tyre: string | null
  tyreAge: number | null
  stops: number
  inPit: boolean
  out: boolean
  stints: StintInfo[]
  degPerLap: number | null
}

export interface RejoinSim {
  code: string
  fromPos: number
  toPos: number
  lossS: number
  carAheadCode: string | null
  carAheadGapS: number | null
  carBehindCode: string | null
  carBehindGapS: number | null
  cleanAir: boolean
}

export interface UndercutAlert { attacker: string; target: string; intervalS: number; attackerAge: number; targetAge: number; strength: 'forte' | 'possível' }

export type RcKind = 'flag' | 'safetycar' | 'penalty' | 'investigation' | 'noted' | 'cleared' | 'deleted' | 'info'
export interface RcItem { date: string; lap: number | null; kind: RcKind; flag: string | null; code: string | null; message: string }

export interface WeatherInfo { air: number; track: number; humidity: number; wind: number; windDir: number; rain: boolean; trackTrend: number | null }

export interface TelemetryState {
  t: string
  started: boolean
  status: TrackStatus
  yellowSectors: number[]
  leaderLap: number
  totalLaps: number | null
  tower: TowerRow[]
  fastestLap: { code: string; time: number; lap: number } | null
  pitLoss: { greenS: number; nowS: number; samples: number; source: 'medida' | 'estimada' }
  rejoin: RejoinSim[]
  undercuts: UndercutAlert[]
  events: { sc: number; vsc: number; red: number }
  raceControl: RcItem[]
  penalties: RcItem[]
  deletedLaps: number
  weather: WeatherInfo | null
  firstRetirement: string | null
}

// ───────────────────────────── helpers ─────────────────────────────
const ms = (s: string): number => Date.parse(s)

function median(xs: number[]): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

function parseGap(v: number | string | null | undefined): { sec: number | null; lapsDown: number } {
  if (v === null || v === undefined) return { sec: null, lapsDown: 0 }
  if (typeof v === 'number') return { sec: v, lapsDown: 0 }
  const m = /(\d+)\s*LAP/i.exec(v)
  if (m) return { sec: null, lapsDown: parseInt(m[1], 10) }
  const f = parseFloat(v.replace('+', ''))
  return { sec: Number.isFinite(f) ? f : null, lapsDown: 0 }
}

function parseLapTime(s: string): number | null {
  const m = /(\d+):(\d{2}\.\d{3})/.exec(s)
  return m ? parseInt(m[1], 10) * 60 + parseFloat(m[2]) : null
}

function slope(points: { x: number; y: number }[]): number | null {
  const n = points.length
  if (n < 4) return null
  const mx = points.reduce((a, p) => a + p.x, 0) / n
  const my = points.reduce((a, p) => a + p.y, 0) / n
  let num = 0, den = 0
  for (const p of points) { num += (p.x - mx) * (p.y - my); den += (p.x - mx) ** 2 }
  return den === 0 ? null : num / den
}

function codeFromMessage(msg: string): string | null {
  const m = /\(([A-Z]{3})\)/.exec(msg)
  return m ? m[1] : null
}

function classifyRc(r: OF1RaceControl): RcKind {
  const msg = r.message.toUpperCase()
  if (r.category === 'SafetyCar') return 'safetycar'
  if (r.category === 'Flag') return 'flag'
  if (msg.includes('DELETED')) return 'deleted'
  if (msg.includes('PENALTY') || msg.includes('DISQUALIFIED') || msg.includes('DRIVE THROUGH') || msg.includes('STOP/GO')) return 'penalty'
  if (msg.includes('NO FURTHER') || msg.includes('NO INVESTIGATION')) return 'cleared'
  if (msg.includes('INVESTIGAT')) return 'investigation'
  if (msg.includes('NOTED')) return 'noted'
  return 'info'
}

// Track status machine over race-control messages up to instant t.
function trackStatusAt(rc: OF1RaceControl[], t: number): { status: TrackStatus; yellow: number[]; sc: number; vsc: number; red: number; chequeredMs: number | null; redEndMs: number | null; startMs: number | null } {
  let status: TrackStatus = 'NOT_STARTED'
  let sc = 0, vsc = 0, red = 0
  let chequeredMs: number | null = null
  let redEndMs: number | null = null
  let startMs: number | null = null
  let endingAt = 0
  const yellow = new Set<number>()
  for (const r of rc) {
    const at = ms(r.date)
    if (at > t) break
    const msg = r.message.toUpperCase()
    if (r.category === 'SessionStatus') {
      if (msg.includes('STARTED') && startMs === null) startMs = at
      if (msg.includes('STARTED')) { if (status === 'RED') redEndMs = at; status = 'GREEN' }
      continue
    }
    if (r.category === 'SafetyCar') {
      if (msg.includes('VSC DEPLOYED') || msg.includes('VIRTUAL SAFETY CAR DEPLOYED')) { status = 'VSC'; vsc++ }
      else if (msg.includes('VSC ENDING')) { status = 'VSC_ENDING'; endingAt = at }
      else if (msg.includes('SAFETY CAR DEPLOYED')) { status = 'SC'; sc++ }
      else if (msg.includes('IN THIS LAP')) { status = 'SC_ENDING'; endingAt = at }
      continue
    }
    if (r.category === 'Flag') {
      const f = (r.flag ?? '').toUpperCase()
      if (f === 'CHEQUERED') { if (chequeredMs === null) chequeredMs = at; status = 'FINISHED' }
      else if (f === 'RED') { red++; status = 'RED' }
      else if ((f === 'GREEN' || f === 'CLEAR') && (r.scope === 'Track' || r.scope === null)) {
        if (status === 'RED') redEndMs = at
        if (status !== 'FINISHED' && status !== 'NOT_STARTED') status = 'GREEN'
        yellow.clear()
      } else if ((f === 'YELLOW' || f === 'DOUBLE YELLOW') && r.sector != null) yellow.add(r.sector)
      else if (f === 'CLEAR' && r.sector != null) yellow.delete(r.sector)
    }
  }
  // Safety-car "ending" phases do not always get an explicit green flag in the feed.
  if (status === 'VSC_ENDING' && t - endingAt > 45_000) status = 'GREEN'
  if (status === 'SC_ENDING' && t - endingAt > 120_000) status = 'GREEN'
  return { status, yellow: Array.from(yellow).sort((a, b) => a - b), sc, vsc, red, chequeredMs, redEndMs, startMs }
}

// ───────────────────────────── main ─────────────────────────────
export function buildState(raw: RawSession, tMs: number, totalLapsHint: number | null = null): TelemetryState {
  const drivers = new Map(raw.drivers.map(d => [d.driver_number, d]))
  const rc = [...raw.raceControl].sort((a, b) => ms(a.date) - ms(b.date))
  const ts = trackStatusAt(rc, tMs)
  const started = ts.status !== 'NOT_STARTED'

  // latest position per driver
  const posBy = new Map<number, number>()
  for (const p of raw.positions) { if (ms(p.date) <= tMs) posBy.set(p.driver_number, p.position) }

  // laps per driver
  const lapsBy = new Map<number, OF1Lap[]>()
  for (const l of raw.laps) {
    if (!l.date_start || ms(l.date_start) > tMs) continue
    const arr = lapsBy.get(l.driver_number) ?? []
    arr.push(l)
    lapsBy.set(l.driver_number, arr)
  }
  for (const arr of Array.from(lapsBy.values())) arr.sort((a, b) => a.lap_number - b.lap_number)

  // deleted lap times (track limits etc.) must not count as fastest laps
  const deleted = new Set<string>()
  for (const r of rc) {
    if (ms(r.date) > tMs) break
    if (!r.message.toUpperCase().includes('DELETED')) continue
    const code = codeFromMessage(r.message); const lt = parseLapTime(r.message)
    if (code && lt !== null) deleted.add(`${code}|${lt.toFixed(3)}`)
  }

  const isComplete = (l: OF1Lap): boolean => l.lap_duration != null && l.date_start != null && ms(l.date_start) + l.lap_duration * 1000 <= tMs

  // reference lap time from the leader's recent clean laps
  const leaderNum = Array.from(posBy.entries()).sort((a, b) => a[1] - b[1])[0]?.[0]
  const leaderClean = (lapsBy.get(leaderNum ?? -1) ?? []).filter(l => isComplete(l) && !l.is_pit_out_lap && l.lap_number > 1).map(l => l.lap_duration as number)
  const refLap = median(leaderClean.slice(-8)) ?? 95

  // pit stops so far
  const pits = raw.pits.filter(p => ms(p.date) <= tMs).sort((a, b) => ms(a.date) - ms(b.date))
  const pitsBy = new Map<number, OF1Pit[]>()
  for (const p of pits) { const a = pitsBy.get(p.driver_number) ?? []; a.push(p); pitsBy.set(p.driver_number, a) }

  // retirement detection (heuristic: a car that stopped starting laps while others keep going)
  const effT = ts.chequeredMs !== null ? Math.min(tMs, ts.chequeredMs) : tMs
  const threshold = Math.max(200_000, refLap * 2.3 * 1000)
  const afterRed = ts.redEndMs !== null && effT - ts.redEndMs < 360_000
  const lastStart = new Map<number, number>()
  for (const [num, arr] of Array.from(lapsBy.entries())) { const last = arr[arr.length - 1]; if (last?.date_start) lastStart.set(num, ms(last.date_start)) }
  const resultBy = new Map(raw.results.map(r => [r.driver_number, r]))
  const outSet = new Set<number>()
  for (const num of Array.from(posBy.keys())) {
    const res = resultBy.get(num)
    if (ts.chequeredMs !== null && tMs >= ts.chequeredMs && res) { if (res.dnf || res.dns || res.dsq) outSet.add(num); continue }
    const ls = lastStart.get(num)
    if (ls === undefined || !started || ts.status === 'RED' || afterRed) continue
    const lastPit = pitsBy.get(num)?.slice(-1)[0]
    const inPitNow = lastPit ? effT - ms(lastPit.date) < ((lastPit.lane_duration ?? 25) + 10) * 1000 : false
    if (effT - ls > threshold && !inPitNow) outSet.add(num)
  }
  const outOrder = Array.from(outSet).filter(n => lastStart.has(n)).sort((a, b) => (lastStart.get(a) ?? 0) - (lastStart.get(b) ?? 0))
  const firstRetirement = outOrder.length ? drivers.get(outOrder[0])?.name_acronym ?? null : null

  // latest interval per driver
  const ivBy = new Map<number, OF1Interval>()
  for (const i of raw.intervals) { if (ms(i.date) <= tMs) { const cur = ivBy.get(i.driver_number); if (!cur || ms(i.date) >= ms(cur.date)) ivBy.set(i.driver_number, i) } }

  // build rows
  const rows: TowerRow[] = []
  let fastest: { code: string; time: number; lap: number } | null = null
  for (const [num, position] of Array.from(posBy.entries())) {
    const d = drivers.get(num); if (!d) continue
    const dl = lapsBy.get(num) ?? []
    const lap = dl.length ? dl[dl.length - 1].lap_number : 0
    const done = dl.filter(isComplete)
    const valid = done.filter(l => !deleted.has(`${d.name_acronym}|${(l.lap_duration as number).toFixed(3)}`))
    const lastDone = done[done.length - 1]
    const best = valid.reduce<OF1Lap | null>((b, l) => (b === null || (l.lap_duration as number) < (b.lap_duration as number)) ? l : b, null)
    if (best && (!fastest || (best.lap_duration as number) < fastest.time)) fastest = { code: d.name_acronym, time: best.lap_duration as number, lap: best.lap_number }

    const myStints = raw.stints.filter(s => s.driver_number === num && s.lap_start != null && s.lap_start <= Math.max(lap, 1))
      .sort((a, b) => a.stint_number - b.stint_number)
    const stints: StintInfo[] = myStints.map(s => ({
      compound: s.compound, lapStart: s.lap_start as number,
      lapEnd: s.lap_end != null ? Math.min(s.lap_end, Math.max(lap, 1)) : null, ageAtStart: s.tyre_age_at_start ?? 0,
    }))
    const cur = myStints[myStints.length - 1]
    const tyreAge = cur ? (cur.tyre_age_at_start ?? 0) + Math.max(lap, 1) - (cur.lap_start as number) : null

    let deg: number | null = null
    if (cur) {
      const pts = done.filter(l => l.lap_number >= (cur.lap_start as number) && l.lap_number > 1 && !l.is_pit_out_lap && (l.lap_duration as number) < refLap * 1.12)
        .map(l => ({ x: l.lap_number, y: l.lap_duration as number }))
      deg = slope(pts)
    }

    const myPits = pitsBy.get(num) ?? []
    const lastPit = myPits[myPits.length - 1]
    const inPit = lastPit ? tMs - ms(lastPit.date) >= 0 && tMs - ms(lastPit.date) < (lastPit.lane_duration ?? 25) * 1000 : false

    const iv = ivBy.get(num)
    const g = parseGap(iv?.gap_to_leader); const itv = parseGap(iv?.interval)
    const gapLabel = position === 1 ? 'LÍDER' : g.lapsDown ? `+${g.lapsDown}V` : g.sec != null ? `+${g.sec.toFixed(1)}` : '—'
    const intervalLabel = position === 1 ? '—' : itv.lapsDown ? `+${itv.lapsDown}V` : itv.sec != null ? `+${itv.sec.toFixed(1)}` : '—'

    rows.push({
      pos: position, num, code: d.name_acronym, name: d.full_name, team: d.team_name, colour: d.team_colour.startsWith('#') ? d.team_colour : `#${d.team_colour}`,
      gapLabel, intervalLabel, gapS: position === 1 ? 0 : g.sec, intervalS: position === 1 ? null : itv.sec, lapsDown: g.lapsDown,
      lap, lastLap: lastDone?.lap_duration ?? null, bestLap: best?.lap_duration ?? null,
      tyre: cur?.compound ?? null, tyreAge, stops: myPits.length, inPit, out: outSet.has(num), stints, degPerLap: deg,
    })
  }
  // running cars by position first, retired ones at the back (latest retirement first)
  const running = rows.filter(r => !r.out).sort((a, b) => a.pos - b.pos)
  const retired = rows.filter(r => r.out).sort((a, b) => (lastStart.get(b.num) ?? 0) - (lastStart.get(a.num) ?? 0))
  const tower = [...running, ...retired].map((r, i) => ({ ...r, pos: i + 1 }))

  const leaderRow = tower[0]
  const leaderLap = leaderRow?.lap ?? 0

  // pit loss: median of measured lane durations outside neutralisations
  const neutral: [number, number][] = []
  {
    let from: number | null = null
    for (const r of rc) {
      const at = ms(r.date)
      if (r.category !== 'SafetyCar') continue
      const m = r.message.toUpperCase()
      if (m.includes('DEPLOYED')) from = at
      else if ((m.includes('ENDING') || m.includes('IN THIS LAP')) && from !== null) { neutral.push([from, at]); from = null }
    }
  }
  const greenLoss = pits.filter(p => p.lane_duration != null && !neutral.some(([a, b]) => ms(p.date) >= a && ms(p.date) <= b + 60_000)).map(p => p.lane_duration as number)
  const measured = median(greenLoss)
  const greenS = measured ?? 22
  const nowS = ts.status === 'VSC' || ts.status === 'VSC_ENDING' ? greenS * 0.55 : ts.status === 'SC' || ts.status === 'SC_ENDING' ? greenS * 0.5 : greenS
  const pitLoss = { greenS, nowS, samples: greenLoss.length, source: (measured === null ? 'estimada' : 'medida') as 'medida' | 'estimada' }

  // "if he pitted now" simulation
  const gapOf = (r: TowerRow): number => r.lapsDown ? r.lapsDown * refLap + 5 : (r.gapS ?? 0)
  const live = tower.filter(r => !r.out)
  const rejoin: RejoinSim[] = []
  if (started && ts.status !== 'FINISHED') {
    for (const r of live) {
      if (r.inPit) continue
      const others = live.filter(o => o.num !== r.num)
      const newGap = gapOf(r) + nowS
      const ahead = others.filter(o => gapOf(o) < newGap).sort((a, b) => gapOf(b) - gapOf(a))[0] ?? null
      const behind = others.filter(o => gapOf(o) >= newGap).sort((a, b) => gapOf(a) - gapOf(b))[0] ?? null
      const toPos = others.filter(o => gapOf(o) < newGap).length + 1
      const aheadGap = ahead ? newGap - gapOf(ahead) : null
      rejoin.push({
        code: r.code, fromPos: r.pos, toPos, lossS: nowS,
        carAheadCode: ahead?.code ?? null, carAheadGapS: aheadGap,
        carBehindCode: behind?.code ?? null, carBehindGapS: behind ? gapOf(behind) - newGap : null,
        cleanAir: aheadGap === null || aheadGap > 2.0,
      })
    }
  }

  // undercut indicators (rule of thumb, clearly labelled in the UI)
  const undercuts: UndercutAlert[] = []
  if (started && (ts.status === 'GREEN' || ts.status === 'VSC' || ts.status === 'VSC_ENDING')) {
    for (let i = 1; i < live.length; i++) {
      const a = live[i], t = live[i - 1]
      if (a.inPit || t.inPit || a.intervalS === null || a.tyreAge === null || t.tyreAge === null || a.lapsDown) continue
      if (a.intervalS <= 2.5 && a.tyreAge >= 8) {
        undercuts.push({
          attacker: a.code, target: t.code, intervalS: a.intervalS, attackerAge: a.tyreAge, targetAge: t.tyreAge,
          strength: a.intervalS <= 1.5 && a.tyreAge - t.tyreAge >= 3 ? 'forte' : 'possível',
        })
      }
    }
  }

  // race control feed + penalties
  const feed: RcItem[] = rc.filter(r => ms(r.date) <= tMs).map(r => ({
    date: r.date, lap: r.lap_number, kind: classifyRc(r), flag: r.flag,
    code: codeFromMessage(r.message) ?? (r.driver_number != null ? drivers.get(r.driver_number)?.name_acronym ?? null : null), message: r.message,
  }))
  // main feed: neutralisations, flags (blue flags are too frequent), penalties and track warnings; notes and deleted laps live elsewhere
  const raceControl = feed.filter(f =>
    f.kind === 'flag' ? (f.flag ?? '').toUpperCase() !== 'BLUE'
      : f.kind === 'safetycar' || f.kind === 'penalty' || f.kind === 'investigation' || (f.kind === 'info' && /TRACK SURFACE|RAIN|SLIPPERY|COLLISION|STOPPED|DEBRIS/i.test(f.message))
  ).slice(-14).reverse()
  const deletedLaps = feed.filter(f => f.kind === 'deleted').length
  const penalties = feed.filter(f => f.kind === 'penalty' || f.kind === 'investigation' || f.kind === 'noted' || f.kind === 'cleared').slice(-10).reverse()

  // weather
  const wAll = raw.weather.filter(w => ms(w.date) <= tMs)
  const w = wAll[wAll.length - 1]
  const wOld = [...wAll].reverse().find(x => ms(x.date) <= tMs - 600_000)
  const weather: WeatherInfo | null = w ? {
    air: w.air_temperature, track: w.track_temperature, humidity: w.humidity, wind: w.wind_speed, windDir: w.wind_direction,
    rain: w.rainfall > 0, trackTrend: wOld ? Math.round((w.track_temperature - wOld.track_temperature) * 10) / 10 : null,
  } : null

  const resLaps = Math.max(0, ...raw.results.map(r => r.number_of_laps ?? 0))
  return {
    t: new Date(tMs).toISOString(), started, status: ts.status, yellowSectors: ts.yellow, leaderLap,
    totalLaps: totalLapsHint ?? (resLaps > 0 ? resLaps : null), tower, fastestLap: fastest,
    pitLoss, rejoin, undercuts, events: { sc: ts.sc, vsc: ts.vsc, red: ts.red }, raceControl, penalties, deletedLaps, weather, firstRetirement,
  }
}

// ───────────────────────────── F1 Play live answers ─────────────────────────────
export interface PlayCfg {
  p2Label?: string
  p5?: { driverA: string; driverB: string }
  p6?: { driverA: string; driverB: string }
  p7?: { driverA: string; driverB: string }
  p13Options?: { codigo: string }[]
  p15Options?: { codigo: string }[]
  p14Options?: readonly { value: string }[]
}

export function teamKey(name: string): string {
  const n = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (n.includes('redbull')) return 'redbull'
  if (n === 'rb' || n.includes('racingbulls') || n.includes('visacash')) return 'racingbulls'
  for (const k of ['haas', 'aston', 'alpine', 'williams', 'mercedes', 'ferrari', 'mclaren', 'cadillac']) if (n.includes(k)) return k
  if (n.includes('audi') || n.includes('sauber')) return 'audi'
  return n
}

const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim()
}

function editDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)] as number[])
  for (let j = 1; j <= b.length; j++) dp[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return dp[a.length][b.length]
}

// Members type their favourite driver freely ("HAM", "Lewis Hamilton", "Max Verstapen"): map it to a driver code.
export function driverFromText(text: string | null | undefined, drivers: { code: string; name: string }[]): string | null {
  if (!text) return null
  const t = norm(text)
  if (!t) return null
  const byCode = drivers.find(d => d.code.toLowerCase() === t.replace(/ /g, ''))
  if (byCode) return byCode.code
  let best: { code: string; dist: number } | null = null
  for (const d of drivers) {
    const full = norm(d.name)
    const parts = full.split(' ')
    const last = parts[parts.length - 1]
    if (t === full || t === last || full.includes(t) && t.length >= 4) return d.code
    for (const cand of [last, full]) {
      const dist = editDistance(t, cand)
      if (dist <= 2 && (!best || dist < best.dist)) best = { code: d.code, dist }
    }
    for (const w of t.split(' ')) {
      if (w.length < 4) continue
      const dist = editDistance(w, last)
      if (dist <= 1 && (!best || dist < best.dist)) best = { code: d.code, dist }
    }
  }
  return best?.code ?? null
}

// What each question's answer would be if the race ended right now.
export function provisionalAnswers(s: TelemetryState, cfg: PlayCfg | undefined, margens: readonly string[]): Record<string, string | null> {
  const out: Record<string, string | null> = {
    p1_primeiro: null, p1_segundo: null, p1_terceiro: null, p2_equipa: null, p3_lap: null,
    p4_quarto: null, p4_quinto: null, p4_sexto: null, p5_duelo: null, p6_duelo: null, p7_duelo: null,
    p8_margem: null, p9_retire: null, p10_dotd: null, p11_fl: null, p12_classif: null,
    p13_especial: null, p14_sc: null, p15_outsider: null,
  }
  if (!s.started) return out
  const run = s.tower.filter(r => !r.out)
  const code = (i: number) => run[i]?.code ?? null
  out.p1_primeiro = code(0); out.p1_segundo = code(1); out.p1_terceiro = code(2)
  out.p4_quarto = code(3); out.p4_quinto = code(4); out.p4_sexto = code(5)

  // P2: team ranked 2nd or 3rd by points if it ended now (rank read from the question label)
  const teamPts = new Map<string, { pts: number; best: number; name: string }>()
  run.forEach((r, i) => {
    const k = teamKey(r.team)
    const cur = teamPts.get(k) ?? { pts: 0, best: 99, name: r.team }
    cur.pts += POINTS[i] ?? 0; cur.best = Math.min(cur.best, i); teamPts.set(k, cur)
  })
  const teams = Array.from(teamPts.values()).sort((a, b) => b.pts - a.pts || a.best - b.best)
  const rank = /TERCEIRA/i.test(cfg?.p2Label ?? '') ? 3 : 2
  out.p2_equipa = teams[rank - 1] && teams[rank - 1].pts > 0 ? teams[rank - 1].name : null

  // P3: number of lapped cars
  const lapped = run.filter(r => r.lapsDown > 0).length
  out.p3_lap = lapped === 0 ? 'Nenhum' : lapped > 5 ? 'Mais de 5' : String(lapped)

  // P5-P7 duels
  const byCode = new Map(s.tower.map(r => [r.code, r]))
  const duel = (d?: { driverA: string; driverB: string }): string | null => {
    if (!d) return null
    const a = byCode.get(d.driverA), b = byCode.get(d.driverB)
    if (!a || !b) return null
    if (a.out !== b.out) return a.out ? d.driverB : d.driverA
    return a.pos < b.pos ? d.driverA : d.driverB
  }
  out.p5_duelo = duel(cfg?.p5); out.p6_duelo = duel(cfg?.p6); out.p7_duelo = duel(cfg?.p7)

  // P8: gap between P1 and P2 (bucket)
  const gap = run[1]?.gapS
  if (gap != null) {
    out.p8_margem = margens.find(m => {
      const plus = /^\+(\d+(?:\.\d+)?)s$/.exec(m); if (plus) return gap >= parseFloat(plus[1])
      const r = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)s$/.exec(m); return r ? gap >= parseFloat(r[1]) && gap < parseFloat(r[2]) : false
    }) ?? null
  }

  out.p9_retire = s.firstRetirement
  out.p11_fl = s.fastestLap?.code ?? null
  // F1 classifies anyone who completed at least 90% of the winner's distance, even if stopped.
  const classified = run.length + s.tower.filter(r => r.out && r.lap >= 0.9 * s.leaderLap).length
  out.p12_classif = classified <= 13 ? '13 ou menos' : String(classified)

  const bestOf = (opts?: { codigo: string }[]): string | null => {
    const cand = (opts ?? []).map(o => byCode.get(o.codigo)).filter((r): r is TowerRow => !!r && !r.out).sort((a, b) => a.pos - b.pos)
    return cand[0]?.code ?? null
  }
  out.p13_especial = bestOf(cfg?.p13Options); out.p15_outsider = bestOf(cfg?.p15Options)

  // P14: neutralisations seen so far
  const { sc, vsc, red } = s.events
  const values = (cfg?.p14Options ?? []).map(o => o.value)
  if (values.includes('Sim')) out.p14_sc = sc > 0 ? 'Sim' : 'Não'
  else {
    const rf = values.includes('RF') && red > 0
    out.p14_sc = rf ? (sc && vsc ? 'RF_AMBOS' : sc ? 'RF_SC' : vsc ? 'RF_VSC' : 'RF') : (sc && vsc ? 'AMBOS' : sc ? 'SC' : vsc ? 'VSC' : 'NENHUM')
  }
  return out
}
