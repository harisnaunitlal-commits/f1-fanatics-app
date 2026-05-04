export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { RankingTabs } from '@/components/RankingTabs'
import { GpSelector } from '@/components/GpSelector'
import { ClickableRow } from '@/components/ClickableRow'

export default async function PredictRankingPage({
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

  // null = "Acumulado" (latest GP total); specific ID = individual GP
  const selectedGpId: number | null = searchParams.gp
    ? parseInt(searchParams.gp)
    : null

  const isAccumulado = selectedGpId === null

  // For Acumulado: query latest GP (final cumulative); for per-GP: query that GP
  const queryGpId = selectedGpId ?? (scoredGps?.[0]?.id ?? null)

  const { data: rawScores } = queryGpId
    ? await (supabase as any)
        .from('scores_predict')
        .select('member_email, nick_predict, pontos_acum, pontos_gp, members(nickname, foto_url)')
        .eq('gp_id', queryGpId)
    : { data: null }

  // For per-GP: use stored pontos_gp if available, else calculate delta from pontos_acum
  let scores: any[] | null = null

  if (rawScores) {
    if (isAccumulado) {
      scores = [...rawScores].sort((a: any, b: any) => b.pontos_acum - a.pontos_acum)
    } else {
      // Only fetch prev GP data if any row lacks stored pontos_gp
      const needsDelta = rawScores.some((s: any) => s.pontos_gp === null || s.pontos_gp === undefined)
      const prevAcumMap = new Map<string, number>()

      if (needsDelta) {
        const selectedIdx = scoredGpsAsc.findIndex((g: any) => g.id === selectedGpId)
        const prevGp = selectedIdx > 0 ? scoredGpsAsc[selectedIdx - 1] : null
        if (prevGp) {
          const { data: prevScores } = await (supabase as any)
            .from('scores_predict')
            .select('member_email, pontos_acum')
            .eq('gp_id', prevGp.id)
          ;((prevScores ?? []) as any[]).forEach((s: any) => {
            prevAcumMap.set(s.member_email, s.pontos_acum)
          })
        }
      }

      scores = rawScores
        .map((s: any) => ({
          ...s,
          pontos_gp: s.pontos_gp !== null && s.pontos_gp !== undefined
            ? s.pontos_gp
            : s.pontos_acum - (prevAcumMap.get(s.member_email) ?? 0),
        }))
        .sort((a: any, b: any) => b.pontos_gp - a.pontos_gp)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Ranking F1 Predict</h1>
        <RankingTabs active="predict" gpId={selectedGpId} />
      </div>

      {scoredGpsAsc.length > 0 && (
        <GpSelector gps={scoredGpsAsc} selectedId={selectedGpId} basePath="/ranking/predict" />
      )}

      <p className="text-gray-500 text-sm mb-6">
        Liga: <span className="font-mono text-gray-400">C4MIFTXAH05</span> · ID: 696205 ·
        Pontos {isAccumulado ? 'acumulados do site oficial' : 'individuais deste GP'}
      </p>

      {!scores || scores.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">Nenhum dado importado ainda.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-700/60">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase tracking-wider bg-f1gray/30">
                <th className="text-center py-3 px-3 w-12">#</th>
                <th className="text-left py-3 px-3">Membro</th>
                <th className="text-right py-3 px-4 text-white">
                  {isAccumulado ? 'Acumulado' : 'Pontos GP'}
                </th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s: any, i: number) => {
                const member = s.members as { nickname: string; foto_url: string | null } | null
                const name = member?.nickname ?? s.member_email.split('@')[0]
                const playerHref = `/players/${encodeURIComponent(name)}`
                const displayPts = isAccumulado ? s.pontos_acum : s.pontos_gp

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
                          <img
                            src={member.foto_url}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-700"
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${st.av}`}>
                            {name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className={`font-semibold ${st.name}`}>{name}</div>
                          <div className="text-xs text-gray-500">{s.nick_predict}</div>
                        </div>
                      </div>
                    </td>
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
