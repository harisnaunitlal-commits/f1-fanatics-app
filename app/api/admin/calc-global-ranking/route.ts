import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

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

    const { gp_id, admin_email } = await req.json()
    if (!gp_id) return NextResponse.json({ error: 'gp_id obrigatório.' }, { status: 400 })

    // 1. Play acumulado (soma de todos os GPs até gp_id inclusive)
    const { data: playScores, error: playErr } = await supabaseAdmin
      .from('scores_play')
      .select('member_email, total')
      .lte('gp_id', gp_id)
    if (playErr) return NextResponse.json({ error: playErr.message }, { status: 400 })

    const playMap = new Map<string, number>()
    for (const s of playScores ?? []) {
      playMap.set(s.member_email, (playMap.get(s.member_email) ?? 0) + (s.total ?? 0))
    }

    // 2. Fantasy acumulado para este GP
    const { data: fantasyScores, error: fantasyErr } = await supabaseAdmin
      .from('scores_fantasy')
      .select('member_email, pontos_acum')
      .eq('gp_id', gp_id)
    if (fantasyErr) return NextResponse.json({ error: fantasyErr.message }, { status: 400 })

    const fantasyMap = new Map<string, number>()
    for (const s of fantasyScores ?? []) {
      fantasyMap.set(s.member_email, s.pontos_acum ?? 0)
    }

    // 3. Predict acumulado para este GP
    const { data: predictScores, error: predictErr } = await supabaseAdmin
      .from('scores_predict')
      .select('member_email, pontos_acum')
      .eq('gp_id', gp_id)
    if (predictErr) return NextResponse.json({ error: predictErr.message }, { status: 400 })

    const predictMap = new Map<string, number>()
    for (const s of predictScores ?? []) {
      predictMap.set(s.member_email, s.pontos_acum ?? 0)
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

    // 5. Máximos para normalização
    const maxPlay    = Math.max(...Array.from(playMap.values()),    0)
    const maxFantasy = Math.max(...Array.from(fantasyMap.values()), 0)
    const maxPredict = Math.max(...Array.from(predictMap.values()), 0)

    // 6. Construir linhas
    const rows = Array.from(allEmails).map(email => {
      const play_pts    = playMap.get(email)    ?? 0
      const fantasy_pts = fantasyMap.get(email) ?? 0
      const predict_pts = predictMap.get(email) ?? 0

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

    return NextResponse.json({ success: true, n_rows: rows.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
