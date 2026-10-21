import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { checkCredentials } from '@/lib/telemetry/openf1'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  const { data: me } = await createServiceClient().from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  return NextResponse.json(await checkCredentials())
}
