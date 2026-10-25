import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildChampionshipResponse, type ChampResponse } from '@/lib/telemetry/champ'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Members only. Responses are shared between viewers for a few seconds so many people refreshing during
// the race cost one upstream computation, not one each.
let cache: { at: number; body: ChampResponse } | null = null

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ ready: false, message: 'Não autenticado.' } satisfies ChampResponse, { status: 401 })
  if (cache && Date.now() - cache.at < 8_000) return NextResponse.json(cache.body)
  try {
    const body = await buildChampionshipResponse()
    cache = { at: Date.now(), body }
    return NextResponse.json(body)
  } catch (e) {
    if (cache) return NextResponse.json(cache.body)
    return NextResponse.json({ ready: false, message: 'Dados indisponíveis neste momento. Tenta daqui a pouco.' } satisfies ChampResponse, { status: 502 })
  }
}
