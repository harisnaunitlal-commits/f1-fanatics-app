// Telemetry engine: turns raw OpenF1 datasets into the state shown on /telemetria at a given instant.
// Pure functions, no I/O and no runtime imports, so the same code serves replay and live.

export interface OF1Driver { driver_number: number; name_acronym: string; full_name: string; team_name: string; team_colour: string; headshot_url?: string | null }
export interface OF1Position { date: string; driver_number: number; position: number }
export interface OF1Interval { date: string; driver_number: number; gap_to_leader: number | string | null; interval: number | string | null }
export interface OF1Stint { stint_number: number; driver_number: number; lap_start: number | null; lap_end: number | null; compound: string | null; tyre_age_at_start: number | null }
export interface OF1Pit { date: string; driver_number: number; lap_number: number | null; lane_duration: number | null; pit_duration?: number | null; stop_duration: number | null }
export interface OF1RaceControl { date: string; driver_number: number | null; lap_number: number | null; category: string; flag: string | null; scope: string | null; sector: number | null; message: string; qualifying_phase?: number | null }
export interface OF1Weather { date: string; air_temperature: number; track_temperature: number; humidity: number; pressure: number; rainfall: number; wind_speed: number; wind_direction: number }
export interface OF1Lap {
  driver_number: number; lap_number: number; date_start: string | null; lap_duration: number | null; is_pit_out_lap: boolean | null
  duration_sector_1?: number | null; duration_sector_2?: number | null; duration_sector_3?: number | null; st_speed?: number | null
}
export interface OF1Result { driver_number: number; position: number | null; number_of_laps: number | null; dnf: boolean; dns: boolean; dsq: boolean; gap_to_leader?: number | string | null }
export interface OF1Overtake { date: string; overtaking_driver_number: number; overtaken_driver_number: number; position: number }
export interface OF1Location { date: string; driver_number: number; x: number; y: number }
export interface OF1ChampDriver { driver_number: number; position_start: number | null; points_start: number | null }
export interface OF1ChampTeam { team_name: string; position_start: number | null; points_start: number | null }

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
  overtakes: OF1Overtake[]
  locations: OF1Location[]
  champDrivers: OF1ChampDriver[]
  champTeams: OF1ChampTeam[]
}

export type SectorColour = 'purple' | 'green' | 'yellow' | null
export type SessionKind = 'race' | 'practice' | 'quali'

export interface ResultRow {
  pos: number
  num: number
  code: string
  name: string
  team: string
  colour: string
  best: number | null
  gap: number | null
  gapPrev: number | null
  bestTyre: string | null
  bestTyreAge: number | null
  laps: number
  lastLap: number | null
  lastLapColour: 'purple' | 'green' | null
  phaseTimes: (number | null)[]
  group: number
  eliminatedIn: number | null
  inDanger: boolean
  tyre: string | null
  tyreAge: number | null
  inPit: boolean
  stopped: boolean   // practice/quali: Race Control said the car stopped on track and it has not moved since
}
export interface SessionResults {
  kind: SessionKind
  phase: number | null
  phaseEnded: boolean
  finished: boolean
  advance: number | null
  rows: ResultRow[]
  sessionBest: number | null
}
export interface MapCar { code: string; colour: string; x: number; y: number; out: boolean; inPit: boolean }
export interface OvertakeItem { date: string; lap: number | null; by: string; over: string; pos: number }
export interface PositionLine { code: string; colour: string; pos: (number | null)[] }
export interface LapTimeLine { code: string; colour: string; laps: { lap: number; t: number }[] }
export interface ChampRow { code: string; name: string; colour: string; posStart: number; pointsStart: number; pointsNow: number; posNow: number; delta: number }
export interface ChampTeamRow { name: string; colour: string; posStart: number; pointsStart: number; pointsNow: number; posNow: number; delta: number }

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
  sectors: (number | null)[]
  sectorColour: SectorColour[]
  topSpeed: number | null
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

// Race strategy (new): safety-car periods, last laps with tyre and delta, stint pace and pit windows
export interface NeutralPeriod { kind: 'SC' | 'VSC' | 'RED'; fromMs: number; toMs: number | null; fromLap: number | null; toLap: number | null }
export interface PaceLap { lap: number; t: number; delta: number | null; compound: string | null; flag: 'pit' | 'out' | 'neutral' | null }
export interface StintStat {
  compound: string | null; lapStart: number; lapEnd: number | null; laps: number
  pace: number | null            // median of the clean laps of the stint
  deg: number | null             // s/lap lost to the tyres (slope of the clean laps + fuel burn correction)
  vsPrev: number | null          // pace of this stint minus the previous one (raw)
  vsPrevFuel: number | null      // same, with the fuel burn (~0.035 s/lap) taken out
}
export interface RacePaceRow {
  code: string; colour: string; pos: number
  tyre: string | null; tyreAge: number | null; stintLaps: number
  laps: PaceLap[]                // last 5 completed laps
  avg5: number | null; prev5: number | null; avg10: number | null
  deg: number | null             // tyre degradation estimate in the current stint (s/lap)
  stints: StintStat[]
}
export type PitWindowStatus = 'sem-dados' | 'cedo' | 'janela' | 'tarde' | 'sem-mais' | 'na-box'
export interface PitWindowRow {
  code: string; colour: string; pos: number
  stops: number; expected: number | null; lastStopLap: number; stintLaps: number
  windowFrom: number | null; windowTo: number | null
  status: PitWindowStatus
}
// Track limits: every deleted lap time "TRACK LIMITS AT TURN n" is one infringement; the stewards' own flag / penalty messages are kept apart
export type TrackLimitStatus = 'ok' | 'iminente' | 'aviso' | 'penalizado'
export interface TrackLimitRow {
  code: string; colour: string; count: number
  turns: { turn: number; n: number }[]
  lastLap: number | null
  warned: boolean                // black-and-white flag shown for track limits
  penaltySecs: number            // seconds of time penalty for track limits
  status: TrackLimitStatus
}
export interface StrategyHint { typicalStops: number; firstStopLap: number | null }

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
  kind: SessionKind
  results: SessionResults | null
  map: MapCar[]
  overtakes: OvertakeItem[]
  lapChart: PositionLine[]
  lapTimes: LapTimeLine[]
  fastestSectors: (number | null)[]
  championship: { drivers: ChampRow[]; teams: ChampTeamRow[]; sprint: boolean } | null
  neutral: NeutralPeriod[]
  trackLimits: TrackLimitRow[]
  racePace: RacePaceRow[]
  pitWindows: PitWindowRow[]
  strategyHint: StrategyHint | null
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

// Session clock (broadcast style): practice and qualifying are timed, not lapped. Practice counts down to the
// scheduled end; qualifying counts down each phase (18/15/12 min, sprint qualifying 12/10/8), pausing on red flags,
// and between phases counts down to the (approximate) start of the next one.
export type ClockState = 'before' | 'running' | 'paused' | 'break' | 'finished'
export interface SessionClockPhase { label: string; startMs: number; endMs: number | null }
export interface SessionClock {
  state: ClockState
  label: string
  remainingMs: number | null
  running: boolean
  text: string | null
  startMs: number
  endMs: number
  phases: SessionClockPhase[]
}

export function computeClock(rcRaw: OF1RaceControl[], kind: SessionKind, name: string, win: { start: number; end: number }, tMs: number): SessionClock | null {
  if (kind === 'race') return null
  const base = { startMs: win.start, endMs: win.end, phases: [] as SessionClockPhase[] }
  if (tMs < win.start) return { ...base, state: 'before', label: 'COMEÇA EM', remainingMs: win.start - tMs, running: true, text: null }
  if (kind === 'practice') {
    if (tMs >= win.end) return { ...base, state: 'finished', label: '', remainingMs: null, running: false, text: 'TERMINADA' }
    return { ...base, state: 'running', label: 'TEMPO RESTANTE', remainingMs: win.end - tMs, running: true, text: null }
  }
  const sprint = /sprint/i.test(name)
  const planned = sprint ? [12, 10, 8] : [18, 15, 12]
  const pfx = sprint ? 'SQ' : 'Q'
  const phases = new Map<number, { running: number; since: number | null; finished: boolean; first: number; last: number | null }>()
  let cur = 0
  for (const r of [...rcRaw].sort((a, b) => ms(a.date) - ms(b.date))) {
    const at = ms(r.date)
    if (at > tMs) break
    const ph = r.qualifying_phase
    if (!ph || r.category !== 'SessionStatus') continue
    const st = phases.get(ph) ?? { running: 0, since: null, finished: false, first: at, last: null }
    const m = r.message.toUpperCase()
    if (m.includes('STARTED')) st.since = at
    else if (m.includes('ABORTED') || m.includes('FINISHED')) {
      if (st.since !== null) st.running += at - st.since
      st.since = null
      if (m.includes('FINISHED')) { st.finished = true; st.last = at }
    }
    phases.set(ph, st)
    cur = Math.max(cur, ph)
  }
  const list: SessionClockPhase[] = Array.from(phases.entries()).sort((a, b) => a[0] - b[0]).map(([k, v]) => ({ label: `${pfx}${k}`, startMs: v.first, endMs: v.last }))
  if (cur === 0) return { ...base, phases: list, state: 'before', label: 'A COMEÇAR', remainingMs: null, running: false, text: 'A COMEÇAR' }
  const st = phases.get(cur) as { running: number; since: number | null; finished: boolean; first: number; last: number | null }
  const sessStart = list[0]?.startMs ?? win.start
  if (st.finished && cur >= 3) return { ...base, phases: list, startMs: sessStart, endMs: st.last ?? win.end, state: 'finished', label: '', remainingMs: null, running: false, text: 'TERMINADA' }
  if (st.finished) {
    const nextAt = (st.last as number) + 7 * 60_000
    return { ...base, phases: list, startMs: sessStart, state: 'break', label: `${pfx}${cur + 1} COMEÇA EM ~`, remainingMs: Math.max(0, nextAt - tMs), running: true, text: null }
  }
  const used = st.running + (st.since !== null ? tMs - st.since : 0)
  const remaining = Math.max(0, planned[cur - 1] * 60_000 - used)
  return { ...base, phases: list, startMs: sessStart, state: st.since !== null ? 'running' : 'paused', label: st.since !== null ? `${pfx}${cur}` : `${pfx}${cur} · PARADO`, remainingMs: remaining, running: st.since !== null, text: null }
}

export function sessionKindOf(name: string): SessionKind {
  if (/qualif|shootout/i.test(name)) return 'quali'
  if (/practice/i.test(name)) return 'practice'
  return 'race'
}

type DriverLaps = { r: TowerRow; dl: OF1Lap[]; times: (number | null)[]; ran: boolean[] }

// Practice and qualifying: only the best lap counts. Qualifying is split into Q1/Q2/Q3 using the
// race-control "qualifying_phase" field, with the 2026 cut: 22 cars -> 16 -> 10.
function buildResults(raw: RawSession, tMs: number, kind: SessionKind, tower: TowerRow[], lapsBy: Map<number, OF1Lap[]>, deleted: Set<string>, rc: OF1RaceControl[], status: TrackStatus): SessionResults {
  const code = new Map(raw.drivers.map(d => [d.driver_number, d.name_acronym]))
  const isDone = (l: OF1Lap) => l.lap_duration != null && l.date_start != null && ms(l.date_start) + l.lap_duration * 1000 <= tMs
  const valid = (num: number, l: OF1Lap) => isDone(l) && !deleted.has(code.get(num) + '|' + (l.lap_duration as number).toFixed(3))

  const phaseStart = new Map<number, number>()
  const chequeredAt: number[] = []
  if (kind === 'quali') {
    for (const r of rc) {
      const at = ms(r.date)
      if (at > tMs) break
      if (r.qualifying_phase && !phaseStart.has(r.qualifying_phase)) phaseStart.set(r.qualifying_phase, at)
      if (r.category === 'Flag' && (r.flag ?? '').toUpperCase() === 'CHEQUERED') chequeredAt.push(at)
    }
  }
  const maxPhase = kind === 'quali' ? Math.max(1, ...Array.from(phaseStart.keys())) : 1
  const phaseOf = (at: number): number => {
    let ph = 1
    phaseStart.forEach((v, k) => { if (at >= v && k > ph) ph = k })
    return ph
  }
  const lastCheq = chequeredAt.length ? chequeredAt[chequeredAt.length - 1] : null
  const phaseEnded = kind === 'quali' && lastCheq !== null && lastCheq >= (phaseStart.get(maxPhase) ?? 0)
  const finished = status === 'FINISHED' || (kind === 'quali' && maxPhase === 3 && phaseEnded)

  const nPhases = kind === 'quali' ? 3 : 1
  // candidate timed laps per driver and phase; aborted laps (e.g. a 4:23 "lap" that ended in the pits)
  // are not times: anything 50% slower than the fastest lap of the phase is ignored
  const cand = tower.map(r => {
    const dl = lapsBy.get(r.num) ?? []
    const ran = Array.from({ length: nPhases }, () => false)
    const laps: { ph: number; t: number }[] = []
    for (const l of dl) {
      if (!l.date_start) continue
      const ph = kind === 'quali' ? phaseOf(ms(l.date_start)) : 1
      ran[ph - 1] = true
      if (valid(r.num, l)) laps.push({ ph, t: l.lap_duration as number })
    }
    return { r, dl, ran, laps }
  })
  const phaseMin = Array.from({ length: nPhases }, (_, i) => {
    const ts = cand.flatMap(c => c.laps.filter(x => x.ph === i + 1).map(x => x.t))
    return ts.length ? Math.min(...ts) : null
  })
  const perDriver: DriverLaps[] = cand.map(c => {
    const times: (number | null)[] = Array.from({ length: nPhases }, () => null)
    for (const x of c.laps) {
      const lim = phaseMin[x.ph - 1]
      if (lim === null || x.t > lim * 1.5) continue
      if (times[x.ph - 1] === null || x.t < (times[x.ph - 1] as number)) times[x.ph - 1] = x.t
    }
    return { r: c.r, dl: c.dl, times, ran: c.ran }
  })

  // who advanced: those who ran in the next phase; in the current phase the top N, provisionally
  const n = tower.length
  const advanceN = (ph: number): number => (ph === 1 ? n - (n >= 22 ? 6 : 5) : 10)
  // no time yet in the phase: keep the order of the previous phase (the grid order they came from), then the running order
  const byTime = (ph: number) => (a: DriverLaps, b: DriverLaps): number => {
    const ta = a.times[ph - 1], tb = b.times[ph - 1]
    if (ta === null && tb === null) return ph > 1 ? byTime(ph - 1)(a, b) : a.r.pos - b.r.pos
    if (ta === null) return 1
    if (tb === null) return -1
    return ta - tb
  }
  const rank = (ph: number, pool: DriverLaps[]): DriverLaps[] => [...pool].sort(byTime(ph))
  const eliminatedIn = new Map<number, number>()
  const inDanger = new Set<number>()
  if (kind === 'quali') {
    let pool = perDriver
    for (let ph = 1; ph <= Math.min(maxPhase, 2); ph++) {
      const ranked = rank(ph, pool)
      let advancing: DriverLaps[]
      // a finished phase is decided by the times (top N advance), not by who has already left the pits in the next one
      if (ph < maxPhase) advancing = ranked.slice(0, advanceN(ph))
      else {
        advancing = ranked.slice(0, advanceN(ph))
        if (phaseEnded || finished) ranked.slice(advanceN(ph)).forEach(d => eliminatedIn.set(d.r.num, ph))
        else ranked.slice(advanceN(ph)).forEach(d => inDanger.add(d.r.num))
        if (!(phaseEnded || finished)) break
      }
      const adv = advancing
      pool.filter(d => !adv.includes(d)).forEach(d => eliminatedIn.set(d.r.num, ph))
      pool = advancing
    }
  }

  const groupOf = (num: number): number => (kind === 'quali' ? (eliminatedIn.get(num) ?? maxPhase) : 1)
  const phaseLeader = (ph: number): number | null => {
    const ts = perDriver.map(d => d.times[ph - 1]).filter((t): t is number => t !== null)
    return ts.length ? Math.min(...ts) : null
  }

  const ordered = [...perDriver].sort((a, b) => {
    const ga = groupOf(a.r.num), gb = groupOf(b.r.num)
    if (ga !== gb) return gb - ga
    return byTime(ga)(a, b)
  })

  const rows: ResultRow[] = []
  ordered.forEach((d, i) => {
    const g = groupOf(d.r.num)
    const best = d.times[g - 1]
    const lead = phaseLeader(g)
    const before = rows.length ? rows[rows.length - 1] : null
    const prev = before && before.group === g ? before.best : null
    let bestTyre: string | null = null, bestTyreAge: number | null = null
    if (best !== null) {
      const bl = d.dl.find(l => l.lap_duration === best)
      if (bl) {
        const st = raw.stints
          .filter(x => x.driver_number === d.r.num && x.lap_start != null && x.lap_start <= bl.lap_number && (x.lap_end == null || x.lap_end >= bl.lap_number))
          .sort((a, b) => b.stint_number - a.stint_number)[0]
        if (st) { bestTyre = st.compound; bestTyreAge = (st.tyre_age_at_start ?? 0) + bl.lap_number - (st.lap_start as number) }
      }
    }
    const done = d.dl.filter(isDone)
    const lastDone = done[done.length - 1]
    const lastT = lastDone?.lap_duration ?? null
    const lastLapColour: 'purple' | 'green' | null = lastT !== null && lead !== null && lastT <= lead + 0.0005 ? 'purple'
      : lastT !== null && best !== null && lastT <= best + 0.0005 ? 'green' : null
    rows.push({
      pos: i + 1, num: d.r.num, code: d.r.code, name: d.r.name, team: d.r.team, colour: d.r.colour,
      best, gap: best !== null && lead !== null ? best - lead : null, gapPrev: best !== null && prev !== null ? best - prev : null,
      bestTyre, bestTyreAge, laps: done.length, lastLap: lastT, lastLapColour,
      phaseTimes: d.times, group: g, eliminatedIn: eliminatedIn.get(d.r.num) ?? null, inDanger: inDanger.has(d.r.num),
      tyre: d.r.tyre, tyreAge: d.r.tyreAge, inPit: d.r.inPit, stopped: false,
    })
  })
  // a car stopped on track (practice/qualifying have no DNF): Race Control names it, and it stays marked until it starts another lap
  if (kind !== 'race') {
    const re = /STOPPED|BROKEN DOWN|ABANDON|SLOW ON TRACK/i
    for (const row of rows) {
      let at = -1
      for (const r of rc) {
        if (ms(r.date) > tMs) break
        if (r.category === 'Flag' || !re.test(r.message)) continue
        if (r.driver_number === row.num || r.message.includes('(' + row.code + ')')) at = ms(r.date)  // "(HAM)" in the text
      }
      if (at < 0) continue
      const moved = (lapsBy.get(row.num) ?? []).some(l => l.date_start && ms(l.date_start) > at + 20_000 && !l.is_pit_out_lap)
      const left = raw.pits.some(p => p.driver_number === row.num && ms(p.date) > at && ms(p.date) <= tMs)
      row.stopped = !moved && !left && !row.inPit
    }
  }
  const currentLeader = phaseLeader(kind === 'quali' ? maxPhase : 1)
  return { kind, phase: kind === 'quali' ? maxPhase : null, phaseEnded, finished, advance: kind === 'quali' && maxPhase <= 2 ? advanceN(maxPhase) : null, rows, sessionBest: currentLeader }
}

// ───────────────────────────── main ─────────────────────────────
export function buildState(raw: RawSession, tMs: number, totalLapsHint: number | null = null, sessionName = '', hint: StrategyHint | null = null): TelemetryState {
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

  // best sector times: session-wide (purple) and per driver (green)
  const sessionBest: (number | null)[] = [null, null, null]
  const personalBest = new Map<number, (number | null)[]>()
  const topSpeedBy = new Map<number, number>()
  for (const [num, arr] of Array.from(lapsBy.entries())) {
    const pb: (number | null)[] = [null, null, null]
    for (const l of arr) {
      if (!isComplete(l)) continue
      if (l.st_speed != null) topSpeedBy.set(num, Math.max(topSpeedBy.get(num) ?? 0, l.st_speed))
      if (l.is_pit_out_lap) continue
      const sec = [l.duration_sector_1 ?? null, l.duration_sector_2 ?? null, l.duration_sector_3 ?? null]
      sec.forEach((v, i) => {
        if (v == null) return
        if (pb[i] === null || v < (pb[i] as number)) pb[i] = v
        if (sessionBest[i] === null || v < (sessionBest[i] as number)) sessionBest[i] = v
      })
    }
    personalBest.set(num, pb)
  }

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
  const winLaps = Math.max(0, ...raw.results.map(r => r.number_of_laps ?? 0))
  const finishedNow = ts.chequeredMs !== null && tMs >= ts.chequeredMs
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
    let g = parseGap(iv?.gap_to_leader); const itv = parseGap(iv?.interval)
    // after the flag the live intervals stop: use the classification (gap to the winner, laps behind) so the winning margin and the lapped cars survive the finish
    if (!iv && finishedNow && num !== undefined) {
      const res = resultBy.get(num)
      if (res) {
        const fromRes = parseGap(res.gap_to_leader)
        const behind = res.number_of_laps != null && winLaps > 0 ? Math.max(0, winLaps - res.number_of_laps) : 0
        g = { sec: fromRes.sec, lapsDown: fromRes.lapsDown || (!res.dnf ? behind : 0) }
      }
    }
    const gapLabel = position === 1 ? 'LÍDER' : g.lapsDown ? `+${g.lapsDown}V` : g.sec != null ? `+${g.sec.toFixed(1)}` : '—'
    const intervalLabel = position === 1 ? '—' : itv.lapsDown ? `+${itv.lapsDown}V` : itv.sec != null ? `+${itv.sec.toFixed(1)}` : '—'

    const secs = [lastDone?.duration_sector_1 ?? null, lastDone?.duration_sector_2 ?? null, lastDone?.duration_sector_3 ?? null]
    const pbs = personalBest.get(num) ?? [null, null, null]
    const sectorColour: SectorColour[] = secs.map((v, i) => v == null ? null
      : sessionBest[i] !== null && v <= (sessionBest[i] as number) + 0.0005 ? 'purple'
      : pbs[i] !== null && v <= (pbs[i] as number) + 0.0005 ? 'green' : 'yellow')

    rows.push({
      sectors: secs, sectorColour, topSpeed: topSpeedBy.get(num) ?? null,
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

  // pit window per driver: stops already made vs the stops usual at this circuit (without Safety Car / red flag)
  const FUEL = 0.035   // s per lap of fuel burn, estimated
  const totalForHint = totalLapsHint ?? (Math.max(0, ...raw.results.map(r => r.number_of_laps ?? 0)) || null)
  const lastStopLapBy = new Map<number, number>()
  for (const [num, arr] of Array.from(pitsBy.entries())) lastStopLapBy.set(num, Math.max(0, ...arr.map(p => p.lap_number ?? 0)))
  const pitWindowOf = (r: TowerRow): PitWindowRow => {
    const lastStopLap = lastStopLapBy.get(r.num) ?? 0
    const stintLaps = Math.max(0, r.lap - lastStopLap)
    const base = { code: r.code, colour: r.colour, pos: r.pos, stops: r.stops, lastStopLap, stintLaps }
    if (r.inPit) return { ...base, expected: hint ? Math.max(1, Math.round(hint.typicalStops)) : null, windowFrom: null, windowTo: null, status: 'na-box' }
    if (!hint || !totalForHint) return { ...base, expected: null, windowFrom: null, windowTo: null, status: 'sem-dados' }
    const expected = Math.max(1, Math.round(hint.typicalStops))
    if (r.stops >= expected) return { ...base, expected, windowFrom: null, windowTo: null, status: 'sem-mais' }
    const stintLen = totalForHint / (expected + 1)
    const centre = r.stops === 0 && hint.firstStopLap ? hint.firstStopLap : lastStopLap + stintLen
    const half = Math.max(3, Math.round(0.18 * stintLen))
    const from = Math.max(lastStopLap + 6, Math.round(centre - half)), to = Math.round(centre + half)
    const status: PitWindowStatus = stintLaps < 6 || r.lap < from ? 'cedo' : r.lap <= to ? 'janela' : 'tarde'
    return { ...base, expected, windowFrom: from, windowTo: to, status }
  }

  // undercut indicators (rule of thumb, clearly labelled in the UI)
  const undercuts: UndercutAlert[] = []
  if (started && (ts.status === 'GREEN' || ts.status === 'VSC' || ts.status === 'VSC_ENDING')) {
    for (let i = 1; i < live.length; i++) {
      const a = live[i], t = live[i - 1]
      if (a.inPit || t.inPit || a.intervalS === null || a.tyreAge === null || t.tyreAge === null || a.lapsDown) continue
      // laps on the current set (not the age of a used set just fitted), and only if this stop is still expected
      const aWin = pitWindowOf(a)
      if (aWin.status === 'sem-mais' || aWin.status === 'cedo' || aWin.status === 'na-box') continue
      if (a.intervalS <= 2.5 && aWin.stintLaps >= 8) {
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

  // ── map: latest location of every car ──
  const locBy = new Map<number, OF1Location>()
  for (const l of raw.locations) { if (ms(l.date) <= tMs) { const c = locBy.get(l.driver_number); if (!c || ms(l.date) >= ms(c.date)) locBy.set(l.driver_number, l) } }
  const mapCars: MapCar[] = tower.flatMap(r => { const l = locBy.get(r.num); return l ? [{ code: r.code, colour: r.colour, x: l.x, y: l.y, out: r.out, inPit: r.inPit }] : [] })

  // ── overtakes ──
  const lapAt = (num: number, at: number): number | null => {
    const arr = lapsBy.get(num) ?? []
    let v: number | null = null
    for (const l of arr) { if (l.date_start && ms(l.date_start) <= at) v = l.lap_number; else break }
    return v
  }
  const overtakes: OvertakeItem[] = raw.overtakes.filter(o => ms(o.date) <= tMs).sort((a, b) => ms(a.date) - ms(b.date)).slice(-10).reverse().map(o => ({
    date: o.date, lap: lapAt(o.overtaking_driver_number, ms(o.date)), pos: o.position,
    by: drivers.get(o.overtaking_driver_number)?.name_acronym ?? '?', over: drivers.get(o.overtaken_driver_number)?.name_acronym ?? '?',
  }))

  // ── lap chart: position at the start of each lap, and clean lap times ──
  const posHist = new Map<number, OF1Position[]>()
  for (const p of raw.positions) { if (ms(p.date) <= tMs) { const a = posHist.get(p.driver_number) ?? []; a.push(p); posHist.set(p.driver_number, a) } }
  const posAt = (num: number, at: number): number | null => {
    let v: number | null = null
    for (const p of posHist.get(num) ?? []) { if (ms(p.date) <= at) v = p.position; else break }
    return v
  }
  const lapChart: PositionLine[] = tower.map(r => {
    const dl = lapsBy.get(r.num) ?? []
    return { code: r.code, colour: r.colour, pos: Array.from({ length: leaderLap }, (_, i) => { const l = dl.find(x => x.lap_number === i + 1); return l?.date_start ? posAt(r.num, ms(l.date_start)) : null }) }
  })
  const lapTimes: LapTimeLine[] = tower.map(r => ({
    code: r.code, colour: r.colour,
    laps: (lapsBy.get(r.num) ?? []).filter(l => isComplete(l) && !l.is_pit_out_lap && l.lap_number > 1 && (l.lap_duration as number) < refLap * 1.12).map(l => ({ lap: l.lap_number, t: l.lap_duration as number })),
  }))

  // ── race strategy: neutralisations, last laps with tyre and delta, stint pace, pit windows ──
  const neutralPeriods: NeutralPeriod[] = []
  const racePace: RacePaceRow[] = []
  const pitWindows: PitWindowRow[] = []
  if (sessionKindOf(sessionName) === 'race' && started) {
    const open: { cur: { at: number; kind: 'SC' | 'VSC' | 'RED'; lap: number | null } | null } = { cur: null }
    const closeAt = (at: number, lap: number | null) => { if (open.cur) { neutralPeriods.push({ kind: open.cur.kind, fromMs: open.cur.at, toMs: at, fromLap: open.cur.lap, toLap: lap }); open.cur = null } }
    for (const r of rc) {
      const at = ms(r.date); if (at > tMs) break
      const m = r.message.toUpperCase()
      if (r.category === 'SafetyCar') {
        if (m.includes('DEPLOYED')) { closeAt(at, r.lap_number); open.cur = { at, kind: m.includes('VIRTUAL') ? 'VSC' : 'SC', lap: r.lap_number } }
        else if ((m.includes('ENDING') || m.includes('IN THIS LAP')) && open.cur) closeAt(at, r.lap_number)
      } else if (r.category === 'Flag' && (r.flag ?? '').toUpperCase() === 'RED' && !open.cur) open.cur = { at, kind: 'RED', lap: r.lap_number }
      else if (r.category === 'SessionStatus' && m.includes('STARTED') && open.cur?.kind === 'RED') closeAt(at, r.lap_number)
    }
    if (open.cur) neutralPeriods.push({ kind: open.cur.kind, fromMs: open.cur.at, toMs: null, fromLap: open.cur.lap, toLap: null })
    const inNeutral = (a: number, b: number) => neutralPeriods.some(p => p.fromMs < b && (p.toMs ?? tMs) + 20_000 > a)
    const compoundAt = (num: number, lap: number): string | null =>
      raw.stints.filter(x => x.driver_number === num && x.lap_start != null && x.lap_start <= lap && (x.lap_end == null || x.lap_end >= lap)).sort((a, b) => b.stint_number - a.stint_number)[0]?.compound ?? null
    const mean = (xs: number[]): number | null => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null

    for (const r of tower.filter(x => !x.out).slice(0, 22)) {
      const pitLaps = new Set((pitsBy.get(r.num) ?? []).map(p => p.lap_number))
      const done = (lapsBy.get(r.num) ?? []).filter(isComplete)
      const stat = new Map<number, { t: number; flag: PaceLap['flag']; clean: boolean }>()
      for (const l of done) {
        const t = l.lap_duration as number, a = ms(l.date_start as string)
        const flag: PaceLap['flag'] = pitLaps.has(l.lap_number) ? 'pit' : l.is_pit_out_lap ? 'out' : inNeutral(a, a + t * 1000) ? 'neutral' : null
        stat.set(l.lap_number, { t, flag, clean: flag === null && l.lap_number > 1 && t < refLap * 1.12 })
      }
      const myStints = raw.stints.filter(x => x.driver_number === r.num && x.lap_start != null && x.lap_start <= Math.max(r.lap, 1)).sort((a, b) => a.stint_number - b.stint_number)
      const cur = myStints[myStints.length - 1]
      const curStart = (cur?.lap_start as number | undefined) ?? 1
      const last5 = done.slice(-5).map(l => {
        const st = stat.get(l.lap_number)!, pv = stat.get(l.lap_number - 1)
        return { lap: l.lap_number, t: st.t, delta: st.clean && pv?.clean ? st.t - pv.t : null, compound: compoundAt(r.num, l.lap_number), flag: st.flag } as PaceLap
      })
      const cleanIn = (laps: typeof done) => laps.filter(l => stat.get(l.lap_number)?.clean && l.lap_number >= curStart).map(l => ({ x: l.lap_number, y: stat.get(l.lap_number)!.t }))
      const p5 = cleanIn(done.slice(-5)), pPrev = cleanIn(done.slice(-10, -5)), p10 = cleanIn(done.slice(-10))
      const trend = p10.length >= 5 ? slope(p10) : null
      const stints: StintStat[] = []
      let prevCorr: number | null = null, prevPace: number | null = null
      for (const st of myStints) {
        const a = st.lap_start as number, b = Math.min(st.lap_end ?? r.lap, r.lap)
        const cl = done.filter(l => l.lap_number >= a && l.lap_number <= b && stat.get(l.lap_number)?.clean).map(l => ({ x: l.lap_number, y: stat.get(l.lap_number)!.t }))
        const pace = cl.length >= 3 ? median(cl.map(p => p.y)) : null
        const medLap = cl.length >= 3 ? median(cl.map(p => p.x)) : null
        const corr = pace !== null && medLap !== null ? pace + FUEL * medLap : null
        const sl = cl.length >= 4 ? slope(cl) : null
        stints.push({
          compound: st.compound, lapStart: a, lapEnd: st.lap_end != null ? Math.min(st.lap_end, r.lap) : null, laps: Math.max(0, b - a + 1), pace,
          deg: sl === null ? null : sl + FUEL,
          vsPrev: pace !== null && prevPace !== null ? pace - prevPace : null,
          vsPrevFuel: corr !== null && prevCorr !== null ? corr - prevCorr : null,
        })
        if (pace !== null) { prevPace = pace; prevCorr = corr }
      }
      racePace.push({
        code: r.code, colour: r.colour, pos: r.pos, tyre: r.tyre, tyreAge: r.tyreAge, stintLaps: Math.max(0, r.lap - curStart + 1),
        laps: last5, avg5: p5.length >= 3 ? mean(p5.map(p => p.y)) : null, prev5: pPrev.length >= 3 ? mean(pPrev.map(p => p.y)) : null,
        avg10: p10.length >= 5 ? mean(p10.map(p => p.y)) : null, deg: trend === null ? null : trend + FUEL, stints,
      })
    }
    for (const r of tower.filter(x => !x.out).slice(0, 10)) pitWindows.push(pitWindowOf(r))
  }

  // ── track limits ──
  const tlMap = new Map<string, { count: number; turns: Map<number, number>; lastLap: number | null; warned: boolean; penaltySecs: number }>()
  for (const r of rc) {
    if (ms(r.date) > tMs) break
    const m = r.message.toUpperCase()
    if (!m.includes('TRACK LIMITS') && !(m.includes('EXCEEDING') && m.includes('LIMITS'))) continue
    const code = codeFromMessage(r.message) ?? (r.driver_number != null ? drivers.get(r.driver_number)?.name_acronym ?? null : null)
    if (!code) continue
    const e = tlMap.get(code) ?? { count: 0, turns: new Map<number, number>(), lastLap: null, warned: false, penaltySecs: 0 }
    if (r.category === 'Flag' && (r.flag ?? '').toUpperCase().includes('BLACK AND WHITE')) e.warned = true
    else if (m.includes('PENALTY')) e.penaltySecs += Number(/(\d+)\s*SECOND/.exec(m)?.[1] ?? 0)
    else if (m.includes('DELETED')) {
      e.count += 1
      const t = /TURN\s*(\d+)/.exec(m); if (t) e.turns.set(Number(t[1]), (e.turns.get(Number(t[1])) ?? 0) + 1)
      e.lastLap = r.lap_number ?? Number(/LAP\s*(\d+)/.exec(m)?.[1] ?? NaN) ?? e.lastLap
      if (e.lastLap !== null && Number.isNaN(e.lastLap)) e.lastLap = null
    }
    tlMap.set(code, e)
  }
  const trackLimits: TrackLimitRow[] = Array.from(tlMap.entries()).map(([code, e]) => ({
    code, colour: tower.find(t => t.code === code)?.colour ?? '#888888', count: e.count,
    turns: Array.from(e.turns.entries()).map(([turn, n]) => ({ turn, n })).sort((a, b) => b.n - a.n || a.turn - b.turn),
    lastLap: e.lastLap, warned: e.warned, penaltySecs: e.penaltySecs,
    status: (e.penaltySecs > 0 ? 'penalizado' : e.warned ? 'aviso' : e.count >= 3 ? 'iminente' : 'ok') as TrackLimitStatus,
  })).sort((a, b) => b.penaltySecs - a.penaltySecs || b.count - a.count || a.code.localeCompare(b.code))

  // ── championship if the race ended now (start-of-session standings + points for the current order) ──
  let championship: TelemetryState['championship'] = null
  const isRaceSession = /race|sprint/i.test(sessionName) && !/qualif|shootout/i.test(sessionName)
  if (isRaceSession && raw.champDrivers.length > 0) {
    const sprint = /sprint/i.test(sessionName)
    const table = sprint ? [8, 7, 6, 5, 4, 3, 2, 1] : POINTS
    const gained = new Map<number, number>()
    tower.forEach((r, i) => { gained.set(r.num, started && (!r.out || r.lap >= 0.9 * leaderLap) ? (table[i] ?? 0) : 0) })
    const drows = raw.champDrivers.flatMap(c => {
      const d = drivers.get(c.driver_number)
      if (c.points_start == null || c.position_start == null) return []
      const g = gained.get(c.driver_number) ?? 0
      // drivers not in this session (replaced) keep their standings position
      return [{
        code: d?.name_acronym ?? `#${c.driver_number}`, name: d?.full_name ?? `Piloto ${c.driver_number}`,
        colour: d ? (d.team_colour.startsWith('#') ? d.team_colour : `#${d.team_colour}`) : '#666666',
        posStart: c.position_start, pointsStart: c.points_start, pointsNow: c.points_start + g, posNow: 0, delta: g,
      }]
    }).sort((a, b) => b.pointsNow - a.pointsNow || a.posStart - b.posStart)
    drows.forEach((r, i) => { r.posNow = i + 1 })
    const teamGain = new Map<string, number>()
    for (const r of tower) { const k = teamKey(r.team); teamGain.set(k, (teamGain.get(k) ?? 0) + (gained.get(r.num) ?? 0)) }
    const trows = raw.champTeams.flatMap(c => {
      if (c.points_start == null || c.position_start == null) return []
      const g = teamGain.get(teamKey(c.team_name)) ?? 0
      const dd = raw.drivers.find(d => teamKey(d.team_name) === teamKey(c.team_name))
      return [{ name: c.team_name, colour: dd ? (dd.team_colour.startsWith('#') ? dd.team_colour : `#${dd.team_colour}`) : '#888888', posStart: c.position_start, pointsStart: c.points_start, pointsNow: c.points_start + g, posNow: 0, delta: g }]
    }).sort((a, b) => b.pointsNow - a.pointsNow || a.posStart - b.posStart)
    trows.forEach((r, i) => { r.posNow = i + 1 })
    championship = { drivers: drows, teams: trows, sprint }
  }

  const kind = sessionKindOf(sessionName)
  const results = kind === 'race' ? null : buildResults(raw, tMs, kind, tower, lapsBy, deleted, rc, ts.status)

  const resLaps = Math.max(0, ...raw.results.map(r => r.number_of_laps ?? 0))
  return {
    kind, results, map: mapCars, overtakes, lapChart, lapTimes, fastestSectors: sessionBest, championship,
    t: new Date(tMs).toISOString(), started, status: ts.status, yellowSectors: ts.yellow, leaderLap,
    totalLaps: totalLapsHint ?? (resLaps > 0 ? resLaps : null), tower, fastestLap: fastest,
    neutral: neutralPeriods, trackLimits, racePace, pitWindows, strategyHint: hint, pitLoss, rejoin, undercuts, events: { sc: ts.sc, vsc: ts.vsc, red: ts.red }, raceControl, penalties, deletedLaps, weather, firstRetirement,
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
