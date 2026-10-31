import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { radioFeed, radioConfigured, type RadioResponse } from '@/lib/telemetry/radio'
import type { Scene } from '@/lib/telemetry/shared'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// The "Rádios (texto)" panel polls this. Off by default: only works when the admin switched the panel on.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ enabled: false, configured: false, items: [], pending: 0 } satisfies RadioResponse, { status: 401 })

  const db = createServiceClient()
  const [{ data: me }, { data: scene }] = await Promise.all([
    db.from('members').select('is_admin').eq('email', user.email).single(),
    db.from('telemetry_scene').select('*').eq('id', 1).single(),
  ])
  const sc = scene as Scene | null
  const isAdmin = !!me?.is_admin
  const off: RadioResponse = { enabled: false, configured: radioConfigured(), items: [], pending: 0 }
  if (!sc?.session_key || (sc.panels as Record<string, boolean> | null)?.radio !== true || (!sc.members_enabled && !isAdmin)) return NextResponse.json(off)
  try {
    return NextResponse.json(await radioFeed(sc.session_key, sc.mode === 'live'))
  } catch (e) {
    return NextResponse.json({ ...off, enabled: true, note: String(e instanceof Error ? e.message : e).slice(0, 160) })
  }
}
