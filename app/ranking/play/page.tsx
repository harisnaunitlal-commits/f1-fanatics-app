import { createClient } from '@/lib/supabase/server'
import { RankingTabs } from '@/components/RankingTabs'
import { GpSelector } from '@/components/GpSelector'
import { ClickableRow } from '@/components/ClickableRow'

const LABELS: Record<string, string> = {
  pts_p1a: '1º', pts_p1b: '2º', pts_p1c: '3º',
  pts_p2: 'Equipa', pts_p3: 'LAP',
  pts_p4a: 'P4', pts_p4b: 'P5', pts_p4c: 'P6',
  pts_p5: 'D1', pts_p6: 'D2', pts_p7: 'D3',
  pts_p8: 'Margem', pts_p9: 'Retire', pts_p10: 'DOTD',
  pts_p11: 'FL', pts_p12: 'Class.',
  pts_p13: 'Esp.', pts_p14: 'SC', pts_p15: 'Out.',
}
const SCORE_FIELDS = Object.keys(LABELS)

export default async function PlayRankingPage({
  searchParams,
}: {
  searchParams: { gp?: string }
}) {
  const supabase = await createClient()

  const { data: scoredGps } = await supabase
    .from('gp_calendar')
    .select('id, round, nome, emoji_bandeira')
    .eq('status', 'scored')
    .order('round', { ascending: false })

  const scoredGpsAsc = [...(scoredGps ?? [])].reverse()

  const selectedGpId = searchParams.gp
    ? parseInt(searchParams.gp)
    : scoredGps?.[0]?.id ?? null

  const selectedGp = scoredGps?.find(g => g.id === selectedGpId)

  // All scores across all scored GPs for the cumulative standings
  const { data: allScores } = scoredGps?.length
    ? await supabase
        .from('scores_play')
        .select('member_email, gp_id, total, participou, members(nickname, foto_url)')
        .in('gp_id', scoredGps.map(g => g.id))
    : { data: null }

  // Build cumulative totals + per-GP breakdown
  const totals = new Map<string, {
    nickname: string
    foto_url: string | null
    total: number
    gp_scores: Map<number, { total: number; participou: boolean }>
  }>()

  for (const s of allScores ?? []) {
    const member = s.members as { nickname: string; foto_url: string | null } | null
    const entry = totals.get(s.member_email) ?? {
      nickname: member?.nickname ?? s.member_email.split('@')[0],
      foto_url: member?.foto_url ?? null,
      total: 0,
      gp_scores: new Map(),
    }
    if (s.participou) entry.total += s.total
    entry.gp_scores.set(s.gp_id, { total: s.total, participou: s.participou })
    totals.set(s.member_email, entry)
  }

  const sorted = [...totals.entries()].sort((a, b) => b[1].total - a[1].total)

  // Per-GP detail for selected GP
  const { data: gpScores } = selectedGpId
    ? await supabase
        .from('scores_play')
        .select('*')
        .eq('gp_id', selectedGpId)
        .order('total', { ascending: false })
    : { data: null }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Ranking F1 Play</h1>
        <RankingTabs active="play" gpId={selectedGpId} />
      </div>

      {scoredGpsAsc.length > 0 && (
        <GpSelector gps={scoredGpsAsc} selectedId={selectedGpId} basePath="/ranking/play" />
      )}

      {sorted.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">Nenhum GP pontuado ainda.</div>
      ) : (
        <>
          {/* Cumulative standings */}
          <div className="overflow-x-auto rounded-xl border border-gray-700/60 mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase tracking-wider bg-f1gray/30">
                  <th className="text-center py-3 px-3 w-12">#</th>
                  <th className="text-left py-3 px-3">Jogador</th>
                  {scoredGpsAsc.map(g => (
                    <th key={g.id} className="text-center py-3 px-2 hidden sm:table-cell">{g.emoji_bandeira}</th>
                  ))}
                  <th className="text-right py-3 px-4 text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(([email, d], i) => {
                  const playerHref = `/players/${encodeURIComponent(d.nickname)}`
                  const s =
                    i === 0 ? { ring: 'bg-yellow-400/10 text-yellow-400', name: 'text-yellow-300', score: 'text-yellow-400', av: 'bg-yellow-400/15 text-yellow-400', row: 'bg-yellow-400/[0.04] border-l-2 border-l-yellow-400' } :
                    i === 1 ? { ring: 'bg-gray-400/10 text-gray-300',   name: 'text-gray-100',   score: 'text-gray-300',   av: 'bg-gray-400/15 text-gray-300',   row: 'bg-gray-400/[0.04]  border-l-2 border-l-gray-400'  } :
                    i === 2 ? { ring: 'bg-amber-600/10 text-amber-500', name: 'text-amber-300',  score: 'text-amber-500',  av: 'bg-amber-600/15 text-amber-500', row: 'bg-amber-600/[0.04] border-l-2 border-l-amber-600' } :
                    { ring: 'text-gray-500', name: 'text-white', score: 'text-white', av: 'bg-f1gray text-gray-400', row: 'border-l-2 border-l-transparent' }

                  return (
                    <ClickableRow
                      key={email}
                      href={playerHref}
                      className={`border-b border-gray-800/50 transition-colors hover:bg-white/[0.03] ${s.row}`}
                    >
                      <td className="py-4 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${s.ring}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-2.5">
                          {d.foto_url ? (
                            <img src={d.foto_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-700" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${s.av}`}>
                              {d.nickname.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className={`font-semibold ${s.name}`}>{d.nickname}</span>
                        </div>
                      </td>
                      {scoredGpsAsc.map(g => {
                        const entry = d.gp_scores.get(g.id)
                        return (
                          <td key={g.id} className="text-center py-4 px-2 hidden sm:table-cell">
                            {entry?.participou ? (
                              <span className="text-sm tabular-nums">{entry.total}</span>
                            ) : (
                              <span className="text-gray-700 text-sm">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="py-4 px-4 text-right">
                        <span className={`text-2xl font-bold tabular-nums ${s.score}`}>{d.total}</span>
                      </td>
                    </ClickableRow>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* GP detail */}
          {selectedGp && gpScores && gpScores.length > 0 && (
            <div>
              <h2 className="font-bold mb-4 text-gray-300">
                Detalhe: {selectedGp.emoji_bandeira} GP {selectedGp.nome}
              </h2>
              <div className="overflow-x-auto rounded-xl border border-gray-700/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-gray-800 bg-f1gray/30">
                      <th className="text-left py-2.5 px-3">#</th>
                      <th className="text-left py-2.5 px-3">Membro</th>
                      {SCORE_FIELDS.map(f => (
                        <th key={f} className="text-center py-2.5 px-1 text-xs">{LABELS[f]}</th>
                      ))}
                      <th className="text-right py-2.5 px-3 font-bold text-white">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gpScores.map((s, i) => (
                      <tr key={s.member_email} className="border-b border-gray-900 hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                        <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                          {totals.get(s.member_email)?.nickname ?? s.member_email.split('@')[0]}
                        </td>
                        {SCORE_FIELDS.map(f => {
                          const pts = (s as Record<string, number>)[f] ?? 0
                          const maxPts = f === 'pts_p9' ? 3 : f === 'pts_p10' ? 2 : 1
                          return (
                            <td key={f} className="text-center py-2.5 px-1">
                              <span className={`text-xs font-bold ${pts === maxPts ? 'text-green-400' : 'text-gray-700'}`}>
                                {pts === maxPts ? '✓' : '✗'}
                              </span>
                            </td>
                          )
                        })}
                        <td className="text-right py-2.5 px-3 font-bold text-lg">{s.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
