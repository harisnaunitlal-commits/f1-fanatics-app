export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getEffectiveGpConfig } from '@/lib/gp-config'
import GpQuestionsEditor from './GpQuestionsEditor'
import { getGpQuestions } from '@/lib/gp-questions'

// Default config for a new GP with no hardcoded entry
const DEFAULT_CONFIG = getGpQuestions(8) // use Canada as safe default shape

export default async function GpQuestionsPage({ params }: { params: { gpId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: member } = await (supabase as any)
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!member?.is_admin) redirect('/')

  const gpId = parseInt(params.gpId)
  if (isNaN(gpId)) notFound()

  const { data: gp } = await (supabase as any)
    .from('gp_calendar').select('*').eq('id', gpId).single()
  if (!gp) notFound()

  const config = await getEffectiveGpConfig(supabase, gpId, gp.round)

  if (!config) notFound()

  return (
    <GpQuestionsEditor
      gpId={gpId}
      gpNome={gp.nome}
      gpEmoji={gp.emoji_bandeira}
      initialConfig={config}
    />
  )
}
