import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendGpResults } from '@/lib/email'
import { getEffectiveGpConfig } from '@/lib/gp-config'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const FIELD_LABELS: Record<string, string> = {
  p1_primeiro:  '🥇 1º Lugar',
  p1_segundo:   '🥈 2º Lugar',
  p1_terceiro:  '🥉 3º Lugar',
  p4_quarto:    '4º Lugar',
  p4_quinto:    '5º Lugar',
  p4_sexto:     '6º Lugar',
  p2_equipa:    'P2 · Equipa',
  p3_lap:       'P3 · Volta de Avanço',
  p5_duelo:     'P5 · Duelo 1',
  p6_duelo:     'P6 · Duelo 2',
  p7_duelo:     'P7 · Duelo 3',
  p8_margem:    'P8 · Margem de Vitória',
  p9_retire:    'P9 · First to Retire',
  p10_dotd:     'P10 · Driver of the Day',
  p11_fl:       'P11 · Volta Mais Rápida',
  p12_classif:  'P12 · Nº Classificados',
  p13_especial: 'P13 · Pergunta Especial',
  p14_sc:       'P14 · Safety Car',
  p15_outsider: 'P15 · Outsider',
}

const SCORE_FIELDS: Record<string, string> = {
  pts_p1a: 'p1_primeiro', pts_p1b: 'p1_segundo', pts_p1c: 'p1_terceiro',
  pts_p2: 'p2_equipa', pts_p3: 'p3_lap',
  pts_p4a: 'p4_quarto', pts_p4b: 'p4_quinto', pts_p4c: 'p4_sexto',
  pts_p5: 'p5_duelo', pts_p6: 'p6_duelo', pts_p7: 'p7_duelo',
  pts_p8: 'p8_margem', pts_p9: 'p9_retire', pts_p10: 'p10_dotd',
  pts_p11: 'p11_fl', pts_p12: 'p12_classif',
  pts_p13: 'p13_especial', pts_p14: 'p14_sc', pts_p15: 'p15_outsider',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

    const { data: admin } = await supabaseAdmin
      .from('members').select('is_admin').eq('email', user.email).single()
    if (!admin?.is_admin) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const { gp_id } = await req.json()
    if (!gp_id) return NextResponse.json({ error: 'gp_id obrigatório.' }, { status: 400 })

    // Fetch GP
    const { data: gp } = await supabaseAdmin
      .from('gp_calendar').select('*').eq('id', gp_id).single()
    if (!gp) return NextResponse.json({ error: 'GP não encontrado.' }, { status: 404 })

    const config = await getEffectiveGpConfig(null, gp_id, gp.round)
    const gpName = config ? `${config.gpPrep} ${config.gpName}` : gp.nome

    // Fetch all scores for this GP
    const { data: scores } = await supabaseAdmin
      .from('scores_play')
      .select('*')
      .eq('gp_id', gp_id)
      .eq('participou', true)
      .order('total', { ascending: false })

    if (!scores || scores.length === 0)
      return NextResponse.json({ error: 'Sem scores para este GP.' }, { status: 400 })

    const maxPoints = scores[0]?.total ?? 0
    const podium = scores.slice(0, 3).map((s: any, i: number) => ({
      pos: i + 1,
      nome: s.member_email,
      pts: s.total ?? 0,
    }))

    // Fetch member names for podium
    const podiumEmails = podium.map(p => p.nome)
    const { data: podiumMembers } = await supabaseAdmin
      .from('members').select('email, nickname, nome_completo')
      .in('email', podiumEmails)

    const nameMap = new Map(
      (podiumMembers ?? []).map((m: any) => [m.email, m.nome_completo || m.nickname])
    )
    const podiumNamed = podium.map(p => ({ ...p, nome: nameMap.get(p.nome) || p.nome }))

    // Fetch all members who participated
    const participantEmails = scores.map((s: any) => s.member_email)
    const { data: members } = await supabaseAdmin
      .from('members').select('email, nickname, nome_completo')
      .in('email', participantEmails)

    const memberMap = new Map(
      (members ?? []).map((m: any) => [m.email, m])
    )

    // Fetch predictions for breakdown
    const { data: predictions } = await supabaseAdmin
      .from('predictions').select('*')
      .eq('gp_id', gp_id)
      .in('member_email', participantEmails)

    const predMap = new Map(
      (predictions ?? []).map((p: any) => [p.member_email, p])
    )

    // Send emails to all participants
    let sent = 0
    let failed = 0

    for (let i = 0; i < scores.length; i++) {
      const score = scores[i]
      const member = memberMap.get(score.member_email)
      if (!member) continue

      const prediction = predMap.get(score.member_email)

      // Build breakdown
      const breakdown = Object.entries(SCORE_FIELDS).map(([scoreKey, predKey]) => {
        const pts = score[scoreKey] ?? 0
        const fieldLabel = FIELD_LABELS[predKey] || predKey
        return {
          label: fieldLabel,
          acertou: pts > 0,
          pts,
        }
      }).filter(b => {
        // Only show questions the member answered
        return prediction?.[SCORE_FIELDS[
          Object.keys(SCORE_FIELDS).find(k => SCORE_FIELDS[k] === b.label.replace(/.*·\s*/, '').trim()) || ''
        ]]
      })

      // Simpler: show all with pts > 0 as correct, others as incorrect only if answered
      const fullBreakdown = Object.entries(SCORE_FIELDS).map(([scoreKey, predKey]) => ({
        label: FIELD_LABELS[predKey] || predKey,
        acertou: (score[scoreKey] ?? 0) > 0,
        pts: score[scoreKey] ?? 0,
      }))

      try {
        await sendGpResults({
          toEmail: score.member_email,
          toName: member.nome_completo || member.nickname || 'Piloto',
          gpNome: gpName,
          gpEmoji: gp.emoji_bandeira || '🏎️',
          position: i + 1,
          totalParticipants: scores.length,
          points: score.total ?? 0,
          maxPoints,
          breakdown: fullBreakdown,
          podium: podiumNamed,
        })
        sent++
        // Small delay to avoid rate limiting
        if (i < scores.length - 1) await new Promise(r => setTimeout(r, 200))
      } catch (err) {
        console.error(`Email failed for ${score.member_email}:`, err)
        failed++
      }
    }

    return NextResponse.json({ success: true, sent, failed })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
