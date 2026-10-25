'use client'

import { useEffect, useState } from 'react'
import type { ChampResponse } from '@/lib/telemetry/champ'
import type { ChampRow } from '@/lib/telemetry/engine'
import { getDriverPhoto } from '@/lib/gp-questions'

const nice = (name: string) => name.toLowerCase().replace(/(^|[\s-])\S/g, c => c.toUpperCase())

function Move({ from, to }: { from: number; to: number }) {
  if (to < from) return <span className="text-green-400 text-xs font-bold">▲{from - to}</span>
  if (to > from) return <span className="text-red-400 text-xs font-bold">▼{to - from}</span>
  return <span className="text-gray-600 text-xs">·</span>
}

function Table({ title, rows }: { title: string; rows: { key: string; pos: number; start: number; colour: string; label: string; sub?: string; points: number; delta: number; hl?: boolean }[] }) {
  return (
    <div className="card">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{title}</h3>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(r => (
            <tr key={r.key} className={`border-b border-gray-800/50 ${r.hl ? 'bg-yellow-400/10' : ''}`}>
              <td className="py-1.5 px-1 w-7 text-center tabular-nums text-gray-400">{r.pos}</td>
              <td className="py-1.5 px-1 w-9"><Move from={r.start} to={r.pos} /></td>
              <td className="py-1.5 px-1">
                <span className="inline-flex items-center gap-2"><span className="w-1 h-5 rounded-sm" style={{ background: r.colour }} /><b>{r.label}</b>{r.sub && <span className="text-xs text-gray-500 hidden sm:inline">{r.sub}</span>}</span>
              </td>
              <td className="py-1.5 px-1 text-right tabular-nums font-bold">{r.points}</td>
              <td className="py-1.5 px-1 text-right tabular-nums text-xs w-12">{r.delta > 0 ? <span className="text-green-400">+{r.delta}</span> : <span className="text-gray-600">·</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// Leader photo next to a rising chart with an arrow and a trophy at the top (decorative: the curve is not data).
function TitleHero({ code, name, colour, points, champion }: { code: string; name: string; colour: string; points: number; champion: boolean }) {
  const photo = getDriverPhoto(code)
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-black/60 to-black/20 flex items-stretch">
      <div className="relative w-36 sm:w-44 shrink-0" style={{ boxShadow: `inset -6px 0 0 0 ${colour}` }}>
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} className="w-full h-full object-cover object-top" style={{ minHeight: 150 }} />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-3 pb-2 pt-8">
          <div className="font-black text-lg leading-none">{nice(name).split(' ').slice(-1)[0].toUpperCase()}</div>
          <div className="text-[11px] text-gray-300 tabular-nums">{points} pts</div>
        </div>
      </div>
      <div className="relative flex-1 min-w-0 px-3 py-3">
        <svg viewBox="0 0 320 150" className="w-full h-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <defs>
            <linearGradient id="hg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={colour} stopOpacity="0" /><stop offset="1" stopColor={colour} stopOpacity="0.35" /></linearGradient>
          </defs>
          <g stroke="rgba(255,255,255,.08)" strokeWidth="1"><line x1="8" y1="40" x2="312" y2="40" /><line x1="8" y1="80" x2="312" y2="80" /><line x1="8" y1="120" x2="312" y2="120" /></g>
          <path d="M10 128 L60 112 L110 118 L160 84 L210 70 L250 44 L276 36 L276 140 L10 140 Z" fill="url(#hg)" />
          <path d="M10 128 L60 112 L110 118 L160 84 L210 70 L250 44 L276 36" fill="none" stroke={colour} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M262 34 L284 30 L276 50 Z" fill={colour} transform="rotate(-8 276 38)" />
          <text x="292" y="38" fontSize="38" textAnchor="middle" dominantBaseline="middle">🏆</text>
        </svg>
        <div className={`absolute left-3 top-3 text-[10px] font-black uppercase tracking-widest ${champion ? 'text-green-400' : 'text-yellow-300'}`}>{champion ? 'Campeão do mundo' : 'Rumo ao título'}</div>
      </div>
    </div>
  )
}

export default function ChampionshipLive() {
  const [data, setData] = useState<ChampResponse | null>(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let stop = false
    let busy = false // per effect run: React StrictMode mounts twice in dev and a shared flag would block the second run
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      if (busy || stop) return
      busy = true
      let next = 20_000
      try {
        if (!document.hidden) {
          const r = await fetch('/api/campeonato', { cache: 'no-store' })
          const j = await r.json() as ChampResponse
          if (!stop) { setData(j); setErr(r.ok ? '' : (j.message ?? 'Erro.')) }
          next = j.session?.live ? 15_000 : 120_000
        }
      } catch { if (!stop) setErr('Sem ligação — a tentar de novo.') }
      busy = false
      if (!stop) timer = setTimeout(poll, next)
    }
    poll()
    return () => { stop = true; clearTimeout(timer) }
  }, [])

  if (!data) return <p className="text-gray-400">{err || 'A carregar o campeonato…'}</p>
  if (!data.ready || !data.drivers || !data.teams || !data.session) {
    return (
      <div className="max-w-2xl mx-auto card text-center space-y-2">
        <div className="text-4xl">📈</div>
        <p className="text-gray-300">{data.message ?? err ?? 'Campeonato indisponível.'}</p>
      </div>
    )
  }

  const { session, title } = data
  const lead = title?.leader
  const drivers = data.drivers
  // before the next race the arrows/points gained would refer to the previous race: leave them out
  const pre = title?.mode === 'prerace'

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold">📈 Campeonato F1</h1>
          <p className="text-gray-400 text-sm">{session.live ? `${session.name} · volta ${session.lap} — se a corrida acabasse agora` : title?.mode === 'prerace' ? `Classificação após o ${session.name} · próxima corrida: GP ${title.raceName}` : `Classificação após o ${session.name}`}</p>
        </div>
        <span className={`text-[11px] font-black px-3 py-1 rounded-full ${session.live ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-100'}`}>
          {session.live ? '● AO VIVO' : title?.mode === 'prerace' ? 'ANTES DA CORRIDA' : 'APÓS A CORRIDA'}
        </span>
      </div>

      {title && lead && (
        <div className={`rounded-2xl border p-5 space-y-4 ${title.clinchedIfEndsNow ? 'border-green-500/60 bg-green-900/15' : 'border-yellow-500/40 bg-yellow-900/10'}`}>
          <TitleHero code={lead.code} name={lead.name} colour={lead.colour} points={lead.pointsNow} champion={title.clinchedIfEndsNow} />
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-1.5 h-10 rounded-sm" style={{ background: lead.colour }} />
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 font-bold">Líder do campeonato</p>
              <p className="text-2xl font-black">{nice(lead.name)} <span className="text-gray-400 text-base font-bold">· {lead.pointsNow} pts</span></p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-gray-500">Faltam {title.remainingRaces} corridas</p>
              <p className="text-xs text-gray-500">até {title.remainingMax} pts em jogo</p>
            </div>
          </div>

          {title.clinchedIfEndsNow ? (
            <p className="text-lg font-black text-green-400">
              🏆 {title.mode === 'live' ? `${nice(lead.name)} seria CAMPEÃO do mundo se a corrida acabasse assim!` : `${nice(lead.name)} já é CAMPEÃO do mundo!`}
            </p>
          ) : title.mode === 'done' ? (
            <p className="text-sm text-yellow-200">Temporada terminada.</p>
          ) : title.canClinchThisRace ? (
            <p className="text-sm text-yellow-200">
              🔥 <b>{nice(lead.name).split(' ')[0]} pode ser campeão já no GP {title.raceName}!</b> Para isso precisa de ficar com <b>mais de {title.remainingMax} pontos</b> de avanço sobre cada rival
              (é o máximo que ainda ficará por disputar depois deste GP).
            </p>
          ) : (
            <p className="text-sm text-yellow-200">
              {nice(lead.name).split(' ')[0]} ainda <b>não consegue fechar o título no GP {title.raceName}</b>: precisava de mais de {title.remainingMax} pontos de avanço e isso não é possível só com esta corrida.
            </p>
          )}

          <div>
            <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Rivais ainda na luta</p>
            <div className="space-y-1.5">
              {title.rivals.map(r => {
                const gap = r.margin
                const ok = gap > title.remainingMax
                return (
                  <div key={r.code} className="flex items-center gap-x-3 gap-y-0.5 text-sm flex-wrap">
                    <span className="w-1 h-5 rounded-sm" style={{ background: r.colour }} />
                    <b className="w-10">{r.code}</b>
                    <span className="text-gray-400 tabular-nums whitespace-nowrap">{r.pointsNow} pts</span>
                    <span className="tabular-nums whitespace-nowrap">a <b>{gap}</b> pts</span>
                    <span className={`ml-auto text-xs font-bold text-right ${ok ? 'text-green-400' : 'text-yellow-300'}`}>{ok ? '✓ já não alcança' : title.mode === 'prerace' ? `tem de ganhar +${title.needed - gap} pts a ${r.code} neste GP` : `faltam +${title.needed - gap} pts de avanço`}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {!title.clinchedIfEndsNow && title.mode !== 'done' && (
            <div>
              <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-2">Como {lead.code} fecha o título neste GP</p>
              <div className="space-y-2">
                {title.conditions.map(c => (
                  <div key={c.leaderFinish} className="rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm">
                    <div className="font-bold text-white">Se {lead.code} {c.leaderFinish}:</div>
                    {c.rivals.length === 0 ? (
                      <div className="text-green-300 text-xs mt-0.5">✓ é campeão, aconteça o que acontecer aos rivais</div>
                    ) : (
                      <div className="text-xs mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {c.rivals.map(r => (
                          <span key={r.code} className="inline-flex items-center gap-1.5">
                            <span className="w-1 h-4 rounded-sm" style={{ background: r.colour }} />
                            <b>{r.code}</b>
                            <span className={r.mustFinish === 'impossível' ? 'text-gray-500' : 'text-green-300'}>{r.mustFinish === 'impossível' ? 'não chega' : `tem de acabar ${r.mustFinish}`}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Pontos: 25-18-15-12-10-8-6-4-2-1 (sem ponto pela volta mais rápida). Todos os rivais da lista têm de cumprir a condição. Com empate em pontos decide o número de vitórias.</p>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Table title="Pilotos" rows={drivers.map((d: ChampRow) => ({ key: d.code, pos: d.posNow, start: pre ? d.posNow : d.posStart, colour: d.colour, label: d.code, sub: nice(d.name), points: d.pointsNow, delta: pre ? 0 : d.delta, hl: lead?.code === d.code }))} />
        <Table title="Construtores" rows={data.teams.map(t => ({ key: t.name, pos: t.posNow, start: pre ? t.posNow : t.posStart, colour: t.colour, label: t.name, points: t.pointsNow, delta: pre ? 0 : t.delta }))} />
      </div>

      <p className="text-[11px] text-gray-600">
        Projecção com a ordem actual da corrida (dados OpenF1). Os pontos oficiais só se confirmam depois da corrida e de eventuais penalizações.
      </p>
    </div>
  )
}
