import { createClient } from '@/lib/supabase/server'
import { RankingTabs } from '@/components/RankingTabs'
import { GpSelector } from '@/components/GpSelector'
import { ClickableRow } from '@/components/ClickableRow'

export default async function FantasyRankingPage({
  searchParams,
}: {
  searchParams: { gp?: string }
}) {
  const supabase = await createClient()

  const { data: scoredGps } = await (supabase as any)
    .from('gp_calendar')
    .select('id, round, nome, emoji_bandeira')
    .eq('status', 'scored')
    .order('round', { ascending: false })

  const scoredGpsAsc = [...(scoredGps ?? [])].reverse()

  const selectedGpId = searchParams.gp
    ? parseInt(searchParams.gp)
    : scoredGps?.[0]?.id ?? null

  // Cumulative at selected GP — pontos_acum is already running total
  const { data: scores } = selectedGpId
    ? await (supabase as any)
        .from('scores_fantasy')
        .select('member_email, equipa_nome, pontos_acum, members(nickname, foto_url)')
        .eq('gp_id', selectedGpId)
        .order('pontos_acum', { ascending: false })
    : { data: null }

  // Per-GP deltas for all GPs up to selected (for the history columns)
  const visibleGps = scoredGpsAsc.filter(g => g.id <= (selectedGpId ?? 0))

  const { data: allScores } = visibleGps.length
    ? await (supabase as any)
        .from('scores_fantasy')
        .select('member_email, gp_id, pontos_gp')
        .in('gp_id', visibleGps.map(g => g.id))
    : { data: null }

  const memberGps = new Map<string, Map<number, number>>()
  for (const s of allScores ?? []) {
    if (!memberGps.has(s.member_email)) memberGps.set(s.member_email, new Map())
    memberGps.get(s.member_email)!.set(s.gp_id, s.pontos_gp ?? 0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Ranking F1 Fantasy</h1>
        <RankingTabs active="fantasy" gpId={selectedGpId} />
      </div>

      {scoredGpsAsc.length > 0 && (
        <GpSelector gps={scoredGpsAsc} selectedId={selectedGpId} basePath="/ranking/fantasy" />
      )}

      <p className="text-gray-500 text-sm mb-6">
        Liga: <span className="font-mono text-gray-400">C57XPPKP703</span> · ID: 4699603 ·
        Pontos acumulados do site oficial
      </p>

      {!scores || scores.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">Nenhum dado importado ainda.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase tracking-wider bg-f1gray/30">
                <th className="text-center py-3 px-3 w-12">#</th>
                <th className="text-left py-3 px-3">Equipa</th>
                {visibleGps.map(g => (
                  <th key={g.id} className="text-center py-3 px-2 hidden sm:table-cell">{g.emoji_bandeira}</th>
                ))}
                <th className="text-right py-3 px-4 text-white">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => {
                const member = s.members as { nickname: string; foto_url: string | null } | null
                const name = member?.nickname ?? s.member_email.split('@')[0]
                const playerHref = `/players/${encodeURIComponent(name)}`
                const gps = memberGps.get(s.member_email) ?? new Map()

                const st =
                  i === 0 ? { ring: 'bg-yellow-400/10 text-yellow-400', name: 'text-yellow-300', score: 'text-yellow-400', av: 'bg-yellow-400/15 text-yellow-400', row: 'bg-yellow-400/[0.04] border-l-2 border-l-yellow-400' } :
                  i === 1 ? { ring: 'bg-gray-400/10 text-gray-300',   name: 'text-gray-100',   score: 'text-gray-300',   av: 'bg-gray-400/15 text-gray-300',   row: 'bg-gray-400/[0.04]  border-l-2 border-l-gray-400'  } :
                  i === 2 ? { ring: 'bg-amber-600/10 text-amber-500', name: 'text-amber-300',  score: 'text-amber-500',  av: 'bg-amber-600/15 text-amber-500', row: 'bg-amber-600/[0.04] border-l-2 border-l-amber-600' } :
                  { ring: 'text-gray-500', name: 'text-white', score: 'text-white', av: 'bg-f1gray text-gray-400', row: 'border-l-2 border-l-transparent' }

                return (
                  <ClickableRow
                    key={s.member_email}
                    href={playerHref}
                    className={`border-b border-gray-800/50 transition-colors hover:bg-white/[0.03] ${st.row}`}
                  >
                    <td className="py-4 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${st.ring}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2.5">
                        {member?.foto_url ? (
                          <img src={member.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-700" />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${st.av}`}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className={`font-semibold ${st.name}`}>{name}</div>
                          <div className="text-xs text-gray-500">{s.equipa_nome}</div>
                        </div>
                      </div>
                    </td>
                    {visibleGps.map(g => {
                      const pts = gps.get(g.id)
                      return (
                        <td key={g.id} className="text-center py-4 px-2 hidden sm:table-cell">
                          {pts !== undefined ? (
                            <span className={`text-xs font-medium tabular-nums ${
                              pts > 0 ? 'text-green-400' : pts < 0 ? 'text-red-400' : 'text-gray-600'
                            }`}>
                              {pts > 0 ? '+' : ''}{pts}
                            </span>
                          ) : (
                            <span className="text-gray-700">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="py-4 px-4 text-right">
                      <span className={`text-2xl font-bold tabular-nums ${st.score}`}>{s.pontos_acum}</span>
                    </td>
                  </ClickableRow>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
