import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendPredictionConfirmation } from '@/lib/email'
import { isDeadlinePassed, isBeforeFP1 } from '@/lib/scoring'
import { getEffectiveGpConfig } from '@/lib/gp-config'
import { invalidAnswers, CONFIG_FIELD_LABEL } from '@/lib/gp-answer-check'

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

    const body = await req.json()
    const { gp_id, ...formData } = body

    if (!gp_id) return NextResponse.json({ error: 'GP inválido.' }, { status: 400 })

    // Validate GP and deadline
    const { data: gp } = await supabaseAdmin
      .from('gp_calendar').select('*').eq('id', gp_id).single()

    if (!gp) return NextResponse.json({ error: 'GP não encontrado.' }, { status: 404 })
    if (isDeadlinePassed(gp.deadline_play))
      return NextResponse.json({ error: 'Prazo encerrado.' }, { status: 400 })
    if (isBeforeFP1(gp.fp1_start))
      return NextResponse.json({ error: 'Submissões ainda não abertas.' }, { status: 400 })

    // Answers must belong to the current questions (a form opened before the admin changed them is stale)
    const gpConfig = await getEffectiveGpConfig(null, gp_id, gp.round)
    if (gpConfig) {
      const stale = invalidAnswers(gpConfig, formData)
      if (stale.length > 0)
        return NextResponse.json({
          error: 'As perguntas foram actualizadas. Recarrega a página e responde de novo a: ' + stale.map(f => CONFIG_FIELD_LABEL[f]).join(', '),
        }, { status: 400 })
    }

    // Check if editing
    const { data: existing } = await supabaseAdmin
      .from('predictions')
      .select('id')
      .eq('member_email', user.email)
      .eq('gp_id', gp_id)
      .single()

    const isEdit = !!existing

    // Upsert prediction
    const { error: upsertErr } = await supabaseAdmin
      .from('predictions')
      .upsert(
        { member_email: user.email, gp_id, ...formData, editado_em: new Date().toISOString() },
        { onConflict: 'member_email,gp_id' }
      )

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 })

    // Send confirmation email (non-blocking)
    try {
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('nome_completo, nickname')
        .eq('email', user.email)
        .single()

      const config = await getEffectiveGpConfig(null, gp_id, gp.round)
      const gpName = config ? `${config.gpPrep} ${config.gpName}` : gp.nome

      await sendPredictionConfirmation({
        toEmail: user.email,
        toName: member?.nome_completo || member?.nickname || 'Piloto',
        gpNome: gpName,
        gpEmoji: gp.emoji_bandeira || '🏎️',
        prediction: formData,
        isEdit,
      })
    } catch (emailErr) {
      console.error('Email confirmation failed:', emailErr)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, isEdit })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
