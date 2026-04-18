import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')
  const { data: me } = await supabase.from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  const { data: members } = await supabase
    .from('members')
    .select('*')
    .order('nickname')

  const { data: playSums } = await supabase
    .from('scores_play')
    .select('member_email, total')

  const totalByEmail = new Map<string, number>()
  for (const s of playSums ?? []) {
    totalByEmail.set(s.member_email, (totalByEmail.get(s.member_email) ?? 0) + (s.total ?? 0))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
          <h1 className="text-2xl font-bold mt-2">Membros ({members?.length ?? 0})</h1>
        </div>
        <Link href="/register" className="btn-secondary text-sm">+ Adicionar membro</Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase">
              <th className="text-left py-3 pr-4">Nickname</th>
              <th className="text-left py-3 pr-4">Email</th>
              <th className="text-left py-3 pr-4">Fantasy nick</th>
              <th className="text-left py-3 pr-4">Predict nick</th>
              <th className="text-right py-3 pr-4">Play pts</th>
              <th className="text-center py-3">Admin</th>
              <th className="text-center py-3">Activo</th>
            </tr>
          </thead>
          <tbody>
            {members?.map(m => (
              <tr key={m.email} className="border-b border-gray-800/50">
                <td className="py-2 pr-4 font-medium">{m.nickname}</td>
                <td className="py-2 pr-4 text-gray-400 text-xs">{m.email}</td>
                <td className="py-2 pr-4 text-gray-400 text-xs">{m.fantasy_nick ?? '—'}</td>
                <td className="py-2 pr-4 text-gray-400 text-xs">{m.predict_nick ?? '—'}</td>
                <td className="py-2 pr-4 text-right font-bold">{totalByEmail.get(m.email) ?? 0}</td>
                <td className="py-2 text-center">{m.is_admin ? '✅' : '—'}</td>
                <td className="py-2 text-center">{m.activo ? '✅' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
