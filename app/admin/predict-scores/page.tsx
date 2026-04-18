import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PredictImport from './PredictImport'

export default async function AdminPredictPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')
  const { data: member } = await supabase.from('members').select('is_admin').eq('email', user.email).single()
  if (!member?.is_admin) redirect('/')

  const { data: gps } = await supabase
    .from('gp_calendar').select('*').in('status', ['closed','scored']).order('round')

  const { data: members } = await supabase
    .from('members').select('email, nickname, predict_nick').eq('activo', true).order('nickname')

  return <PredictImport gps={gps ?? []} members={members ?? []} adminEmail={user.email} />
}
