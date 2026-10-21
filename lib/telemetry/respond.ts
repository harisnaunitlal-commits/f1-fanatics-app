import { createServiceClient } from '@/lib/supabase/service'
import { loadRaw, of1, type SessionMeta } from './openf1'
import { buildState, provisionalAnswers, driverFromText, type PlayCfg } from './engine'
import { PLAY_FIELDS, QUANTUM_MS, sceneTime, type Scene, type StateResponse, type PlayLine, type LeaderRow } from './shared'
import { getEffectiveGpConfig } from '@/lib/gp-config'
import { P8_MARGENS } from '@/lib/gp-questions'
import { calculatePlayScore } from '@/lib/scoring'
import type { Prediction, GpAnswers } from '@/lib/supabase/types'

// Everything the /telemetria screen needs for one viewer. Identical for all viewers except `me`/`favCode`.
export async function buildStateResponse(viewer: { email: string; isAdmin: boolean; pilotoFav: string | null }, sc: Scene | null): Promise<{ status: number; body: StateResponse }> {
  const { isAdmin } = viewer
  if (!sc?.session_key) return { status: 200, body: { ready: false, isAdmin, message: 'Ainda não há nenhuma sessão montada.' } }
  if (!sc.members_enabled && !isAdmin) return { status: 200, body: { ready: false, disabled: true, message: 'A telemetria ainda está em preparação.' } }

  try {
    const [meta] = await of1<SessionMeta>('sessions', [['session_key', '', sc.session_key]], 3600)
    if (!meta) return { status: 200, body: { ready: false, isAdmin, message: 'Sessão não encontrada no OpenF1.' } }

    const t = Math.floor(sceneTime(sc, Date.now(), Date.parse(meta.date_end) + 20 * 60_000) / QUANTUM_MS) * QUANTUM_MS // everyone shares the same upstream calls
    const raw = await loadRaw(sc.session_key, t, sc.mode === 'live')
    const state = buildState(raw, t, sc.total_laps)
    const drivers = raw.drivers.map(d => ({ code: d.name_acronym, name: d.full_name, team: d.team_name, colour: d.team_colour.startsWith('#') ? d.team_colour : `#${d.team_colour}` }))
    const favCode = driverFromText(viewer.pilotoFav, drivers.map(d => ({ code: d.code, name: d.name })))

    let gp: StateResponse['gp'] = null
    let play: StateResponse['play']
    if (sc.gp_id) {
      const db = createServiceClient()
      const { data: gpRow } = await db.from('gp_calendar').select('nome, emoji_bandeira, round, deadline_play').eq('id', sc.gp_id).single()
      if (gpRow) {
        gp = { nome: gpRow.nome, emoji: gpRow.emoji_bandeira, round: gpRow.round }
        const cfg = (await getEffectiveGpConfig(null, sc.gp_id, gpRow.round)) as PlayCfg | undefined
        const answers = provisionalAnswers(state, cfg, P8_MARGENS)
        const closed = Date.now() >= Date.parse(gpRow.deadline_play)
        const liveAnswers = { gp_id: sc.gp_id, ...answers, perguntas_anuladas: [] } as unknown as GpAnswers
        const [{ data: preds }, { data: members }] = await Promise.all([
          db.from('predictions').select('*').eq('gp_id', sc.gp_id),
          db.from('members').select('email, nickname, foto_url'),
        ])
        const mBy = new Map((members ?? []).map(m => [m.email, m]))
        const nick = (email: string) => mBy.get(email)?.nickname ?? email.split('@')[0]
        const scored = ((preds ?? []) as Prediction[]).map(p => ({ p, s: calculatePlayScore(p, liveAnswers) }))
          .sort((a, b) => b.s.total - a.s.total || nick(a.p.member_email).localeCompare(nick(b.p.member_email))) // stable order for ties

        // other members' standings only appear once predictions are locked (race start); ties share a rank
        const rows: LeaderRow[] = scored.map(({ p, s }) => ({
          nickname: nick(p.member_email), foto_url: mBy.get(p.member_email)?.foto_url ?? null, total: s.total,
          rank: 1 + scored.filter(x => x.s.total > s.total).length, isMe: p.member_email === viewer.email,
        }))
        const leaderboard: LeaderRow[] = closed ? rows.slice(0, 10) : []
        if (closed && !leaderboard.some(r => r.isMe)) { const m = rows.find(r => r.isMe); if (m) leaderboard.push(m) }

        const mine = scored.find(x => x.p.member_email === viewer.email)
        let me: NonNullable<StateResponse['play']>['me'] = null
        if (mine) {
          const lines: PlayLine[] = PLAY_FIELDS.map(f => ({
            field: f.field, label: f.label, weight: f.weight,
            mine: (mine.p as unknown as Record<string, string | null>)[f.field] ?? null, live: answers[f.field] ?? null,
            pts: (mine.s as unknown as Record<string, number>)[f.pts] ?? 0,
          }))
          me = { total: mine.s.total, rank: closed ? 1 + scored.filter(x => x.s.total > mine.s.total).length : null, lines }
        }
        play = { closed, answers, leaderboard, participants: scored.length, me }
      }
    }

    return {
      status: 200,
      body: {
        ready: true, isAdmin,
        scene: { mode: sc.mode, banner: sc.banner, featured: sc.featured, panels: sc.panels, members_enabled: sc.members_enabled, total_laps: sc.total_laps, replay_playing: sc.replay_playing, replay_speed: Number(sc.replay_speed) },
        session: { name: meta.session_name, country: meta.country_name, date_start: meta.date_start, date_end: meta.date_end },
        gp, drivers, state, favCode, play,
      },
    }
  } catch (e) {
    return { status: 502, body: { ready: false, isAdmin, message: `Erro ao ler o OpenF1: ${e instanceof Error ? e.message : 'desconhecido'}` } }
  }
}
