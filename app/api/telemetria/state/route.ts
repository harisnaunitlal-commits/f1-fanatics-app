import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildStateResponse } from '@/lib/telemetry/respond'
import type { Scene, StateResponse } from '@/lib/telemetry/shared'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ ready: false, message: 'Não autenticado.' } satisfies StateResponse, { status: 401 })

  const db = createServiceClient()
  const [{ data: me }, { data: scene }] = await Promise.all([
    db.from('members').select('is_admin, piloto_fav').eq('email', user.email).single(),
    db.from('telemetry_scene').select('*').eq('id', 1).single(),
  ])
  const { status, body } = await buildStateResponse({ email: user.email, isAdmin: !!me?.is_admin, pilotoFav: me?.piloto_fav ?? null }, scene as Scene | null)
  return NextResponse.json(body, { status })
}
