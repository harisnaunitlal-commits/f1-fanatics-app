import type { StateResponse } from '@/lib/telemetry/shared'

type Play = NonNullable<StateResponse['play']>

function Avatar({ url, name }: { url: string | null; name: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  if (url) return <img src={url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
  return <span className="w-7 h-7 rounded-full bg-f1gray text-[11px] font-bold flex items-center justify-center shrink-0">{name.charAt(0).toUpperCase()}</span>
}

function Move({ from, to }: { from: number; to: number }) {
  if (to < from) return <span className="text-green-400 text-[10px] font-bold w-7 text-right">▲{from - to}</span>
  if (to > from) return <span className="text-red-400 text-[10px] font-bold w-7 text-right">▼{to - from}</span>
  return <span className="text-gray-600 text-[10px] w-7 text-right">·</span>
}

// F1 Play, both views while the race runs. Everything here is provisional: the official answers are
// entered the next day, after checking, and only then are the points final.
export function PlayBoards({ play, gpName }: { play: Play; gpName: string | null }) {
  const leader = play.aggregate[0]
  return (
    <section className="card p-0 overflow-hidden border-sky-500/30">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/60 bg-gradient-to-r from-sky-500/15 to-transparent">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/f1-play.png" alt="F1 Play" className="w-11 h-11 rounded-lg shrink-0" />
        <div className="min-w-0">
          <h2 className="text-sm font-black uppercase tracking-widest text-white leading-tight">Classificação F1 Play</h2>
          <p className="text-[11px] text-gray-400">ao vivo, durante a corrida</p>
        </div>
        <span className="ml-auto shrink-0 text-[10px] font-black tracking-widest rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/50 px-2.5 py-1">PROVISÓRIO</span>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-yellow-400 mb-2">Só este GP{gpName ? ` · ${gpName}` : ''}</h3>
          <ol className="space-y-1">
            {play.leaderboard.map((l, i) => (
              <li key={i} className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 ${l.isMe ? 'bg-yellow-400/10 border border-yellow-400/40' : ''} ${i === 10 ? 'mt-2' : ''}`}>
                <span className="w-6 text-center font-bold text-gray-400 tabular-nums">{l.rank}</span>
                <Avatar url={l.foto_url} name={l.nickname} />
                <span className="font-semibold truncate">{l.nickname}</span>
                <span className="ml-auto font-black tabular-nums text-yellow-300">{l.total}</span>
              </li>
            ))}
          </ol>
        </div>

        {play.aggregate.length > 0 && (
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-widest text-sky-300 mb-0.5">Acumulado da época</h3>
            <p className="text-[10px] text-gray-500 mb-2">pontos oficiais dos GPs anteriores + os provisórios de hoje</p>
            <ol className="space-y-1">
              {play.aggregate.map((a, i) => {
                const lead = a.rank === 1
                return (
                  <li key={i} className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1.5 ${lead ? 'bg-gradient-to-r from-emerald-500/30 to-emerald-500/5 border border-emerald-400/70 shadow-[0_0_24px_rgba(16,185,129,.25)]' : a.isMe ? 'bg-sky-400/10 border border-sky-400/40' : ''} ${i === 10 ? 'mt-2' : ''}`}>
                    <span className={`w-6 text-center font-bold tabular-nums ${lead ? 'text-emerald-300' : 'text-gray-400'}`}>{lead ? '👑' : a.rank}</span>
                    <Move from={a.prevRank} to={a.rank} />
                    <Avatar url={a.foto_url} name={a.nickname} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold truncate leading-tight">{a.nickname}</span>
                      <span className="block text-[10px] text-gray-500 tabular-nums leading-tight">{a.base} + <b className={a.gpPts > 0 ? 'text-emerald-300' : 'text-gray-500'}>{a.gpPts}</b> hoje</span>
                    </span>
                    <span className={`font-black tabular-nums text-lg ${lead ? 'text-emerald-300' : 'text-sky-200'}`}>{a.total}</span>
                  </li>
                )
              })}
            </ol>
            {leader && <p className="text-[11px] text-emerald-300/90 mt-2">👑 Líder provisório da época: <b>{leader.nickname}</b></p>}
          </div>
        )}

        <p className="text-[10px] text-gray-500 leading-snug border-t border-gray-700/60 pt-3">
          ⚠️ <b className="text-orange-300">Resultados provisórios.</b> Os pontos oficiais são lançados no dia seguinte, depois de verificadas as respostas correctas. A classificação final pode mudar.
        </p>
      </div>
    </section>
  )
}
