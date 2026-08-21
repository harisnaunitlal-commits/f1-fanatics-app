import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: me } = await (supabase as any)
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })

  const { email, fantasy_nick, predict_nick } = await req.json()
  if (!email) return NextResponse.json({ error: 'email obrigatório' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const updates: Record<string, string | null> = {}
  if (fantasy_nick !== undefined) updates.fantasy_nick = fantasy_nick || null
  if (predict_nick !== undefined) updates.predict_nick = predict_nick || null

  const { error } = await (service as any)
    .from('members')
    .update(updates)
    .eq('email', email)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
