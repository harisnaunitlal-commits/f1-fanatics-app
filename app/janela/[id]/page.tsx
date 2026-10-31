export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { windowById } from '@/lib/telemetry/windows'
import WindowView from '@/components/telemetry/windows/WindowView'

// One chromeless telemetry window for the admin (no menu, no footer). Options in the URL:
//   ?d=VER,LEC  drivers (compare / driver card / lap times)   ?z=1.25  zoom   ?h=0  hide the slim title strip   ?bg=black
export default async function JanelaPage({ params, searchParams }: { params: { id: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const def = windowById(params.id)
  if (!def) notFound()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')
  const { data: me } = await createServiceClient().from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  const one = (k: string) => { const v = searchParams[k]; return Array.isArray(v) ? v[0] : v }
  const drivers = (one('d') ?? '').split(',').map(x => x.trim().toUpperCase()).filter(x => /^[A-Z]{3}$/.test(x)).slice(0, 4)
  const zoom = Math.min(3, Math.max(0.5, Number(one('z')) || 1))
  return <WindowView id={def.id} drivers={drivers} zoom={zoom} header={one('h') !== '0'} bg={one('bg') === 'black' ? 'black' : 'dark'} />
}
