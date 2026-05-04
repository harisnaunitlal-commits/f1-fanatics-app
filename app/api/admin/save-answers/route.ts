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

    const { payload, admin_email, existing } = await req.json()

    const { error: upsertErr } = await supabaseAdmin.from('gp_answers').upsert(payload)
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 400 })

    await supabaseAdmin.from('audit_log').insert({
      admin_email,
      accao: existing ? 'update_answers' : 'insert_answers',
      tabela: 'gp_answers',
      detalhe: { gp_id: payload.gp_id },
    }).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
