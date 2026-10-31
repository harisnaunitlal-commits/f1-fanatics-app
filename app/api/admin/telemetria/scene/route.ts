import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { of1, type SessionMeta } from '@/lib/telemetry/openf1'
import { sceneTime, PANEL_KEYS, type Scene } from '@/lib/telemetry/shared'

export const dynamic = 'force-dynamic'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const db = createServiceClient()
  const { data: me } = await db.from('members').select('is_admin').eq('email', user.email).single()
  return me?.is_admin ? db : null
}

export async function POST(req: NextRequest) {
  const db = await requireAdmin()
  if (!db) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

  const { action = 'set', ...body } = await req.json() as { action?: string } & Record<string, unknown>
  const { data: cur } = await db.from('telemetry_scene').select('*').eq('id', 1).single()
  if (!cur) return NextResponse.json({ error: 'Tabela telemetry_scene em falta.' }, { status: 500 })
  const scene = cur as Scene
  const nowMs = Date.now()
  const nowIso = new Date(nowMs).toISOString()
  const curT = sceneTime(scene, nowMs)
  const patch: Record<string, unknown> = {}

  if (typeof body.session_key === 'number') patch.session_key = body.session_key
  if (body.gp_id === null || typeof body.gp_id === 'number') patch.gp_id = body.gp_id
  if (body.mode === 'replay' || body.mode === 'live') patch.mode = body.mode
  if (body.total_laps === null || (typeof body.total_laps === 'number' && body.total_laps > 0 && body.total_laps < 100)) patch.total_laps = body.total_laps
  if (typeof body.members_enabled === 'boolean') patch.members_enabled = body.members_enabled
  if (body.banner === null || typeof body.banner === 'string') patch.banner = body.banner ? body.banner.slice(0, 160) : null
  if (Array.isArray(body.featured)) patch.featured = body.featured.filter((c): c is string => typeof c === 'string' && /^[A-Z]{3}$/.test(c)).slice(0, 4)
  if (body.panels && typeof body.panels === 'object') {
    const p = body.panels as Record<string, unknown>
    patch.panels = Object.fromEntries(PANEL_KEYS.map(k => [k, k === 'radio' ? p[k] === true : p[k] !== false]))
  }
  if ('tyre_allocation' in body) {
    const a = body.tyre_allocation as Record<string, unknown> | null
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(20, Math.max(0, Math.round(v))) : 0)
    patch.tyre_allocation = a && (n(a.HARD) || n(a.MEDIUM) || n(a.SOFT)) ? { HARD: n(a.HARD), MEDIUM: n(a.MEDIUM), SOFT: n(a.SOFT) } : null
  }
  if (typeof body.auto_follow === 'boolean') patch.auto_follow = body.auto_follow
  if (body.compare_mode === 'best' || body.compare_mode === 'last') patch.compare_mode = body.compare_mode

  if (typeof patch.session_key === 'number' && patch.session_key !== scene.session_key) {
    const [meta] = await of1<SessionMeta>('sessions', [['session_key', '', patch.session_key]], 600)
    patch.replay_anchor_session = meta?.date_start ?? nowIso
    patch.replay_anchor_real = nowIso
    patch.replay_playing = false
  }
  if (action === 'play') { patch.replay_anchor_session = new Date(curT).toISOString(); patch.replay_anchor_real = nowIso; patch.replay_playing = true }
  if (action === 'pause') { patch.replay_anchor_session = new Date(curT).toISOString(); patch.replay_anchor_real = nowIso; patch.replay_playing = false }
  if (action === 'seek' && typeof body.to === 'string' && !Number.isNaN(Date.parse(body.to))) { patch.replay_anchor_session = body.to; patch.replay_anchor_real = nowIso }
  if (action === 'speed' && typeof body.speed === 'number' && body.speed > 0 && body.speed <= 60) {
    patch.replay_anchor_session = new Date(curT).toISOString(); patch.replay_anchor_real = nowIso; patch.replay_speed = body.speed
  }
  patch.updated_at = nowIso

  const { data, error } = await db.from('telemetry_scene').update(patch).eq('id', 1).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ scene: data })
}
