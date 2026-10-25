import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getEffectiveGpConfig } from '@/lib/gp-config'
import { isDeadlinePassed } from '@/lib/scoring'
import { changedFields } from '@/lib/gp-answer-check'
import type { GpQuestions } from '@/lib/gp-questions'

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

    const { gp_id, config } = await req.json()
    if (!gp_id || !config) return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })

    const { data: gp } = await supabaseAdmin
      .from('gp_calendar').select('round, deadline_play').eq('id', gp_id).single()

    // What the members were answering until now (saved config, or the built-in one)
    const before = gp ? await getEffectiveGpConfig(null, gp_id, gp.round) : undefined

    const { error } = await supabaseAdmin
      .from('gp_questions_config')
      .upsert({ gp_id, config, updated_at: new Date().toISOString(), updated_by: user.email },
        { onConflict: 'gp_id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Answers to questions whose options changed would silently survive (the old pick no longer
    // means the same thing) — clear them so members have to answer the new question.
    const cleared: Record<string, number> = {}
    const open = gp ? !isDeadlinePassed(gp.deadline_play) : false
    if (open) {
      for (const f of changedFields(before, config as GpQuestions)) {
        const { data: rows } = await supabaseAdmin
          .from('predictions').update({ [f]: null }).eq('gp_id', gp_id).not(f, 'is', null).select('member_email')
        if (rows?.length) cleared[f] = rows.length
      }
    }

    return NextResponse.json({ success: true, cleared })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
