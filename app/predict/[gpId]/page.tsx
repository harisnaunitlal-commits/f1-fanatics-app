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
    const [{ data: existing }, config] = await Promise.all([
      (supabase as any).from('predictions').select('*').eq('member_email', user.email).eq('gp_id', gpId).single(),
      getEffectiveGpConfig(supabase, gpId, gp.round),
    ])
    if (!existing) {
      return (
        <div className="max-w-lg mx-auto mt-16 text-center">
          <div className="text-5xl mb-4">🏁</div>
          <h1 className="text-2xl font-bold mb-2">Prazo encerrado</h1>
          <p className="text-gray-400">
            O prazo para o {gp.emoji_bandeira} GP {gp.nome} já terminou e não submeteste nenhuma previsão.
          </p>
          <a href="/predict" className="btn-primary inline-block mt-6">Ver outros GPs</a>
        </div>
      )
    }
    return <PredictForm gp={gp} userEmail={user.email} existing={existing} config={config} readOnly={true} />
  }

  if (isBeforeFP1((gp as any).qualifying_start)) {
    const qualStart: string | null = (gp as any).qualifying_start ?? null
    const timeToOpen = qualStart ? getTimeUntilFP1(qualStart) : null
    const qualDate = qualStart
      ? new Date(qualStart).toLocaleDateString('pt', { weekday: 'long', day: 'numeric', month: 'long' })
      : null
    const qualTime = qualStart
      ? new Date(qualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : null
    const qualEndTime = qualStart
      ? new Date(new Date(qualStart).getTime() + 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      : null
    return (
      <div className="max-w-lg mx-auto mt-12 px-4">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold">Submissões ainda não abertas</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {gp.emoji_bandeira} GP {gp.nome}
          </p>
        </div>

        {/* Qualifying card */}
        <div className="rounded-2xl border-2 border-yellow-400/60 overflow-hidden mb-4"
          style={{ background: 'rgba(250,204,21,0.06)', boxShadow: '0 0 24px rgba(250,204,21,0.15)' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-yellow-400/20"
            style={{ background: 'rgba(250,204,21,0.10)' }}>
            <span className="text-sm">⚡</span>
            <span className="text-xs font-black text-yellow-400 uppercase tracking-widest">Qualifying</span>
          </div>
          <div className="px-4 py-4 text-center">
            {qualDate && (
              <p className="text-yellow-300 font-bold text-base capitalize">{qualDate}</p>
            )}
            {qualTime && qualEndTime && (
              <p className="text-white font-black text-3xl mt-1 tabular-nums">
                {qualTime} <span className="text-gray-500 text-xl">–</span> {qualEndTime}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-2">hora local · submissões abrem após o fim</p>
          </div>
        </div>

        {/* Countdown */}
        {timeToOpen && (
          <div className="rounded-xl border border-blue-500/30 px-4 py-3 text-center mb-4"
            style={{ background: 'rgba(59,130,246,0.08)' }}>
            <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">Abre em</p>
            <p className="text-blue-300 font-black text-2xl tabular-nums">{timeToOpen}</p>
          </div>
        )}

        <a href="/predict" className="btn-primary w-full text-center block">Ver outros GPs</a>
      </div>
    )
  }

  const [{ data: existing }, config] = await Promise.all([
    (supabase as any).from('predictions').select('*').eq('member_email', user.email).eq('gp_id', gpId).single(),
    getEffectiveGpConfig(supabase, gpId, gp.round),
  ])

  return <PredictForm gp={gp} userEmail={user.email} existing={existing} config={config} />
}
