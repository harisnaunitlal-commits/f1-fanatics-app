import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildTriatloEmailPayload } from '@/lib/email'

const resend = new Resend(process.env.RESEND_API_KEY)
import { getEffectiveGpConfig } from '@/lib/gp-config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: member } = await supabaseAdmin
      .from('members').select('is_admin').eq('email', user.email).single()
    if (!member?.is_admin) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const { gp_id, admin_email, send_only_to } = await req.json()
    if (!gp_id) return NextResponse.json({ error: 'gp_id obrigatório.' }, { status: 400 })

    // 1a. Play acumulado (soma de todos os GPs até gp_id inclusive)
    const { data: playScores, error: playErr } = await supabaseAdmin
      .from('scores_play')
      .select('*')
      .lte('gp_id', gp_id)
    if (playErr) return NextResponse.json({ error: playErr.message }, { status: 400 })

    const playMap = new Map<string, number>()
    const playGpMap = new Map<string, number>()
    for (const s of playScores ?? []) {
      playMap.set(s.member_email, (playMap.get(s.member_email) ?? 0) + (s.total ?? 0))
      if (s.gp_id === gp_id) {
        playGpMap.set(s.member_email, s.total ?? 0)
      }
    }

    // 2. Fantasy acumulado para este GP
    const { data: fantasyScores, error: fantasyErr } = await supabaseAdmin
      .from('scores_fantasy')
      .select('member_email, pontos_acum, pontos_gp')
      .eq('gp_id', gp_id)
    if (fantasyErr) return NextResponse.json({ error: fantasyErr.message }, { status: 400 })

    const fantasyMap = new Map<string, number>()
    const fantasyGpMap = new Map<string, number>()
    for (const s of fantasyScores ?? []) {
      fantasyMap.set(s.member_email, s.pontos_acum ?? 0)
      fantasyGpMap.set(s.member_email, s.pontos_gp ?? 0)
    }

    // 3. Predict acumulado para este GP
    const { data: predictScores, error: predictErr } = await supabaseAdmin
      .from('scores_predict')
      .select('member_email, pontos_acum, pontos_gp')
      .eq('gp_id', gp_id)
    if (predictErr) return NextResponse.json({ error: predictErr.message }, { status: 400 })

    const predictMap = new Map<string, number>()
    const predictGpMap = new Map<string, number>()
    for (const s of predictScores ?? []) {
      predictMap.set(s.member_email, s.pontos_acum ?? 0)
      predictGpMap.set(s.member_email, s.pontos_gp ?? 0)
    }

    // 4. Todos os emails únicos
    const allEmails = new Set<string>([
      ...Array.from(playMap.keys()),
      ...Array.from(fantasyMap.keys()),
      ...Array.from(predictMap.keys()),
    ])

    if (allEmails.size === 0) {
      return NextResponse.json({ error: 'Sem dados para calcular. Verifica se há pontuações para este GP.' }, { status: 400 })
    }

    // 5. Máximos para normalização (usando acumulados)
    const maxPlay    = Math.max(...Array.from(playMap.values()),    0)
    const maxFantasy = Math.max(...Array.from(fantasyMap.values()), 0)
    const maxPredict = Math.max(...Array.from(predictMap.values()), 0)

    // 6. Construir linhas
    const rows = Array.from(allEmails).map(email => {
      const play_pts    = playMap.get(email)    ?? 0
      const fantasy_pts = fantasyMap.get(email) ?? 0
      const predict_pts = predictMap.get(email) ?? 0

      const play_gp_pts    = playGpMap.get(email)    ?? 0
      const fantasy_gp_pts = fantasyGpMap.get(email) ?? 0
      const predict_gp_pts = predictGpMap.get(email) ?? 0

      const play_gpts    = maxPlay    > 0 ? Math.round((play_pts    / maxPlay)    * 10000) / 100 : 0
      const fantasy_gpts = maxFantasy > 0 ? Math.round((fantasy_pts / maxFantasy) * 10000) / 100 : 0
      const predict_gpts = maxPredict > 0 ? Math.round((predict_pts / maxPredict) * 10000) / 100 : 0

      const ligas_contribuidas =
        (play_pts > 0 ? 1 : 0) +
        (fantasy_pts > 0 ? 1 : 0) +
        (predict_pts > 0 ? 1 : 0)

      const global_score = ligas_contribuidas > 0
        ? Math.round(((play_gpts + fantasy_gpts + predict_gpts) / ligas_contribuidas) * 100) / 100
        : 0

      return {
        member_email: email,
        gp_id,
        play_pts,
        fantasy_pts,
        predict_pts,
        play_gp_pts,
        fantasy_gp_pts,
        predict_gp_pts,
        play_gpts,
        fantasy_gpts,
        predict_gpts,
        global_score,
        n_ligas: ligas_contribuidas,
        calculado_em: new Date().toISOString(),
      }
    })

    // 7. Upsert no global_ranking
    const { error: upsertErr } = await supabaseAdmin
      .from('global_ranking')
      .upsert(rows, { onConflict: 'member_email,gp_id' })

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 })

    // Audit log
    try {
      await supabaseAdmin.from('audit_log').insert({
        admin_email,
        accao: 'calc_global_ranking',
        gp_id,
        detalhes: { n_rows: rows.length },
      })
    } catch (_) { /* ignore */ }

    // ── Send results emails (awaited — must complete before response) ─────────
    let emailsSent = 0
    try {
      emailsSent = await sendTriatloEmails({ supabaseAdmin, gp_id, rows, playScores: playScores ?? [], send_only_to: send_only_to ?? null, is_test: !!send_only_to })
    } catch (err) {
      console.error('Triatlo emails failed:', err)
    }

    return NextResponse.json({ success: true, n_rows: rows.length, emails_sent: emailsSent })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}

// ── Send Triatlo results emails to all participants ────────────────────────────
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

// Maps score field → prediction/answer field name (same in both tables)
const SCORE_TO_PREDICTION: Record<string, string> = {
  pts_p1a: 'p1_primeiro', pts_p1b: 'p1_segundo',  pts_p1c: 'p1_terceiro',
  pts_p4a: 'p4_quarto',   pts_p4b: 'p4_quinto',   pts_p4c: 'p4_sexto',
  pts_p2:  'p2_equipa',   pts_p3:  'p3_lap',
  pts_p5:  'p5_duelo',    pts_p6:  'p6_duelo',    pts_p7:  'p7_duelo',
  pts_p8:  'p8_margem',   pts_p9:  'p9_retire',
  pts_p10: 'p10_dotd',    pts_p11: 'p11_fl',
  pts_p12: 'p12_classif', pts_p13: 'p13_especial',
  pts_p14: 'p14_sc',      pts_p15: 'p15_outsider',
}

async function sendTriatloEmails({
  supabaseAdmin, gp_id, rows, playScores, send_only_to, is_test,
}: {
  supabaseAdmin: any
  gp_id: number
  rows: any[]
  playScores: any[]
  send_only_to: string | null
  is_test: boolean
}) {
  // Fetch GP info
  const { data: gp } = await supabaseAdmin
    .from('gp_calendar').select('*').eq('id', gp_id).single()
  if (!gp) return 0

  const config = await getEffectiveGpConfig(null, gp_id, gp.round)
  const gpName = config ? `${config.gpPrep} ${config.gpName}` : gp.nome

  // Fetch correct answers and all player predictions for this GP
  const [{ data: gpAnswers }, { data: allPredictions }] = await Promise.all([
    supabaseAdmin.from('gp_answers').select('*').eq('gp_id', gp_id).single(),
    supabaseAdmin.from('predictions').select('*').eq('gp_id', gp_id),
  ])
  const predictionMap = new Map((allPredictions ?? []).map((p: any) => [p.member_email, p]))

  // Fetch member info
  type MemberInfo = { email: string; nickname: string; nome_completo: string | null }
  const emails = rows.map(r => r.member_email)
  const { data: members } = await supabaseAdmin
    .from('members').select('email, nickname, nome_completo').in('email', emails)
  const memberMap = new Map<string, MemberInfo>((members ?? []).map((m: any) => [m.email, m as MemberInfo]))

  // Sort rows by global_score desc to get positions
  const sorted = [...rows].sort((a, b) => b.global_score - a.global_score)
  const globalPosMap = new Map(sorted.map((r, i) => [r.member_email, i + 1]))

  // Sort each league for positions
  const playSorted    = [...rows].filter(r => r.play_pts > 0).sort((a, b) => b.play_pts - a.play_pts)
  const fantasySorted = [...rows].filter(r => r.fantasy_pts > 0).sort((a, b) => b.fantasy_pts - a.fantasy_pts)
  const predictSorted = [...rows].filter(r => r.predict_pts > 0).sort((a, b) => b.predict_pts - a.predict_pts)

  const playPosMap    = new Map(playSorted.map((r, i) => [r.member_email, i + 1]))
  const fantasyPosMap = new Map(fantasySorted.map((r, i) => [r.member_email, i + 1]))
  const predictPosMap = new Map(predictSorted.map((r, i) => [r.member_email, i + 1]))

  // Podium (top 3 global)
  const podium = sorted.slice(0, 3).map((r, i) => {
    const m = memberMap.get(r.member_email)
    return { pos: i + 1, nome: m?.nome_completo || m?.nickname || r.member_email, score: r.global_score }
  })

  // Fetch Play score breakdowns for this GP
  const playGpScores = (playScores ?? []).filter(s => s.gp_id === gp_id)
  const playScoreMap = new Map(playGpScores.map((s: any) => [s.member_email, s]))

  // Build F1 Play GP ranking (all participants sorted by GP points)
  const playGpRanking = [...rows]
    .filter(r => playScoreMap.has(r.member_email))
    .sort((a, b) => b.play_gp_pts - a.play_gp_pts)
    .map((r, i) => {
      const m = memberMap.get(r.member_email)
      return {
        pos: i + 1,
        nome: m?.nome_completo || m?.nickname || r.member_email,
        pts: r.play_gp_pts,
        email: r.member_email,
      }
    })

  // Build all email payloads
  const emailPayloads = []
  for (const row of sorted) {
    const member = memberMap.get(row.member_email)
    if (!member) continue

    const playScore  = playScoreMap.get(row.member_email)
    const prediction = predictionMap.get(row.member_email)
    const breakdown = playScore
      ? Object.entries(SCORE_FIELD_LABELS).map(([key, label]) => {
          const predField = SCORE_TO_PREDICTION[key]
          const pred = prediction as Record<string, any>
          const ans  = gpAnswers  as Record<string, any>
          return {
            label,
            acertou:       (playScore[key] ?? 0) > 0,
            pts:           playScore[key] ?? 0,
            playerAnswer:  pred?.[predField] ?? '',
            correctAnswer: ans?.[predField]  ?? '',
          }
        })
      : []

    const payload = buildTriatloEmailPayload({
      toEmail: row.member_email,
      toName: member.nome_completo || member.nickname || 'Piloto',
      gpNome: gpName,
      gpEmoji: gp.emoji_bandeira || '🏎️',
      globalPosition: globalPosMap.get(row.member_email) ?? 0,
      totalMembers: sorted.length,
      globalScore: row.global_score,
      playGpPts:      row.play_gp_pts ?? 0,
      playTotalPts:   row.play_pts ?? 0,
      playPosition:   playPosMap.get(row.member_email) ?? 0,
      playBreakdown:  breakdown,
      fantasyGpPts:   row.fantasy_gp_pts ?? 0,
      fantasyTotalPts: row.fantasy_pts ?? 0,
      fantasyPosition: fantasyPosMap.get(row.member_email) ?? 0,
      predictGpPts:   row.predict_gp_pts ?? 0,
      predictTotalPts: row.predict_pts ?? 0,
      predictPosition: predictPosMap.get(row.member_email) ?? 0,
      podium,
      playGpRanking,
      currentEmail:   row.member_email,
      isTest:         is_test,
    })
    emailPayloads.push(payload)
  }

  // Batch send — optionally restrict to a single test email
  const payloadsToSend = send_only_to
    ? emailPayloads.filter(p => p.to === send_only_to)
    : emailPayloads

  if (payloadsToSend.length > 0) {
    await resend.batch.send(payloadsToSend)
  }

  return payloadsToSend.length
}
