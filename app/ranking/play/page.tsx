export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { RankingTabs } from '@/components/RankingTabs'
import { GpSelector } from '@/components/GpSelector'
import { ClickableRow } from '@/components/ClickableRow'

type PlayScoreRow = {
  member_email: string
  gp_id: number
  total: number
  members: { nickname: string; foto_url: string | null } | null
}

type AggregatedRow = {
  member_email: string
  nickname: string
  foto_url: string | null
  cumulative_total: number
  gp_total: number
  gps_played: number
}

export default async function PlayRankingPage({
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

  // null = "Acumulado" (sum all GPs); specific ID = individual GP only
  const selectedGpId: number | null = searchParams.gp
    ? parseInt(searchParams.gp)
    : null

  const isAccumulado = selectedGpId === null

  const scoredGpIds = (scoredGps ?? []).map((g: any) => g.id)

  const { data: allScores } = scoredGpIds.length
    ? await (supabase as any)
        .from('scores_play')
        .select('member_email, gp_id, total, members(nickname, foto_url)')
        .in('gp_id', scoredGpIds)
        .order('gp_id', { ascending: true })
    : { data: null }

  const rowsMap = new Map<string, AggregatedRow>()

  ;((allScores ?? []) as PlayScoreRow[]).forEach((s: any) => {
    // Acumulado: include all GPs. Per-GP: only include up to that GP
    if (!isAccumulado && s.gp_id > selectedGpId!) return

    const member = s.members as { nickname: string; foto_url: string | null } | null
    const nickname = member?.nickname ?? s.member_email.split('@')[0]
    const foto_url = member?.foto_url ?? null

    if (!rowsMap.has(s.member_email)) {
      rowsMap.set(s.member_email, {
        member_email: s.member_email,
        nickname,
        foto_url,
        cumulative_total: 0,
        gp_total: 0,
        gps_played: 0,
      })
    }

    const row = rowsMap.get(s.member_email)!
    row.cumulative_total += s.total ?? 0
    if ((s.total ?? 0) > 0) row.gps_played += 1
    if (s.gp_id === selectedGpId) row.gp_total = s.total ?? 0
  })

  const rows = Array.from(rowsMap.values()).sort((a, b) => {
    const primary = isAccumulado
      ? b.cumulative_total - a.cumulative_total
      : b.gp_total - a.gp_total
    return primary || a.nickname.localeCompare(b.nickname)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Ranking F1 Play</h1>
        <RankingTabs active="play" gpId={selectedGpId} />
      </div>

      {scoredGpsAsc.length > 0 && (
        <GpSelector
          gps={scoredGpsAsc}
          selectedId={selectedGpId}
          basePath="/ranking/play"
        />
      )}

      <p className="text-gray-500 text-sm mb-6">
        Pontos {isAccumulado ? 'acumulados de todos os GPs' : 'individuais deste GP'}
      </p>

      {!rows.length ? (
        <div className="card text-center text-gray-500 py-16">
          Nenhum dado disponível. Volta após a primeira corrida!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase tracking-wider bg-f1gray/30">
                <th className="text-center py-3 px-3 w-12">#</th>
                <th className="text-left py-3 px-3">Jogador</th>
                {isAccumulado && (
                  <th className="text-right py-3 px-3 hidden md:table-cell">GPs</th>
                )}
                <th className="text-right py-3 px-4 text-white">
                  {isAccumulado ? 'Total' : 'Pontos GP'}
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r: AggregatedRow, i: number) => {
                const initial = r.nickname.charAt(0).toUpperCase()
                const playerHref = `/players/${encodeURIComponent(r.nickname)}`
                const displayPts = isAccumulado ? r.cumulative_total : r.gp_total

                const st =
                  i === 0
                    ? {
                        ring: 'bg-yellow-400/10 text-yellow-400',
                        name: 'text-yellow-300',
                        score: 'text-yellow-400',
                        av: 'bg-yellow-400/15 text-yellow-400',
                        row: 'bg-yellow-400/[0.04] border-l-2 border-l-yellow-400',
                      }
                    : i === 1
                    ? {
                        ring: 'bg-yellow-400/10 text-yellow-400',
                        name: 'text-yellow-300',
                        score: 'text-yellow-400',
                        av: 'bg-yellow-400/15 text-yellow-400',
                        row: 'bg-yellow-400/[0.04] border-l-2 border-l-yellow-400',
                      }
                    : i === 2
                    ? {
                        ring: 'bg-yellow-400/10 text-yellow-400',
                        name: 'text-yellow-300',
                        score: 'text-yellow-400',
                        av: 'bg-yellow-400/15 text-yellow-400',
                        row: 'bg-yellow-400/[0.04] border-l-2 border-l-yellow-400',
                      }
                    : {
                        ring: 'text-gray-500',
                        name: 'text-white',
                        score: 'text-white',
                        av: 'bg-f1gray text-gray-400',
                        row: 'border-l-2 border-l-transparent',
                      }

                return (
                  <ClickableRow
                    key={r.member_email}
                    href={playerHref}
                    className={`border-b border-gray-800/50 transition-colors hover:bg-white/[0.03] ${st.row}`}
                  >
                    <td className="py-4 px-3 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${st.ring}`}>
                        {i + 1}
                      </span>
                    </td>

                    <td className="py-4 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {r.foto_url ? (
                          <img
                            src={r.foto_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-700"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${st.av}`}>
                            {initial}
                          </div>
                        )}
                        <div className="font-semibold truncate">
                          <span className={st.name}>{r.nickname}</span>
                        </div>
                      </div>
                    </td>

                    {isAccumulado && (
                      <td className="py-4 px-3 text-right hidden md:table-cell">
                        <span className="tabular-nums text-gray-400">{r.gps_played}</span>
                      </td>
                    )}

                    <td className="py-4 px-4 text-right">
                      <span className={`text-2xl font-bold tabular-nums ${st.score}`}>
                        {displayPts}
                      </span>
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
