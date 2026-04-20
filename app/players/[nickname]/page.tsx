import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function PlayerProfilePage({
  params,
}: {
  params: { nickname: string }
}) {
  const nickname = decodeURIComponent(params.nickname)
  const supabase = await createClient()

  const { data: member } = await (supabase as any)
    .from('members')
    .select('*')
    .eq('nickname', nickname)
    .single()

  if (!member) notFound()

  // Play scores across all GPs
  const { data: playScores } = await (supabase as any)
    .from('scores_play')
    .select('gp_id, total, participou, gp_calendar(round, nome, emoji_bandeira)')
    .eq('member_email', (member as any).email)
    .order('gp_id')

  // Fantasy scores
  const { data: fantasyScores } = await (supabase as any)
    .from('scores_fantasy')
    .select('gp_id, pontos_acum, pontos_gp, equipa_nome, gp_calendar(round, nome, emoji_bandeira)')
    .eq('member_email', (member as any).email)
    .order('gp_id')

  // Predict scores
  const { data: predictScores } = await (supabase as any)
    .from('scores_predict')
    .select('gp_id, pontos_acum, nick_predict, gp_calendar(round, nome, emoji_bandeira)')
    .eq('member_email', (member as any).email)
    .order('gp_id')

  // Latest global ranking entry
  const { data: globalRanking } = await (supabase as any)
    .from('global_ranking')
    .select('gp_id, play_pts, fantasy_pts, predict_pts, play_gpts, fantasy_gpts, predict_gpts, global_score, n_ligas, gp_calendar(round, nome, emoji_bandeira)')
    .eq('member_email', (member as any).email)
    .order('gp_id', { ascending: false })
    .limit(1)
    .single()

  const playTotal = (playScores ?? [])
    .filter((s: any) => s.participou)
    .reduce((a: number, s: any) => a + s.total, 0)

  const latestFantasy = (fantasyScores ?? []).at(-1)
  const latestPredict = (predictScores ?? []).at(-1)

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Link href="/ranking" className="text-gray-500 text-sm hover:text-gray-300">← Ranking</Link>

      {/* Header */}
      <div className="flex items-center gap-5">
        {member.foto_url ? (
          <img src={member.foto_url} alt="" className="w-20 h-20 rounded-full object-cover ring-2 ring-f1red/40" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-f1red/20 text-f1red text-3xl flex items-center justify-center font-black">
            {member.nickname.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-black">{member.nickname}</h1>
          {member.nome_completo && (
            <p className="text-gray-400">{member.nome_completo}</p>
          )}
          <p className="text-gray-500 text-sm mt-0.5">
            {member.cidade ?? 'Beira'}, {member.pais}
          </p>
        </div>
      </div>

      {/* Global score summary */}
      {globalRanking && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">F1 Play</div>
            <div className="text-2xl font-black text-white">{playTotal}</div>
            <div className="text-xs text-gray-500">pontos</div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fantasy</div>
            <div className="text-2xl font-black text-white">
              {latestFantasy?.pontos_acum ?? '—'}
            </div>
            <div className="text-xs text-gray-500">acumulado</div>
          </div>
          <div className="card text-center">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Predict</div>
            <div className="text-2xl font-black text-white">
              {latestPredict?.pontos_acum ?? '—'}
            </div>
            <div className="text-xs text-gray-500">acumulado</div>
          </div>
        </div>
      )}

      {globalRanking && (
        <div className="card text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Global Score</div>
          <div className="text-5xl font-black text-f1red">
            {globalRanking.global_score?.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {globalRanking.n_ligas} liga{globalRanking.n_ligas !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Play history */}
      {playScores && playScores.length > 0 && (
        <div>
          <h2 className="font-bold mb-3 text-gray-300">F1 Play — por corrida</h2>
          <div className="space-y-1">
            {playScores.map((s: any) => {
              const gp = s.gp_calendar as {
                round: number
                nome: string
                emoji_bandeira: string | null
              } | null

              return (
                <div
                  key={s.gp_id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 bg-f1dark border border-gray-800"
                >
                  <span className="text-sm text-gray-300">
                    {gp?.emoji_bandeira} R{String(gp?.round).padStart(2, '0')} {gp?.nome}
                  </span>
                  {s.participou ? (
                    <span className="font-bold text-white">{s.total}</span>
                  ) : (
                    <span className="text-gray-600 text-sm">não participou</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bio */}
      {member.bio && (
        <div>
          <h2 className="font-bold mb-2 text-gray-300">Bio</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>
        </div>
      )}

      {/* Favorites */}
      {(member.piloto_fav || member.equipa_fav) && (
        <div className="flex gap-4">
          {member.piloto_fav && (
            <div className="card flex-1 text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Piloto fav</div>
              <div className="font-bold">{member.piloto_fav}</div>
            </div>
          )}
          {member.equipa_fav && (
            <div className="card flex-1 text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Equipa fav</div>
              <div className="font-bold">{member.equipa_fav}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}