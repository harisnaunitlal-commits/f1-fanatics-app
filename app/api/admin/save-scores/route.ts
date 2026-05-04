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
    // Verify the requester is an admin
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const { data: member } = await supabaseAdmin
      .from('members')
      .select('is_admin')
      .eq('email', user.email)
      .single()

    if (!member?.is_admin) {
      return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
    }

    const { scores, gp_id, admin_email } = await req.json()

    if (!scores || !gp_id) {
      return NextResponse.json({ error: 'Dados em falta.' }, { status: 400 })
    }

    // Save scores using service role — bypasses RLS
    const { error: scoresErr } = await supabaseAdmin
      .from('scores_play')
      .upsert(scores)

    if (scoresErr) {
      return NextResponse.json({ error: scoresErr.message }, { status: 400 })
    }

    // Update GP status to scored
    await supabaseAdmin
      .from('gp_calendar')
      .update({ status: 'scored' })
      .eq('id', gp_id)

    // Audit log
    await supabaseAdmin.from('audit_log').insert({
      admin_email,
      accao: 'calculate_scores',
      tabela: 'scores_play',
      detalhe: { gp_id, n_predictions: scores.length },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
