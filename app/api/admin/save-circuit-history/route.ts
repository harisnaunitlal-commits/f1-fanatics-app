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

    const { data: member } = await supabaseAdmin.from('members').select('is_admin').eq('email', user.email).single()
    if (!member?.is_admin) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const { gp_id, historia } = await req.json()
    if (!gp_id) return NextResponse.json({ error: 'gp_id obrigatório.' }, { status: 400 })

    const { error: updErr } = await supabaseAdmin
      .from('gp_calendar')
      .update({ historia_circuito: historia || null })
      .eq('id', gp_id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
