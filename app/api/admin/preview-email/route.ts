import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { buildTriatloEmailPayload } from '@/lib/email'
import { getEffectiveGpConfig } from '@/lib/gp-config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(req: NextRequest) {
  // Auth check
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return new NextResponse('Não autenticado.', { status: 401 })
  const { data: member } = await supabaseAdmin
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!member?.is_admin) return new NextResponse('Sem permissão.', { status: 403 })

  const { searchParams } = new URL(req.url)
  const type   = searchParams.get('type') ?? 'results'   // 'results' | 'confirm'
  const gp_id  = parseInt(searchParams.get('gp_id') ?? '0')
  const email  = searchParams.get('email') ?? user.email

  // ── Prediction Confirmation preview ──────────────────────────────────────────
  if (type === 'confirm') {
    const { buildPredictionConfirmHtml } = await import('@/lib/email-preview')
    const html = buildPredictionConfirmHtml({ email, gpNome: 'Mónaco' })
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // ── Results email preview ─────────────────────────────────────────────────────
  if (!gp_id) return new NextResponse('gp_id obrigatório.', { status: 400 })

  // Fetch GP
  const { data: gp } = await supabaseAdmin
    .from('gp_calendar').select('*').eq('id', gp_id).single()
  if (!gp) return new NextResponse('GP não encontrado.', { status: 404 })

  const config = await getEffectiveGpConfig(null, gp_id, gp.round)
  const gpName = config ? `${config.gpPrep} ${config.gpName}` : gp.nome

  // Fetch global_ranking for this GP
  const { data: rankingRows } = await supabaseAdmin
    .from('global_ranking').select('*').eq('gp_id', gp_id)
  if (!rankingRows || rankingRows.length === 0)
    return new NextResponse('Sem dados de ranking para este GP.', { status: 404 })

  // Member info
  const emails = rankingRows.map((r: any) => r.member_email)
  const { data: members } = await supabaseAdmin
    .from('members').select('email, nickname, nome_completo').in('email', emails)
  type MemberInfo = { email: string; nickname: string; nome_completo: string | null }
  const memberMap = new Map<string, MemberInfo>((members ?? []).map((m: any) => [m.email, m as MemberInfo]))

  // Sort for positions
  const sorted = [...rankingRows].sort((a: any, b: any) => b.global_score - a.global_score)
  const globalPosMap = new Map(sorted.map((r: any, i: number) => [r.member_email, i + 1]))

  const playSorted    = [...rankingRows].filter((r: any) => r.play_pts > 0).sort((a: any, b: any) => b.play_pts - a.play_pts)
  const fantasySorted = [...rankingRows].filter((r: any) => r.fantasy_pts > 0).sort((a: any, b: any) => b.fantasy_pts - a.fantasy_pts)
  const predictSorted = [...rankingRows].filter((r: any) => r.predict_pts > 0).sort((a: any, b: any) => b.predict_pts - a.predict_pts)
  const playPosMap    = new Map(playSorted.map((r: any, i: number) => [r.member_email, i + 1]))
  const fantasyPosMap = new Map(fantasySorted.map((r: any, i: number) => [r.member_email, i + 1]))
  const predictPosMap = new Map(predictSorted.map((r: any, i: number) => [r.member_email, i + 1]))

  // Podium
  const podium = sorted.slice(0, 3).map((r: any, i: number) => {
    const m = memberMap.get(r.member_email)
    return { pos: i + 1, nome: m?.nome_completo || m?.nickname || r.member_email, score: r.global_score }
  })

  // Play scores for breakdown
  const { data: playScores } = await supabaseAdmin
    .from('scores_play').select('*').eq('gp_id', gp_id)
  const playScoreMap = new Map((playScores ?? []).map((s: any) => [s.member_email, s]))

  const SCORE_FIELD_LABELS: Record<string, string> = {
    pts_p1a: '🥇 1º Lugar',   pts_p1b: '🥈 2º Lugar',   pts_p1c: '🥉 3º Lugar',
    pts_p4a: '4º Lugar',       pts_p4b: '5º Lugar',       pts_p4c: '6º Lugar',
    pts_p2:  'P2 · Equipa',    pts_p3:  'P3 · Volta de Avanço',
    pts_p5:  'P5 · Duelo 1',   pts_p6:  'P6 · Duelo 2',   pts_p7:  'P7 · Duelo 3',
    pts_p8:  'P8 · Margem',    pts_p9:  'P9 · First to Retire',
    pts_p10: 'P10 · DOTD',     pts_p11: 'P11 · Volta Rápida',
    pts_p12: 'P12 · Classificados', pts_p13: 'P13 · Especial',
    pts_p14: 'P14 · Safety Car', pts_p15: 'P15 · Outsider',
  }

  // Build F1 Play GP ranking
  const playGpRanking = [...rankingRows]
    .filter((r: any) => playScoreMap.has(r.member_email))
    .sort((a: any, b: any) => b.play_gp_pts - a.play_gp_pts)
    .map((r: any, i: number) => {
      const m = memberMap.get(r.member_email)
      return { pos: i + 1, nome: m?.nome_completo || m?.nickname || r.member_email, pts: r.play_gp_pts, email: r.member_email }
    })

  // Find the target row
  const row = rankingRows.find((r: any) => r.member_email === email)
    ?? sorted[0] // fallback to #1
  const targetEmail = row.member_email

  const playScore = playScoreMap.get(targetEmail)
  const breakdown = playScore
    ? Object.entries(SCORE_FIELD_LABELS).map(([key, label]) => ({
        label, acertou: (playScore[key] ?? 0) > 0, pts: playScore[key] ?? 0,
      }))
    : []

  const payload = buildTriatloEmailPayload({
    toEmail: targetEmail,
    toName: memberMap.get(targetEmail)?.nome_completo || memberMap.get(targetEmail)?.nickname || 'Piloto',
    gpNome: gpName,
    gpEmoji: gp.emoji_bandeira || '🏎️',
    globalPosition: globalPosMap.get(targetEmail) ?? 0,
    totalMembers: sorted.length,
    globalScore: row.global_score,
    playGpPts:      row.play_gp_pts ?? 0,
    playTotalPts:   row.play_pts ?? 0,
    playPosition:   playPosMap.get(targetEmail) ?? 0,
    playBreakdown:  breakdown,
    fantasyGpPts:   row.fantasy_gp_pts ?? 0,
    fantasyTotalPts: row.fantasy_pts ?? 0,
    fantasyPosition: fantasyPosMap.get(targetEmail) ?? 0,
    predictGpPts:   row.predict_gp_pts ?? 0,
    predictTotalPts: row.predict_pts ?? 0,
    predictPosition: predictPosMap.get(targetEmail) ?? 0,
    podium,
    playGpRanking,
    currentEmail: targetEmail,
  })

  return new NextResponse(payload.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
