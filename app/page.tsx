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

  // Convert emoji flag (🇦🇺) or text code (AU) to local flag image path
  const toFlag = (code: string) => {
    const clean = [...code].map(c => {
      const cp = c.codePointAt(0)!
      // Regional Indicator letters (flag emoji) → convert to A-Z
      if (cp >= 127462 && cp <= 127487) return String.fromCharCode(cp - 127397)
      return c.toUpperCase()
    }).join('')
    return `/flags/${clean}.png`
  }

  return (
    <div className="space-y-10">

      {/* ── Brand Hero ── */}
      <div className="flex flex-col items-center text-center py-6">
        <div className="bg-white rounded-full p-1 shadow-[0_0_50px_rgba(225,6,0,0.5)] mb-4">
          <img
            src="/logos/beira-f1.png"
            alt="Beira F1 Fanatics"
            className="h-44 w-44 object-contain rounded-full"
          />
        </div>
        <h1 className="text-3xl font-black tracking-tight mt-1">Beira F1 Fanatics</h1>
        <p className="text-gray-400 text-sm mt-1">Liga F1 · Beira, Moçambique 🇲🇿</p>
      </div>

      {nextGp && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-f1red/20 to-f1dark border border-f1red/30 p-8">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-f1red font-bold text-sm uppercase tracking-widest mb-2">
                  Próxima Corrida
                </p>
                <h1 className="text-4xl font-black flex items-center gap-3">
                  <img src={toFlag((nextGp as any).emoji_bandeira)} alt={(nextGp as any).nome} className="h-12 rounded-lg shadow" />
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-f1dark border border-gray-800 p-6 pb-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Ranking Global</p>
              <h2 className="text-xl font-black">
                Pódio · <img src={toFlag((lastGp as any).emoji_bandeira)} alt="" className="inline h-4 rounded align-middle" /> {(lastGp as any).nome}
              </h2>
            </div>
            <Link href="/ranking" className="text-f1red text-sm hover:underline font-medium">
              Ver completo →
            </Link>
          </div>

          {/* Podium: 2nd | 1st | 3rd */}
          <div className="flex items-end justify-center gap-2">
            {[1, 0, 2].map((i) => {
              const r = (top3 as any[])[i]
              if (!r) return null
              const member = r.members as { nickname: string; foto_url: string | null } | null
              const name = member?.nickname ?? '?'
              const initial = name.charAt(0).toUpperCase()
              const isFirst = i === 0

              const cfg = i === 0 ? {
                pos: 1,
                avatarCls: 'w-28 h-28',
                avatarInitCls: 'text-4xl',
                ring: 'ring-4 ring-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]',
                nameCls: 'text-white text-lg font-black',
                scoreCls: 'text-yellow-400 text-5xl font-black',
                blockH: 'h-28',
                blockBg: 'bg-gradient-to-t from-yellow-600 to-yellow-400',
                blockLabel: 'text-yellow-900',
                cardMt: 'mb-0',
                width: 'flex-[1.4]',
              } : i === 1 ? {
                pos: 2,
                avatarCls: 'w-20 h-20',
                avatarInitCls: 'text-2xl',
                ring: 'ring-2 ring-gray-400 shadow-[0_0_16px_rgba(156,163,175,0.3)]',
                nameCls: 'text-gray-200 text-sm font-bold',
                scoreCls: 'text-gray-300 text-3xl font-black',
                blockH: 'h-20',
                blockBg: 'bg-gradient-to-t from-gray-500 to-gray-400',
                blockLabel: 'text-gray-800',
                cardMt: 'mb-0',
                width: 'flex-1',
              } : {
                pos: 3,
                avatarCls: 'w-16 h-16',
                avatarInitCls: 'text-xl',
                ring: 'ring-2 ring-amber-600 shadow-[0_0_12px_rgba(180,83,9,0.3)]',
                nameCls: 'text-gray-300 text-sm font-bold',
                scoreCls: 'text-amber-500 text-3xl font-black',
                blockH: 'h-14',
                blockBg: 'bg-gradient-to-t from-amber-800 to-amber-600',
                blockLabel: 'text-amber-200',
                cardMt: 'mb-0',
                width: 'flex-1',
              }

              return (
                <Link
                  key={r.member_email}
                  href={`/players/${encodeURIComponent(name)}`}
                  className={`${cfg.width} flex flex-col items-center hover:scale-105 transition-transform duration-200`}
                >
                  {/* Avatar + info */}
                  <div className="text-center mb-3 px-2">
                    {member?.foto_url ? (
                      <img
                        src={member.foto_url}
                        alt={name}
                        className={`${cfg.avatarCls} rounded-full object-cover mx-auto mb-2 ${cfg.ring}`}
                      />
                    ) : (
                      <div className={`${cfg.avatarCls} rounded-full bg-f1red/20 text-f1red flex items-center justify-center font-black mx-auto mb-2 ${cfg.ring} ${cfg.avatarInitCls}`}>
                        {initial}
                      </div>
                    )}
                    <div className={`${cfg.nameCls} truncate max-w-full`}>{name}</div>
                    <div className={cfg.scoreCls}>{r.global_score?.toFixed(1)}</div>
                  </div>

                  {/* Podium block */}
                  <div className={`w-full ${cfg.blockH} ${cfg.blockBg} rounded-t-xl flex items-center justify-center`}>
                    <span className={`text-2xl font-black ${cfg.blockLabel}`}>{cfg.pos}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4">Calendário 2026</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(allGps as any[])?.map(gp => {
            const raceDate = new Date(gp.data_corrida)
            const friDate = new Date(raceDate)
            friDate.setDate(raceDate.getDate() - 2)

            const startDay = friDate.getDate()
            const endDay = raceDate.getDate()
            const startMonth = friDate.toLocaleDateString('pt-MZ', { month: 'short', timeZone: 'Africa/Maputo' })
            const endMonth = raceDate.toLocaleDateString('pt-MZ', { month: 'short', timeZone: 'Africa/Maputo' })
            const dateRange = friDate.getMonth() === raceDate.getMonth()
              ? `${startDay}–${endDay} ${endMonth.charAt(0).toUpperCase() + endMonth.slice(1, 3)}`
              : `${startDay} ${startMonth.slice(0,3)} – ${endDay} ${endMonth.slice(0,3)}`

            const isScored  = gp.status === 'scored'
            const isActive  = gp.status === 'active'
            const isUpcoming = gp.status === 'upcoming'

            return (
              <div
                key={gp.id}
                className={`relative rounded-xl border overflow-hidden transition-transform hover:scale-105 ${
                  isScored  ? 'border-green-700/40 bg-gradient-to-b from-green-900/20 to-f1dark' :
                  isActive  ? 'border-f1red/60 bg-gradient-to-b from-f1red/10 to-f1dark shadow-[0_0_16px_rgba(225,6,0,0.2)]' :
                  isUpcoming ? 'border-gray-700 bg-gradient-to-b from-gray-800/40 to-f1dark' :
                               'border-gray-800/50 bg-f1dark opacity-60'
                }`}
              >
                {/* Top colour stripe */}
                <div className={`h-1 w-full ${
                  isScored ? 'bg-green-500' :
                  isActive ? 'bg-f1red' :
                  isUpcoming ? 'bg-gray-500' : 'bg-gray-700'
                }`} />

                <div className="p-3">
                  {/* Round + status badge */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">
                      R{String(gp.round).padStart(2, '0')}
                    </span>
                    {isScored && <span className="text-[10px] font-bold text-green-500 bg-green-900/30 px-1.5 py-0.5 rounded-full">✓ Pontuado</span>}
                    {isActive && <span className="text-[10px] font-bold text-f1red bg-f1red/10 px-1.5 py-0.5 rounded-full animate-pulse">● Activo</span>}
                  </div>

                  {/* Flag emoji large */}
                  <img src={toFlag(gp.emoji_bandeira)} alt={gp.nome} className="w-full h-14 object-cover rounded-lg shadow mb-2" />

                  {/* GP name */}
                  <div className="font-black text-sm text-white leading-tight truncate">{gp.nome}</div>

                  {/* Date range */}
                  <div className="text-xs text-gray-400 font-medium mt-1">{dateRange}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center flex flex-col items-center">
          <div className="h-16 w-full flex items-center justify-center mb-3">
            <img src="/logos/f1-play.png" alt="F1 Play" className="h-14 w-auto object-contain rounded-xl" />
          </div>
          <div className="font-bold">F1 Play Fanatics</div>
          <div className="text-xs text-gray-500 mt-1">15 previsões · máx 20 pts por GP</div>
          <Link href="/ranking/play" className="text-f1red text-sm mt-2 block hover:underline">
            Ver ranking
          </Link>
        </div>
        <div className="card text-center flex flex-col items-center">
          <div className="h-16 w-full flex items-center justify-center mb-3">
            <img src="/logos/f1-fantasy.jpg" alt="F1 Fantasy" className="h-14 w-auto object-contain rounded-xl" />
          </div>
          <div className="font-bold">F1 Fantasy</div>
          <div className="text-xs text-gray-500 mt-1">fantasy.formula1.com · C57XPPKP703</div>
          <Link href="/ranking/fantasy" className="text-f1red text-sm mt-2 block hover:underline">
            Ver ranking
          </Link>
        </div>
        <div className="card text-center flex flex-col items-center">
          <div className="h-16 w-full flex items-center justify-center mb-3">
            <img src="/logos/f1-predict.jpg" alt="F1 Predict" className="h-14 w-auto object-contain rounded-xl" />
          </div>
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