import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import CalculateScores from './CalculateScores'

export default async function AdminScoresPage({ params }: { params: { gpId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: member } = await supabase
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!member?.is_admin) redirect('/')

  const gpId = parseInt(params.gpId)
  if (isNaN(gpId)) notFound()

  const { data: gp } = await supabase
    .from('gp_calendar').select('*').eq('id', gpId).single()
  if (!gp) notFound()

  const { data: answers } = await supabase
    .from('gp_answers').select('*').eq('gp_id', gpId).single()

  const { data: predictions } = await supabase
    .from('predictions').select('*').eq('gp_id', gpId)

  const { data: existingScores } = await supabase
    .from('scores_play').select('*').eq('gp_id', gpId)

  return (
    <CalculateScores
      gp={gp}
      answers={answers}
      predictions={predictions ?? []}
      existingScores={existingScores ?? []}
      adminEmail={user.email}
    />
  )
}
