import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FantasyImport from './FantasyImport'

export default async function AdminFantasyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect('/auth/login')

  const { data: member } = await (supabase as any)
    .from('members')
    .select('is_admin')
    .eq('email', user.email)
    .single()

  if (!member?.is_admin) redirect('/')

  const { data: gps } = await (supabase as any)
    .from('gp_calendar')
    .select('*')
    .in('status', ['closed', 'scored', 'upcoming', 'active'])
    .order('round')

  const { data: members } = await (supabase as any)
    .from('members')
    .select('email, nickname, fantasy_nick')
    .eq('activo', true)
    .order('nickname')

  return <FantasyImport gps={gps ?? []} members={members ?? []} adminEmail={user.email} />
}