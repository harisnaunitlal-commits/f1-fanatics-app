export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { isDeadlinePassed, isBeforeFP1, getTimeUntilFP1 } from '@/lib/scoring'
import PredictForm from './PredictForm'
import { getEffectiveGpConfig } from '@/lib/gp-config'

export default async function PredictGpPage({ params }: { params: { gpId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const gpId = parseInt(params.gpId)
  if (isNaN(gpId)) notFound()

  const { data: gp } = await (supabase as any)
    .from('gp_calendar').select('*').eq('id', gpId).single()
  if (!gp) notFound()

  if (isDeadlinePassed(gp.deadline_play)) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-5xl mb-4">🏁</div>
        <h1 className="text-2xl font-bold mb-2">Prazo encerrado</h1>
        <p className="text-gray-400">
          O prazo para o {gp.emoji_bandeira} GP {gp.nome} já terminou.
        </p>
        <a href="/predict" className="btn-primary inline-block mt-6">Ver outros GPs</a>
      </div>
    )
  }

  if (isBeforeFP1(gp.fp1_start)) {
    const timeToOpen = gp.fp1_start ? getTimeUntilFP1(gp.fp1_start) : null
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Submissões ainda não abertas</h1>
        <p className="text-gray-400 mb-2">
          As previsões para o {gp.emoji_bandeira} GP {gp.nome} abrem no início do FP1.
        </p>
        {timeToOpen && (
          <p className="text-blue-400 font-bold text-lg">Abre em {timeToOpen}</p>
        )}
        <a href="/predict" className="btn-primary inline-block mt-6">Ver outros GPs</a>
      </div>
    )
  }

  const [{ data: existing }, config] = await Promise.all([
    (supabase as any).from('predictions').select('*').eq('member_email', user.email).eq('gp_id', gpId).single(),
    getEffectiveGpConfig(supabase, gpId, gp.round),
  ])

  return <PredictForm gp={gp} userEmail={user.email} existing={existing} config={config} />
}
