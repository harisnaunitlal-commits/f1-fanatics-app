export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getTimeUntilDeadline, isDeadlinePassed } from '@/lib/scoring'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Next upcoming GP
  const { data: nextGp } = await (supabase as any)
    .from('gp_calendar')
    .select('*')
    .in('status', ['upcoming', 'active'])
    .order('round')
    .limit(1)
    .single()

  // Last scored GP + top 3
  const { data: lastGp } = await (supabase as any)
    .from('gp_calendar')
    .select('*')
    .eq('status', 'scored')
    .order('round', { ascending: false })
    .limit(1)
    .single()

  const { data: top3 } = lastGp
    ? await (supabase as any)
        .from('global_ranking')
        .select('member_email, global_score, members(nickname, foto_url)')
        .eq('gp_id', (lastGp as any).id)
        .order('global_score', { ascending: false })
        .limit(3)
    : { data: null }

  // User's prediction status for next GP
  const myPrediction = user && nextGp
    ? await (supabase as any)
        .from('predictions')
        .select('gp_id')
        .eq('member_email', user.email!)
        .eq('gp_id', (nextGp as any).id)
        .single()
    : null

  const hasPredict = !!myPrediction?.data

  // All GPs calendar
  const { data: allGps } = await (supabase as any)
    .from('gp_calendar')
    .select('id, round, nome, emoji_bandeira, data_corrida, status')
    .eq('temporada', 2026)
    .order('round')

  return (
    <div className="space-y-10">
      {nextGp && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-f1red/20 to-f1dark border border-f1red/30 p-8">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-f1red font-bold text-sm uppercase tracking-widest mb-2">
                  Próxima Corrida
                </p>
                <h1 className="text-4xl font-black flex items-center gap-3">
                  <span>{(nextGp as any).emoji_bandeira}</span>
                  <span>GP {(nextGp as any).nome}</span>
                </h1>
                <p className="text-gray-400 mt-2">
                  {new Date((nextGp as any).data_corrida).toLocaleDateString('pt-MZ', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Africa/Maputo',
                  })} (Maputo)
                </p>
                {!isDeadlinePassed((nextGp as any).deadline_play) && (
                  <p className="text-f1red font-bold mt-1">
                    ⏱ {getTimeUntilDeadline((nextGp as any).deadline_play)} para o deadline
                  </p>
                )}
              </div>

              <div className="text-right">
                {user ? (
                  isDeadlinePassed((nextGp as any).deadline_play) ? (
                    <div className="text-gray-500">Prazo encerrado</div>
                  ) : (
                    <Link
                      href={`/predict/${(nextGp as any).id}`}
                      className={`btn-primary inline-block text-lg px-8 py-4 ${hasPredict ? 'opacity-80' : ''}`}
                    >
                      {hasPredict ? '✏️ Editar previsão' : '🏎️ Submeter previsão'}
                    </Link>
                  )
                ) : (
                  <Link href="/auth/login" className="btn-primary inline-block text-lg px-8 py-4">
                    Entrar para jogar
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {top3 && top3.length > 0 && lastGp && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              Top 3 Global · após <span className="text-sm">{(lastGp as any).emoji_bandeira}</span> {(lastGp as any).nome}
            </h2>
            <Link href="/ranking" className="text-f1red text-sm hover:underline">
              Ver ranking completo →
            </Link>
          </div>

          {/* Podium layout: 2nd | 1st | 3rd */}
          <div className="flex items-end justify-center gap-3">
            {[1, 0, 2].map((i) => {
              const r = (top3 as any[])[i]
              if (!r) return null
              const member = r.members as { nickname: string; foto_url: string | null } | null
              const name = member?.nickname ?? '?'
              const initial = name.charAt(0).toUpperCase()
              const isFirst = i === 0
              const isSecond = i === 1
              const isThird = i === 2

              const podiumH = isFirst ? 'pb-8' : isSecond ? 'pb-4' : 'pb-2'
              const avatarSize = isFirst ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-xl'
              const scoreSize = isFirst ? 'text-4xl' : 'text-2xl'
              const nameSize = isFirst ? 'text-base font-bold' : 'text-sm font-semibold'
              const ringColor = isFirst
                ? 'ring-4 ring-yellow-400 shadow-[0_0_24px_rgba(250,204,21,0.4)]'
                : isSecond
                ? 'ring-2 ring-gray-400'
                : 'ring-2 ring-amber-600'
              const scoreColor = isFirst ? 'text-yellow-400' : isSecond ? 'text-gray-300' : 'text-amber-500'
              const cardBg = isFirst
                ? 'bg-gradient-to-b from-yellow-900/20 to-f1gray border-yellow-500/30'
                : 'bg-f1gray border-gray-700/50'
              const medal = isFirst ? '🥇' : isSecond ? '🥈' : '🥉'
              const pos = isFirst ? 1 : isSecond ? 2 : 3

              return (
                <Link
                  key={r.member_email}
                  href={`/players/${encodeURIComponent(name)}`}
                  className={`flex-1 max-w-[200px] rounded-2xl border p-4 text-center ${cardBg} ${podiumH} hover:scale-105 transition-transform`}
                >
                  <div className="text-2xl mb-3">{medal}</div>

                  {member?.foto_url ? (
                    <img
                      src={member.foto_url}
                      alt={name}
                      className={`${avatarSize} rounded-full object-cover mx-auto mb-3 ${ringColor}`}
                    />
                  ) : (
                    <div className={`${avatarSize} rounded-full bg-f1red/20 text-f1red flex items-center justify-center font-black mx-auto mb-3 ${ringColor}`}>
                      {initial}
                    </div>
                  )}

                  <div className={`${nameSize} truncate`}>{name}</div>
                  <div className={`${scoreSize} font-black mt-1 ${scoreColor}`}>
                    {r.global_score?.toFixed(1)}
                  </div>

                  {/* Podium block */}
                  <div className={`mt-3 rounded-lg py-1 text-xs font-bold text-gray-600 ${
                    isFirst ? 'bg-yellow-400/10' : 'bg-gray-700/30'
                  }`}>
                    #{pos}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Calendário 2026</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {(allGps as any[])?.map(gp => (
            <div
              key={gp.id}
              className={`rounded-lg px-3 py-2 text-sm flex items-center gap-2 border ${
                gp.status === 'scored'
                  ? 'bg-green-900/20 border-green-800/30 text-gray-300'
                  : gp.status === 'active'
                    ? 'bg-blue-900/20 border-blue-700/30 text-white'
                    : gp.status === 'closed'
                      ? 'bg-gray-800/50 border-gray-700/30 text-gray-400'
                      : 'bg-f1dark border-gray-800 text-gray-400'
              }`}
            >
              <span>{gp.emoji_bandeira}</span>
              <span className="truncate">{gp.nome}</span>
              {gp.status === 'scored' && <span className="ml-auto text-green-500 text-xs">✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-3xl mb-2">🏎️</div>
          <div className="font-bold">F1 Play Fanatics</div>
          <div className="text-xs text-gray-500 mt-1">15 previsões · máx 20 pts por GP</div>
          <Link href="/ranking/play" className="text-f1red text-sm mt-2 block hover:underline">
            Ver ranking
          </Link>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">🏅</div>
          <div className="font-bold">F1 Fantasy</div>
          <div className="text-xs text-gray-500 mt-1">fantasy.formula1.com · C57XPPKP703</div>
          <Link href="/ranking/fantasy" className="text-f1red text-sm mt-2 block hover:underline">
            Ver ranking
          </Link>
        </div>
        <div className="card text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="font-bold">F1 Predict</div>
          <div className="text-xs text-gray-500 mt-1">f1predict.formula1.com · C4MIFTXAH05</div>
          <Link href="/ranking/predict" className="text-f1red text-sm mt-2 block hover:underline">
            Ver ranking
          </Link>
        </div>
      </div>
    </div>
  )
}