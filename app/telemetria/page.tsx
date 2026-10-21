export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TelemetryView from '@/components/telemetry/TelemetryView'

export default async function TelemetriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-3xl font-bold">📡 Telemetria</h1>
        <p className="text-gray-500 text-sm">Só para ver — a transmissão é montada pelo admin</p>
      </div>
      <TelemetryView />
    </div>
  )
}
