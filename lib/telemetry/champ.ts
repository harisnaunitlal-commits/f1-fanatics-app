import { buildState, type ChampRow, type ChampTeamRow, type TrackStatus } from './engine'
import { listSessions, loadRawChamp } from './openf1'
import { createServiceClient } from '@/lib/supabase/service'
import { titleInfo, type TitleInfo } from './title'

export type { TitleInfo, TitleRival, TitleScenario } from './title'

// Public "live championship": standings if the (latest) race ended now, plus what the leader needs to be
// champion. Works from the latest Race session OpenF1 knows about: during the race it follows the running
// order, afterwards it keeps showing the result until the next race starts.

export interface ChampResponse {
  ready: boolean
  message?: string
  session?: { name: string; country: string; startMs: number; live: boolean; finished: boolean; lap: number; status: TrackStatus }
  drivers?: ChampRow[]
  teams?: ChampTeamRow[]
  title?: TitleInfo | null
  serverNow?: number
}

export async function buildChampionshipResponse(): Promise<ChampResponse> {
  const now = Date.now()
  const year = new Date().getUTCFullYear()
  const sessions = await listSessions(year)
  const races = sessions.filter(s => s.session_name === 'Race' && Date.parse(s.date_start) <= now)
  const target = races[races.length - 1]
  if (!target) return { ready: false, message: 'Ainda não há corridas esta temporada.' }

  const startMs = Date.parse(target.date_start)
  const live = now < startMs + 3.5 * 3600_000
  const raw = await loadRawChamp(target.session_key, live)
  const s = buildState(raw, now, null, 'Race')
  if (!s.championship || s.championship.drivers.length === 0) return { ready: false, message: 'O OpenF1 ainda não publicou o campeonato desta corrida.' }

  // the calendar lives in our own database: which race do the title scenarios refer to?
  //  - race in progress (or just over): this race, with the rounds after it still to come
  //  - otherwise: the next race, standings = what the last race left
  const db = createServiceClient()
  const { data: cal } = await db.from('gp_calendar').select('nome, data_corrida, is_sprint').order('data_corrida')
  const rounds = (cal ?? []).map(r => ({ nome: r.nome as string, at: Date.parse(r.data_corrida), sprint: !!r.is_sprint }))
  const upcoming = rounds.find(r => r.at > now)
  const targetNome = rounds.find(r => Math.abs(r.at - startMs) < 8 * 3600_000)?.nome ?? target.country_name
  const focus = live ? { nome: targetNome, at: startMs } : upcoming
  const after = focus ? rounds.filter(r => r.at > focus.at + 3 * 3600_000) : []
  const mode = live ? 'live' as const : upcoming ? 'prerace' as const : 'done' as const
  // before the next race nothing has been scored in it yet: start points = current points
  const base = mode === 'live' ? s.championship.drivers : s.championship.drivers.map(d => ({ ...d, pointsStart: d.pointsNow, delta: 0 }))
  const title = titleInfo(base, after.length, after.filter(r => r.sprint).length, mode, focus?.nome ?? null)

  return {
    ready: true,
    session: { name: `GP ${targetNome}`, country: target.country_name, startMs, live: live && s.status !== 'FINISHED', finished: s.status === 'FINISHED' || !live, lap: s.leaderLap, status: s.status },
    drivers: s.championship.drivers,
    teams: s.championship.teams,
    title,
    serverNow: now,
  }
}
