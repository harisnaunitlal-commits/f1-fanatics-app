export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: me } = await (supabase as any)
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  const { data: members } = await (supabase as any)
    .from('members').select('*').order('nickname')

  const { data: playSums } = await (supabase as any)
    .from('scores_play').select('member_email, total')

  const { data: predictions } = await (supabase as any)
    .from('predictions').select('member_email')

  const totalByEmail = new Map<string, number>()
  for (const s of playSums ?? []) {
    totalByEmail.set(s.member_email, (totalByEmail.get(s.member_email) ?? 0) + (s.total ?? 0))
  }

  const predsByEmail = new Map<string, number>()
  for (const p of predictions ?? []) {
    predsByEmail.set(p.member_email, (predsByEmail.get(p.member_email) ?? 0) + 1)
  }

  const totalMembers = members?.length ?? 0
  const activeMembers = members?.filter((m: any) => m.activo).length ?? 0

  // Last 7 days active (using ultimo_acesso)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const recentlyActive = members?.filter((m: any) => m.ultimo_acesso && m.ultimo_acesso > sevenDaysAgo).length ?? 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
          <h1 className="text-2xl font-bold mt-1">👥 Membros</h1>
        </div>
        <Link href="/register" className="btn-secondary text-sm">+ Adicionar membro</Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-blue-400">{totalMembers}</div>
          <div className="text-xs text-gray-500 mt-1">Total membros</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-green-400">{activeMembers}</div>
          <div className="text-xs text-gray-500 mt-1">Activos</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-yellow-400">{recentlyActive}</div>
          <div className="text-xs text-gray-500 mt-1">Últimos 7 dias</div>
        </div>
      </div>

      {/* Members table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase bg-gray-900/50">
                <th className="text-left py-3 px-4">Membro</th>
                <th className="text-left py-3 px-4 hidden sm:table-cell">Email</th>
                <th className="text-right py-3 px-4">Play pts</th>
                <th className="text-right py-3 px-4 hidden md:table-cell">Previsões</th>
                <th className="text-center py-3 px-4 hidden md:table-cell">Último acesso</th>
                <th className="text-center py-3 px-4">Estado</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {members?.map((m: any) => {
                const lastAccess = m.ultimo_acesso ? new Date(m.ultimo_acesso) : null
                const isOnline = lastAccess && (Date.now() - lastAccess.getTime()) < 7 * 24 * 60 * 60 * 1000
                const pts = totalByEmail.get(m.email) ?? 0
                const preds = predsByEmail.get(m.email) ?? 0

                return (
                  <tr key={m.email} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {m.foto_url
                          ? <img src={m.foto_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                          : <div className="w-8 h-8 rounded-full bg-f1red/20 text-f1red flex items-center justify-center text-xs font-bold shrink-0">
                              {m.nickname.charAt(0).toUpperCase()}
                            </div>
                        }
                        <div>
                          <div className="font-medium text-white">{m.nickname}</div>
                          {m.nome_completo && <div className="text-xs text-gray-500">{m.nome_completo}</div>}
                        </div>
                        {m.is_admin && <span className="text-[10px] bg-f1red/20 text-f1red px-1.5 py-0.5 rounded font-bold">Admin</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs hidden sm:table-cell">{m.email}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">{pts}</td>
                    <td className="py-3 px-4 text-right text-gray-400 hidden md:table-cell">{preds}</td>
                    <td className="py-3 px-4 text-center hidden md:table-cell">
                      {lastAccess
                        ? <span className={`text-xs ${isOnline ? 'text-green-400' : 'text-gray-600'}`}>
                            {lastAccess.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' })}
                          </span>
                        : <span className="text-gray-700 text-xs">—</span>
                      }
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        m.activo ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'
                      }`}>
                        {m.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/admin/members/${encodeURIComponent(m.email)}`}
                        className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition-colors whitespace-nowrap"
                      >
                        Ver perfil →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
