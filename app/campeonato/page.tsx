export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChampionshipLive from '@/components/ChampionshipLive'

export default async function CampeonatoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')
  return <ChampionshipLive />
}
