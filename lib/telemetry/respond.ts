import { createServiceClient } from '@/lib/supabase/service'
import { loadRaw, of1, isoNoZ, type SessionMeta } from './openf1'
import { buildState, computeClock, sessionKindOf, provisionalAnswers, driverFromText, type PlayCfg, type RawSession, type OF1Lap, type OF1Location, type OF1Stint, type TelemetryState } from './engine'
import { resampleLap, compareLaps, type CarSample, type CompareData, type LapTrace } from './compare'
import type { StrategyHint } from './engine'
import { PLAY_FIELDS, QUANTUM_MS, sceneTime, type Scene, type StateResponse, type PlayLine, type LeaderRow, type TyreHistory, type Panels, type PanelKey } from './shared'
import { getEffectiveGpConfig } from '@/lib/gp-config'
import { P8_MARGENS } from '@/lib/gp-questions'
import { calculatePlayScore } from '@/lib/scoring'
import type { Prediction, GpAnswers } from '@/lib/supabase/types'

// ── track outline: one clean lap of x/y, chosen once per session and kept ──
const outlineChoice = new Map<number, { driver: number; start: number; dur: number }>()
const outlineCache = new Map<string, { x: number; y: number }[]>()

async function trackOutline(sessionKey: number, raw: RawSession, tMs: number): Promise<{ x: number; y: number }[] | null> {
  let choice = outlineChoice.get(sessionKey)
  if (!choice) {
    const done = raw.laps.filter(l => l.date_start && l.lap_duration && !l.is_pit_out_lap && l.lap_number > 1 && Date.parse(l.date_start) + l.lap_duration * 1000 <= tMs)
    if (done.length === 0) return null
    const best = Math.min(...done.map(l => l.lap_duration as number))
    const l = done.find(x => (x.lap_duration as number) <= best * 1.08)!
    choice = { driver: l.driver_number, start: Date.parse(l.date_start as string), dur: l.lap_duration as number }
    outlineChoice.set(sessionKey, choice)
  }
  const key = `${sessionKey}|${choice.driver}|${choice.start}`
  const hit = outlineCache.get(key)
  if (hit) return hit
  const rows = await of1<OF1Location>('location', [['session_key', '', sessionKey], ['driver_number', '', choice.driver], ['date', '>=', isoNoZ(choice.start)], ['date', '<=', isoNoZ(choice.start + choice.dur * 1000)]], 86_400)
  const sorted = rows.sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
  if (sorted.length < 40) return null
  const step = Math.max(1, Math.ceil(sorted.length / 180))
  const pts = sorted.filter((_, i) => i % step === 0).map(r => ({ x: r.x, y: r.y }))
  outlineCache.set(key, pts)
  return pts
}

// ── telemetry comparison of the two featured drivers (best lap or last lap each) ──
async function lapTraceFor(sessionKey: number, raw: RawSession, code: string, mode: 'best' | 'last', tMs: number): Promise<LapTrace | null> {
  const d = raw.drivers.find(x => x.name_acronym === code)
  if (!d) return null
  const done = raw.laps.filter((l: OF1Lap) => l.driver_number === d.driver_number && l.date_start && l.lap_duration && !l.is_pit_out_lap && l.lap_number > 1 && Date.parse(l.date_start) + (l.lap_duration as number) * 1000 <= tMs)
  if (done.length === 0) return null
  const lap = mode === 'best'
    ? done.reduce((a, b) => ((b.lap_duration as number) < (a.lap_duration as number) ? b : a))
    : done.reduce((a, b) => (b.lap_number > a.lap_number ? b : a))
  const start = Date.parse(lap.date_start as string)
  const samples = await of1<CarSample>('car_data', [['session_key', '', sessionKey], ['driver_number', '', d.driver_number], ['date', '>=', isoNoZ(start - 300)], ['date', '<=', isoNoZ(start + (lap.lap_duration as number) * 1000 + 300)]], 86_400)
  return resampleLap(samples, start, lap.lap_duration as number, { code, colour: d.team_colour.startsWith('#') ? d.team_colour : `#${d.team_colour}`, lap: lap.lap_number })
}

async function buildCompare(sessionKey: number, raw: RawSession, featured: string[], mode: 'best' | 'last', tMs: number): Promise<CompareData | null> {
  if (featured.length < 2) return null
  const [a, b] = await Promise.all([lapTraceFor(sessionKey, raw, featured[0], mode, tMs), lapTraceFor(sessionKey, raw, featured[1], mode, tMs)])
  return a && b ? compareLaps(mode, a, b) : null
}

// ── tyres used in the earlier sessions of the same weekend (finished sessions never change: cached a day) ──
const SHORT: [RegExp, string][] = [[/sprint qualifying|sprint shootout/i, 'SQ'], [/sprint/i, 'Sprint'], [/practice 1/i, 'FP1'], [/practice 2/i, 'FP2'], [/practice 3/i, 'FP3'], [/qualifying/i, 'Q'], [/race/i, 'Corrida']]
const shortName = (n: string) => SHORT.find(([re]) => re.test(n))?.[1] ?? n

async function buildTyreHistory(meta: SessionMeta, raw: RawSession, state: TelemetryState): Promise<TyreHistory | null> {
  const all = await of1<SessionMeta>('sessions', [['meeting_key', '', meta.meeting_key]], 3600)
  const before = all.filter(s => Date.parse(s.date_start) < Date.parse(meta.date_start)).sort((a, b) => Date.parse(a.date_start) - Date.parse(b.date_start))
  if (before.length === 0) return { sessions: [], drivers: [] } // first session of the weekend
  const stintsBy = await Promise.all(before.map(s => of1<OF1Stint>('stints', [['session_key', '', s.session_key]], 86_400)))
  const numToCode = new Map(raw.drivers.map(d => [d.driver_number, d.name_acronym]))
  const drivers: TyreHistory['drivers'] = state.tower.map(r => {
    const bySession = stintsBy.map(st => st
      .filter(x => numToCode.get(x.driver_number) === r.code && x.lap_start != null)
      .sort((a, b) => a.stint_number - b.stint_number)
      .map(x => ({ compound: x.compound, laps: x.lap_end != null ? x.lap_end - (x.lap_start as number) + 1 : 0 })))
    const totals: Record<string, number> = {}
    bySession.flat().forEach(x => { if (x.compound) totals[x.compound] = (totals[x.compound] ?? 0) + x.laps })
    return { code: r.code, colour: r.colour, bySession, totals }
  })
  return { sessions: before.map(s => ({ key: s.session_key, short: shortName(s.session_name) })), drivers }
}

// Stops usual at this circuit (last seasons, without Safety Car / red flag), to judge pit windows. Kept 6 h.
const hintCache = new Map<number, { at: number; hint: StrategyHint | null }>()
async function loadStrategyHint(gpId: number): Promise<StrategyHint | null> {
  const hit = hintCache.get(gpId)
  if (hit && Date.now() - hit.at < 6 * 3600_000) return hit.hint
  let hint: StrategyHint | null = null
  try {
    const db = createServiceClient()
    const { data } = await db.from('gp_history').select('avg_stops, first_stop_lap').eq('gp_id', gpId)
    const stops = (data ?? []).map(r => (r.avg_stops == null ? null : Number(r.avg_stops))).filter((v): v is number => v !== null && v >= 0.5)   // below 0.5: red-flag race, not representative
    const firsts = (data ?? []).map(r => r.first_stop_lap).filter((v): v is number => v != null).sort((a, b) => a - b)
    if (stops.length) hint = { typicalStops: stops.reduce((a, b) => a + b, 0) / stops.length, firstStopLap: firsts.length ? firsts[Math.floor(firsts.length / 2)] : null }
  } catch { /* no history: windows fall back to "sem dados" */ }
  hintCache.set(gpId, { at: Date.now(), hint })
  return hint
}

// The admin decides what members see: data of switched-off panels is not sent at all (not just hidden).
function trimToPanels(s: TelemetryState, p: Panels): TelemetryState {
  const on = (k: PanelKey) => p[k] !== false
  return {
    ...s,
    map: on('map') ? s.map : [],
    overtakes: on('positions') ? s.overtakes : [],
    lapChart: on('positions') ? s.lapChart : [],
    lapTimes: on('laps') ? s.lapTimes : [],
    fastestSectors: on('laps') ? s.fastestSectors : [null, null, null],
    championship: on('championship') ? s.championship : null,
    undercuts: on('strategy') ? s.undercuts : [],
    pitWindows: on('strategy') ? s.pitWindows : [],
    trackLimits: on('limits') ? s.trackLimits : [],
    racePace: on('laps') || on('strategy') ? s.racePace : [],
    rejoin: on('strategy') || on('ours') ? s.rejoin : [],
    raceControl: on('control') ? s.raceControl : [],
    penalties: on('control') ? s.penalties : [],
  }
}

// Auto-follow: during a live weekend, show the session in progress (or the latest finished one) of the same meeting.
async function followSession(baseKey: number, nowMs: number): Promise<number> {
  try {
    const [base] = await of1<SessionMeta>('sessions', [['session_key', '', baseKey]], 3600)
    if (!base) return baseKey
    const sibs = (await of1<SessionMeta>('sessions', [['meeting_key', '', base.meeting_key]], 600)).sort((a, b) => Date.parse(a.date_start) - Date.parse(b.date_start))
    if (sibs.length === 0) return baseKey
    const started = sibs.filter(x => Date.parse(x.date_start) - 10 * 60_000 <= nowMs)
    return (started.length ? started[started.length - 1] : sibs[0]).session_key
  } catch { return baseKey }
}

// Predictions, members and question config barely change during a race: keep them 30 s.
interface PlayData {
  at: number
  gpRow: { nome: string; emoji_bandeira: string | null; round: number; deadline_play: string } | null
  cfg: PlayCfg | undefined
  preds: Prediction[]
  members: { email: string; nickname: string; foto_url: string | null }[]
  base: Map<string, number>                  // official F1 Play points of the other GPs already scored, per member
  official: Record<string, string | null>   // answers the admin already entered (e.g. Driver of the Day): they win over the live guess
}
const playCache = new Map<number, PlayData>()

async function loadPlayData(gpId: number): Promise<PlayData> {
  const hit = playCache.get(gpId)
  if (hit && Date.now() - hit.at < 30_000) return hit
  const db = createServiceClient()
  const { data: gpRow } = await db.from('gp_calendar').select('nome, emoji_bandeira, round, deadline_play').eq('id', gpId).single()
  const [cfg, { data: preds }, { data: members }, { data: official }, { data: prev }] = await Promise.all([
    gpRow ? getEffectiveGpConfig(null, gpId, gpRow.round) as Promise<PlayCfg | undefined> : Promise.resolve(undefined),
    db.from('predictions').select('*').eq('gp_id', gpId),
    db.from('members').select('email, nickname, foto_url'),
    db.from('gp_answers').select('*').eq('gp_id', gpId).maybeSingle(),
    db.from('scores_play').select('member_email, total').neq('gp_id', gpId),
  ])
  const base = new Map<string, number>()
  for (const r of (prev ?? []) as { member_email: string; total: number | null }[]) base.set(r.member_email, (base.get(r.member_email) ?? 0) + (r.total ?? 0))
  const pd: PlayData = { at: Date.now(), gpRow: gpRow ?? null, cfg, preds: (preds ?? []) as Prediction[], members: members ?? [], base, official: (official ?? {}) as Record<string, string | null> }
  playCache.set(gpId, pd)
  return pd
}

// Everything the /telemetria screen needs for one viewer. Identical for all viewers except `me`/`favCode`.
export async function buildStateResponse(viewer: { email: string; isAdmin: boolean; pilotoFav: string | null }, sc: Scene | null): Promise<{ status: number; body: StateResponse }> {
  const { isAdmin } = viewer
  if (!sc?.session_key) return { status: 200, body: { ready: false, isAdmin, message: 'Ainda não há nenhuma sessão montada.' } }
  if (!sc.members_enabled && !isAdmin) return { status: 200, body: { ready: false, disabled: true, message: 'A telemetria ainda está em preparação.' } }

  try {
    const sessionKey = sc.auto_follow && sc.mode === 'live' ? await followSession(sc.session_key, Date.now()) : sc.session_key
    const [meta] = await of1<SessionMeta>('sessions', [['session_key', '', sessionKey]], 3600)
    if (!meta) return { status: 200, body: { ready: false, isAdmin, message: 'Sessão não encontrada no OpenF1.' } }

    const rawT = sceneTime(sc, Date.now(), Date.parse(meta.date_end) + 20 * 60_000)
    const t = Math.floor(rawT / QUANTUM_MS) * QUANTUM_MS // everyone shares the same upstream calls
    const raw = await loadRaw(sessionKey, t, sc.mode === 'live', meta.session_name)
    const hint = sc.gp_id ? await loadStrategyHint(sc.gp_id) : null
    const state = buildState(raw, t, sc.total_laps, meta.session_name, hint)
    const panels = sc.panels ?? {}
    const [outline, compare, tyreHistory] = await Promise.all([
      panels.map !== false ? trackOutline(sessionKey, raw, t).catch(() => null) : Promise.resolve(null),
      panels.compare !== false ? buildCompare(sessionKey, raw, sc.featured, sc.compare_mode ?? 'best', t).catch(() => null) : Promise.resolve(null),
      panels.tyres !== false ? buildTyreHistory(meta, raw, state).catch(() => null) : Promise.resolve(null),
    ])
    const drivers = raw.drivers.map(d => ({ code: d.name_acronym, name: d.full_name, team: d.team_name, colour: d.team_colour.startsWith('#') ? d.team_colour : `#${d.team_colour}` }))
    const favCode = driverFromText(viewer.pilotoFav, drivers.map(d => ({ code: d.code, name: d.name })))

    let gp: StateResponse['gp'] = null
    let play: StateResponse['play']
    if (sc.gp_id) {
      const { gpRow, cfg, preds, members, official, base } = await loadPlayData(sc.gp_id)
      if (gpRow) {
        gp = { nome: gpRow.nome, emoji: gpRow.emoji_bandeira, round: gpRow.round }
        const answers = provisionalAnswers(state, cfg, P8_MARGENS)
        for (const f of PLAY_FIELDS) { const v = official[f.field]; if (typeof v === 'string' && v) answers[f.field] = v }
        const closed = Date.now() >= Date.parse(gpRow.deadline_play)
        const liveAnswers = { gp_id: sc.gp_id, ...answers, perguntas_anuladas: [] } as unknown as GpAnswers
        const mBy = new Map(members.map(m => [m.email, m]))
        const nick = (email: string) => mBy.get(email)?.nickname ?? email.split('@')[0]
        const scored = preds.map(p => ({ p, s: calculatePlayScore(p, liveAnswers) }))
          .sort((a, b) => b.s.total - a.s.total || nick(a.p.member_email).localeCompare(nick(b.p.member_email))) // stable order for ties

        // other members' standings only appear once predictions are locked (race start); ties share a rank
        const rows: LeaderRow[] = scored.map(({ p, s }) => ({
          nickname: nick(p.member_email), foto_url: mBy.get(p.member_email)?.foto_url ?? null, total: s.total,
          rank: 1 + scored.filter(x => x.s.total > s.total).length, isMe: p.member_email === viewer.email,
        }))
        const leaderboard: LeaderRow[] = closed ? rows.slice(0, 10) : []
        if (closed && !leaderboard.some(r => r.isMe)) { const m = rows.find(r => r.isMe); if (m) leaderboard.push(m) }

        // season aggregate: official points of the GPs already scored + this GP's provisional points (ties share a rank)
        const gpPts = new Map(scored.map(x => [x.p.member_email, x.s.total]))
        const emails = Array.from(new Set([...Array.from(base.keys()), ...Array.from(gpPts.keys())]))
        const agg = emails.map(e => ({ e, base: base.get(e) ?? 0, gp: gpPts.get(e) ?? 0 }))
          .map(a => ({ ...a, total: a.base + a.gp }))
          .filter(a => a.total > 0 || gpPts.has(a.e))
          .sort((a, b) => b.total - a.total || nick(a.e).localeCompare(nick(b.e)))
        const aggRows = agg.map(a => ({
          nickname: nick(a.e), foto_url: mBy.get(a.e)?.foto_url ?? null, total: a.total, base: a.base, gpPts: a.gp,
          rank: 1 + agg.filter(x => x.total > a.total).length, prevRank: 1 + agg.filter(x => x.base > a.base).length, isMe: a.e === viewer.email,
        }))
        const aggregate = closed ? aggRows.slice(0, 10) : []
        if (closed && !aggregate.some(r => r.isMe)) { const m = aggRows.find(r => r.isMe); if (m) aggregate.push(m) }

        const mine = scored.find(x => x.p.member_email === viewer.email)
        let me: NonNullable<StateResponse['play']>['me'] = null
        if (mine) {
          const p2Rank = /PRIMEIRA/i.test(cfg?.p2Label ?? '') ? '1.ª' : /TERCEIRA/i.test(cfg?.p2Label ?? '') ? '3.ª' : '2.ª'
          const lines: PlayLine[] = PLAY_FIELDS.map(f => ({
            field: f.field, label: f.field === 'p2_equipa' ? `Equipa (${p2Rank} a pontuar)` : f.label, weight: f.weight,
            mine: (mine.p as unknown as Record<string, string | null>)[f.field] ?? null, live: answers[f.field] ?? null,
            pts: (mine.s as unknown as Record<string, number>)[f.pts] ?? 0,
          }))
          me = { total: mine.s.total, rank: closed ? 1 + scored.filter(x => x.s.total > mine.s.total).length : null, lines }
        }
        play = { closed, answers, leaderboard, aggregate, participants: scored.length, me }
      }
    }

    return {
      status: 200,
      body: {
        ready: true, isAdmin,
        scene: { mode: sc.mode, banner: sc.banner, featured: sc.featured, panels: sc.panels, members_enabled: sc.members_enabled, total_laps: sc.total_laps, replay_playing: sc.replay_playing, replay_speed: Number(sc.replay_speed), compare_mode: sc.compare_mode ?? 'best', tyre_allocation: sc.tyre_allocation ?? null, auto_follow: !!sc.auto_follow },
        session: { name: meta.session_name, country: meta.country_name, date_start: meta.date_start, date_end: meta.date_end },
        clock: (() => { const c = computeClock(raw.raceControl, sessionKindOf(meta.session_name), meta.session_name, { start: Date.parse(meta.date_start), end: Date.parse(meta.date_end) }, rawT); return c ? { ...c, endsAtMs: c.remainingMs !== null ? rawT + c.remainingMs : null } : null })(),
        serverNow: Date.now(), serverT: rawT, live: sc.mode === 'live',
        gp, drivers, state: trimToPanels(state, panels), outline, compare, tyreHistory, favCode, play,
      },
    }
  } catch (e) {
    return { status: 502, body: { ready: false, isAdmin, message: `Erro ao ler o OpenF1: ${e instanceof Error ? e.message : 'desconhecido'}` } }
  }
}
