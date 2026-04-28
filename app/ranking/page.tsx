export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { RankingTabs } from '@/components/RankingTabs'
import { GpSelector } from '@/components/GpSelector'
import { ClickableRow } from '@/components/ClickableRow'

type RankingRow = {
  member_email: string
  play_pts: number
  fantasy_pts: number
  predict_pts: number
  play_gpts: number
  fantasy_gpts: number
  predict_gpts: number
  global_score: number
  n_ligas: number
  members: { nickname: string; foto_url: string | null } | null
}

// Acumulado view: show cumulative pts + normalised score
function LeagueCell({ pts, gpts }: { pts: number; gpts: number }) {
  if (pts === 0)
    return (
      <td className="py-4 px-3 text-right hidden md:table-cell">
        <span className="text-gray-700 text-sm">—</span>
      </td>
    )
  return (
    <td className="py-4 px-3 text-right hidden md:table-cell">
      <div className="text-white tabular-nums font-medium">{pts}</div>
      <div className="text-xs text-gray-500 tabular-nums">{Number(gpts).toFixed(1)}</div>
    </td>
  )
}

// Per-GP view: show raw per-GP points only
function LeagueCellGp({ pts }: { pts: number }) {
  if (pts === 0)
    return (
      <td className="py-4 px-3 text-right hidden md:table-cell">
        <span className="text-gray-700 text-sm">—</span>
      </td>
    )
  return (
    <td className="py-4 px-3 text-right hidden md:table-cell">
      <div className="text-white tabular-nums font-medium">{pts}</div>
    </td>
  )
}

export default async function GlobalRankingPage({
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

  // null = "Acumulado" (latest snapshot); specific ID = individual GP
  const selectedGpId: number | null = searchParams.gp
    ? parseInt(searchParams.gp)
    : null

  const isAccumulado = selectedGpId === null

  // For Acumulado: query latest GP snapshot; for per-GP: query that GP
  const queryGpId = selectedGpId ?? (scoredGps?.[0]?.id ?? null)

  const { data: currRows } = queryGpId
    ? await (supabase as any)
        .from('global_ranking')
        .select(
          'member_email, play_pts, fantasy_pts, predict_pts, play_gpts, fantasy_gpts, predict_gpts, global_score, n_ligas, members(nickname, foto_url)'
        )
        .eq('gp_id', queryGpId)
    : { data: null }

  // For per-GP: fetch previous GP snapshot to compute deltas
  let rows: any[] | null = null

  if (currRows) {
    if (isAccumulado) {
      rows = [...currRows].sort((a: any, b: any) =>
        b.global_score - a.global_score || a.member_email.localeCompare(b.member_email)
      )
    } else {
      // Find previous GP
      const selectedIdx = scoredGpsAsc.findIndex((g: any) => g.id === selectedGpId)
      const prevGp = selectedIdx > 0 ? scoredGpsAsc[selectedIdx - 1] : null

      // Fetch previous snapshot
      const prevMap = new Map<string, { play_pts: number; fantasy_pts: number; predict_pts: number }>()
      if (prevGp) {
        const { data: prevRows } = await (supabase as any)
          .from('global_ranking')
          .select('member_email, play_pts, fantasy_pts, predict_pts')
          .eq('gp_id', prevGp.id)
        ;((prevRows ?? []) as any[]).forEach((r: any) => {
          prevMap.set(r.member_email, {
            play_pts: r.play_pts ?? 0,
            fantasy_pts: r.fantasy_pts ?? 0,
            predict_pts: r.predict_pts ?? 0,
          })
        })
      }

      rows = currRows
        .map((r: any) => {
          const prev = prevMap.get(r.member_email) ?? { play_pts: 0, fantasy_pts: 0, predict_pts: 0 }
          const play_gp    = (r.play_pts    ?? 0) - prev.play_pts
          const fantasy_gp = (r.fantasy_pts ?? 0) - prev.fantasy_pts
          const predict_gp = (r.predict_pts ?? 0) - prev.predict_pts
          const total_gp   = play_gp + fantasy_gp + predict_gp
          return { ...r, play_gp, fantasy_gp, predict_gp, total_gp }
        })
        .sort((a: any, b: any) =>
          b.total_gp - a.total_gp || a.member_email.localeCompare(b.member_email)
        )
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Ranking Global</h1>
        <RankingTabs active="global" gpId={selectedGpId} />
      </div>

      {scoredGpsAsc.length > 0 && (
        <GpSelector
          gps={scoredGpsAsc}
          selectedId={selectedGpId}
          basePath="/ranking"
        />
      )}

      <p className="text-gray-500 text-sm mb-6">
        {isAccumulado
          ? 'Score normalizado 0–100 · média das 3 ligas · acumulado'
          : 'Pontos individuais deste GP por liga'}
      </p>

      {!rows || rows.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">
          Nenhum dado disponível. Volta após a primeira corrida!
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-700/60">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase tracking-wider bg-f1gray/30">
                  <th className="text-center py-3 px-3 w-12">#</th>
                  <th className="text-left py-3 px-3">Jogador</th>
                  <th className="text-right py-3 px-3 hidden md:table-cell">Play</th>
                  <th className="text-right py-3 px-3 hidden md:table-cell">Fantasy</th>
                  <th className="text-right py-3 px-3 hidden md:table-cell">Predict</th>
                  <th className="text-right py-3 px-4 text-white">
                    {isAccumulado ? 'Score' : 'Total GP'}
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r: any, i: number) => {
                  const name = r.members?.nickname ?? r.member_email.split('@')[0]
                  const initial = name.charAt(0).toUpperCase()
                  const playerHref = `/players/${encodeURIComponent(name)}`

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
                          ring: 'bg-gray-400/10 text-gray-300',
                          name: 'text-gray-100',
                          score: 'text-gray-300',
                          av: 'bg-gray-400/15 text-gray-300',
                          row: 'bg-gray-400/[0.04] border-l-2 border-l-gray-400',
                        }
                      : i === 2
                      ? {
                          ring: 'bg-amber-600/10 text-amber-500',
                          name: 'text-amber-300',
                          score: 'text-amber-500',
                          av: 'bg-amber-600/15 text-amber-500',
                          row: 'bg-amber-600/[0.04] border-l-2 border-l-amber-600',
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
                          {r.members?.foto_url ? (
                            <img
                              src={r.members.foto_url}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-700"
                            />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${st.av}`}>
                              {initial}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className={`font-semibold truncate ${st.name}`}>{name}</div>
                            {isAccumulado && r.n_ligas < 3 && (
                              <div className="text-xs text-gray-600 mt-0.5">
                                {r.n_ligas} liga{r.n_ligas !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {isAccumulado ? (
                        <>
                          <LeagueCell pts={r.play_pts}    gpts={r.play_gpts} />
                          <LeagueCell pts={r.fantasy_pts} gpts={r.fantasy_gpts} />
                          <LeagueCell pts={r.predict_pts} gpts={r.predict_gpts} />
                        </>
                      ) : (
                        <>
                          <LeagueCellGp pts={r.play_gp} />
                          <LeagueCellGp pts={r.fantasy_gp} />
                          <LeagueCellGp pts={r.predict_gp} />
                        </>
                      )}

                      <td className="py-4 px-4 text-right">
                        <span className={`text-2xl font-bold tabular-nums ${st.score}`}>
                          {isAccumulado
                            ? Number(r.global_score).toFixed(1)
                            : r.total_gp}
                        </span>
                      </td>
                    </ClickableRow>
                  )
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-600 mt-3 text-center">
            {isAccumulado
              ? 'Score = (Play% + Fantasy% + Predict%) ÷ 3 · Ausência = 0 · Máx 100.0'
              : 'Total GP = Play + Fantasy + Predict (pontos brutos deste GP)'}
          </p>
        </>
      )}
    </div>
  )
}
