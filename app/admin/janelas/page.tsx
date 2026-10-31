export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Launcher from './Launcher'

export default async function JanelasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')
  const { data: me } = await createServiceClient().from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'app.beiraf1fanatics.com'
  const origin = `${h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}`

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/telemetria" className="text-gray-500 hover:text-white text-sm">← Mesa de controlo</Link>
        <h1 className="text-2xl font-bold mt-2">🪟 Janelas de telemetria</h1>
        <p className="text-gray-400 text-sm">Para o teu uso pessoal: cada painel numa janela própria, sem menus, para espalhares pelos ecrãs ao lado do MultiViewer. Mostram sempre todos os dados, mesmo os painéis que os membros não vêem.</p>
      </div>
      <Launcher origin={origin} />
    </div>
  )
}
