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

  const { gp_id, image_url } = await req.json()
  if (!gp_id) return NextResponse.json({ error: 'gp_id obrigatório' }, { status: 400 })

  const service = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await (service as any)
    .from('gp_calendar')
    .update({ starting_grid_image: image_url ?? null })
    .eq('id', gp_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
