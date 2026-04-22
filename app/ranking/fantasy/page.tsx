export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function FantasyRankingPage() {
  const supabase = await createClient()

  const { data: scores } = await (supabase as any)
    .from('scores_fantasy')
    .select('member_email, equipa_nome, pontos_acum, members(nickname, foto_url)')
    .order('pontos_acum', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🏅 Ranking F1 Fantasy</h1>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-700">
              <th className="text-left py-3 pr-4">#</th>
              <th className="text-left py-3 pr-4">Jogador</th>
              <th className="text-left py-3 pr-4">Equipa</th>
              <th className="text-right py-3">Pontos</th>
            </tr>
          </thead>

          <tbody>
            {(scores ?? []).map((s: any, i: number) => {
              const member = s.members as { nickname: string; foto_url: string | null } | null
              const name = member?.nickname ?? s.member_email.split('@')[0]
              const playerHref = `/players/${encodeURIComponent(name)}`

              return (
                <tr key={s.member_email} className="border-b border-gray-800/50">
                  <td className="py-2 pr-4 font-bold">{i + 1}</td>

                  <td className="py-2 pr-4">
                    <Link href={playerHref} className="flex items-center gap-2 hover:underline">
                      {member?.foto_url ? (
                        <img
                          src={member.foto_url}
                          className="w-6 h-6 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-f1red/20 text-f1red text-xs flex items-center justify-center font-bold">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span>{name}</span>
                    </Link>
                  </td>

                  <td className="py-2 pr-4 text-gray-400 text-xs">
                    {s.equipa_nome ?? '—'}
                  </td>

                  <td className="py-2 text-right font-bold text-white">
                    {s.pontos_acum}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}