export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BirthdayPanel from './BirthdayPanel'

export default async function BirthdayAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: me } = await (supabase as any)
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  // Members with data_nasc filled
  const { data: allMembers } = await (supabase as any)
    .from('members')
    .select('email, nome_completo, nickname, data_nasc, foto_url, criado_em')
    .not('data_nasc', 'is', null)
    .order('nickname')

  const members = allMembers ?? []

  // Compute today's birthdays (UTC+2 for Mozambique)
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const todayMonth = now.getUTCMonth() + 1
  const todayDay   = now.getUTCDate()

  const todayBirthdays = members.filter((m: any) => {
    const d = new Date(m.data_nasc)
    return (d.getUTCMonth() + 1) === todayMonth && d.getUTCDate() === todayDay
  })

  // Upcoming 30 days
  const upcoming = members
    .map((m: any) => {
      const d = new Date(m.data_nasc)
      const thisYear = new Date(now.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
      let diff = Math.ceil((thisYear.getTime() - now.getTime()) / 86400000)
      if (diff < 0) {
        const nextYear = new Date(now.getUTCFullYear() + 1, d.getUTCMonth(), d.getUTCDate())
        diff = Math.ceil((nextYear.getTime() - now.getTime()) / 86400000)
      }
      return { ...m, daysUntil: diff }
    })
    .filter((m: any) => m.daysUntil > 0 && m.daysUntil <= 30)
    .sort((a: any, b: any) => a.daysUntil - b.daysUntil)

  const noDataCount = (await (supabase as any)
    .from('members')
    .select('email', { count: 'exact', head: true })
    .is('data_nasc', null)).count ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">🎂 Aniversários</h1>
        <p className="text-gray-400 text-sm mt-1">
          Envia mensagens de parabéns personalizadas com branding Beira F1 Fanatics.
        </p>
      </div>

      <BirthdayPanel
        todayBirthdays={todayBirthdays}
        upcoming={upcoming}
        noDataCount={noDataCount}
      />
    </div>
  )
}
