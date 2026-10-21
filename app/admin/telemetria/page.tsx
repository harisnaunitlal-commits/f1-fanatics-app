export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { hasLiveCredentials, listSessions } from '@/lib/telemetry/openf1'
import type { Scene } from '@/lib/telemetry/shared'
import ControlRoom, { type SessionOpt, type GpOpt } from './ControlRoom'

export default async function TelemetriaAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')
  const db = createServiceClient()
  const { data: me } = await db.from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  const [{ data: scene }, { data: gps }] = await Promise.all([
    db.from('telemetry_scene').select('*').eq('id', 1).single(),
    db.from('gp_calendar').select('id, round, nome, data_corrida').eq('temporada', 2026).order('round'),
  ])

  let sessions: SessionOpt[] = []
  let sessionsError: string | null = null
  try {
    const all = await listSessions(2026)
    const horizon = Date.now() + 8 * 86_400_000
    const fmt = (iso: string) => new Date(iso).toLocaleString('pt', { timeZone: 'Africa/Maputo', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    sessions = all.filter(s => Date.parse(s.date_start) <= horizon).reverse().map(s => {
      const gp = (gps ?? []).find(g => Math.abs(Date.parse(g.data_corrida) - Date.parse(s.date_start)) < 3.6 * 86_400_000)
      return { key: s.session_key, label: `${s.country_name} · ${s.session_name} · ${fmt(s.date_start)} (hora MZ)`, start: s.date_start, end: s.date_end, gpGuess: gp?.id ?? null }
    })
  } catch (e) { sessionsError = e instanceof Error ? e.message : 'erro' }

  const gpOpts: GpOpt[] = (gps ?? []).map(g => ({ id: g.id, label: `R${String(g.round).padStart(2, '0')} · ${g.nome}` }))

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</Link>
        <h1 className="text-2xl font-bold mt-2">📡 Mesa de controlo da Telemetria</h1>
        <p className="text-gray-400 text-sm">Tu montas o ecrã; os membros só vêem. Abre <Link href="/telemetria" className="text-f1red underline">/telemetria</Link> noutro separador para ver o resultado.</p>
      </div>
      {sessionsError && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3 mb-4">⚠️ Não consegui ler as sessões do OpenF1: {sessionsError}</p>}
      <ControlRoom initialScene={scene as Scene} sessions={sessions} gps={gpOpts} liveReady={hasLiveCredentials()} />
    </div>
  )
}
