import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import AnswersForm from './AnswersForm'

export default async function AdminAnswersPage({ params }: { params: { gpId: string } }) {
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

  const gpId = parseInt(params.gpId)
  if (isNaN(gpId)) notFound()

  const { data: gp } = await (supabase as any)
    .from('gp_calendar')
    .select('*')
    .eq('id', gpId)
    .single()

  if (!gp) notFound()

  const { data: existing } = await (supabase as any)
    .from('gp_answers')
    .select('*')
    .eq('gp_id', gpId)
    .single()

  return <AnswersForm gp={gp} existing={existing} adminEmail={user.email} />
}