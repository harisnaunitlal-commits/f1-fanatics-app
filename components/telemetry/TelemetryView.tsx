'use client'

import { useEffect, useState } from 'react'
import { flagSrc, panelOn, type StateResponse } from '@/lib/telemetry/shared'
import { Section, fmtLap } from './ui'
import { TrackMap } from './TrackMap'
import { TelemetryCompare } from './TelemetryCompare'
import { PositionChart, OvertakeFeed } from './PositionChart'
import { LapAnalysis } from './LapAnalysis'
import { Championship } from './Championship'
import type { TowerRow, TrackStatus, RcItem, RcKind, TelemetryState, RejoinSim } from '@/lib/telemetry/engine'

const POLL_MS = 5000

const STATUS: Record<TrackStatus, { label: string; cls: string }> = {
  NOT_STARTED: { label: 'ANTES DO INÍCIO', cls: 'bg-gray-700 text-gray-100' },
  GREEN: { label: 'PISTA LIVRE', cls: 'bg-green-600 text-white' },
  VSC: { label: 'VIRTUAL SAFETY CAR', cls: 'bg-yellow-400 text-black' },
  VSC_ENDING: { label: 'VSC A TERMINAR', cls: 'bg-yellow-300 text-black' },
  SC: { label: 'SAFETY CAR', cls: 'bg-orange-500 text-black' },
  SC_ENDING: { label: 'SC ENTRA NA BOX', cls: 'bg-orange-400 text-black' },
  RED: { label: 'BANDEIRA VERMELHA', cls: 'bg-red-600 text-white' },
  FINISHED: { label: 'BANDEIRA XADREZ', cls: 'bg-white text-black' },
}

const COMPOUND: Record<string, { letter: string; cls: string; bar: string }> = {
  SOFT: { letter: 'S', cls: 'border-red-500 text-red-400', bar: '#ef4444' },
  MEDIUM: { letter: 'M', cls: 'border-yellow-400 text-yellow-300', bar: '#facc15' },
  HARD: { letter: 'H', cls: 'border-gray-200 text-gray-100', bar: '#e5e7eb' },
  INTERMEDIATE: { letter: 'I', cls: 'border-green-500 text-green-400', bar: '#22c55e' },
  WET: { letter: 'W', cls: 'border-blue-500 text-blue-400', bar: '#3b82f6' },
}

const RC_ICON: Record<RcKind, string> = { flag: '🏁', safetycar: '🚗', penalty: '⚖️', investigation: '🔍', noted: '📝', cleared: '✅', deleted: '⏱️', info: 'ℹ️' }
const FLAG_ICON: Record<string, string> = { YELLOW: '🟡', 'DOUBLE YELLOW': '🟡🟡', GREEN: '🟢', CLEAR: '🟢', BLUE: '🔵', RED: '🔴', CHEQUERED: '🏁', 'BLACK AND WHITE': '⚫⚪', BLACK: '⚫' }

const clock = (iso: string) => new Date(iso).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function Tyre({ compound, age }: { compound: string | null; age: number | null }) {
  const c = compound ? COMPOUND[compound] : null
  if (!c) return <span className="text-gray-600">—</span>
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] font-black ${c.cls}`}>{c.letter}</span>
      <span className="text-xs text-gray-400 tabular-nums">{age ?? ''}</span>
    </span>
  )
}

function RejoinCard({ sim, row }: { sim: RejoinSim; row?: TowerRow }) {
  const lost = sim.toPos - sim.fromPos
  const tone = lost <= 0 ? 'text-green-400' : lost <= 2 ? 'text-yellow-300' : 'text-red-400'
  return (
    <div className="rounded-xl border border-gray-700/60 bg-black/30 p-3" style={{ borderLeft: `4px solid ${row?.colour ?? '#555'}` }}>
      <div className="flex items-baseline gap-2">
        <span className="font-black text-lg">{sim.code}</span>
        <span className="text-xs text-gray-500">P{sim.fromPos}</span>
        <span className="text-gray-600">→</span>
        <span className={`font-black text-lg ${tone}`}>P{sim.toPos}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wide text-gray-500">se parasse agora</span>
      </div>
      <div className="text-xs text-gray-300 mt-1.5 space-y-0.5">
        <div>Perde ~{sim.lossS.toFixed(0)} s na box</div>
        {sim.carAheadCode ? <div>Sai atrás de <b>{sim.carAheadCode}</b> ({sim.carAheadGapS?.toFixed(1)} s)</div> : <div>Sai na frente do pelotão</div>}
        {sim.carBehindCode && <div>Com <b>{sim.carBehindCode}</b> a {sim.carBehindGapS?.toFixed(1)} s atrás</div>}
      </div>
      <div className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${sim.cleanAir ? 'bg-green-900/50 text-green-300' : 'bg-orange-900/50 text-orange-300'}`}>
        {sim.cleanAir ? 'Ar limpo' : 'Apanha tráfego'}
      </div>
    </div>
  )
}

function Tower({ s, favCode, featured }: { s: TelemetryState; favCode: string | null; featured: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
            <th className="py-2 px-2 w-8 text-center">#</th>
            <th className="py-2 px-2 text-left">Piloto</th>
            <th className="py-2 px-2 text-right">Líder</th>
            <th className="py-2 px-2 text-right">Int.</th>
            <th className="py-2 px-2 text-right hidden sm:table-cell">Última</th>
            <th className="py-2 px-2 text-center">Pneu</th>
            <th className="py-2 px-2 text-center">Box</th>
          </tr>
        </thead>
        <tbody>
          {s.tower.map(r => {
            const mine = r.code === favCode
            const feat = featured.includes(r.code)
            const fl = s.fastestLap?.code === r.code
            return (
              <tr key={r.num} className={`border-b border-gray-800/50 ${r.out ? 'opacity-40' : ''} ${mine ? 'bg-yellow-400/10' : feat ? 'bg-white/[0.04]' : ''}`}>
                <td className="py-1.5 px-2 text-center font-bold tabular-nums text-gray-300">{r.pos}</td>
                <td className="py-1.5 px-2">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-1 h-5 rounded-sm shrink-0" style={{ background: r.colour }} />
                    <span className="font-black tracking-wide">{r.code}</span>
                    <span className="text-xs text-gray-500 hidden md:inline">{r.name.split(' ').slice(-1)[0]}</span>
                    {mine && <span className="text-[9px] font-bold text-yellow-300">★ TEU</span>}
                    {r.inPit && <span className="text-[9px] font-bold bg-blue-600 text-white px-1 rounded">BOX</span>}
                    {r.out && <span className="text-[9px] font-bold bg-red-700 text-white px-1 rounded">FORA</span>}
                    {fl && <span title="Volta mais rápida" className="text-purple-400 text-xs">⏱</span>}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums text-gray-200">{r.out ? '—' : r.gapLabel}</td>
                <td className="py-1.5 px-2 text-right tabular-nums text-gray-400">{r.out ? '—' : r.intervalLabel}</td>
                <td className={`py-1.5 px-2 text-right tabular-nums text-xs hidden sm:table-cell ${fl ? 'text-purple-400 font-bold' : 'text-gray-400'}`}>{fmtLap(r.lastLap)}</td>
                <td className="py-1.5 px-2 text-center"><Tyre compound={r.tyre} age={r.tyreAge} /></td>
                <td className="py-1.5 px-2 text-center tabular-nums text-gray-300">{r.stops}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StintTimeline({ s }: { s: TelemetryState }) {
  const total = Math.max(s.totalLaps ?? 0, s.leaderLap, 10)
  return (
    <div className="space-y-1">
      {s.tower.map(r => (
        <div key={r.num} className="flex items-center gap-2">
          <span className="w-9 text-xs font-black text-gray-300">{r.code}</span>
          <div className="relative h-4 flex-1 rounded bg-white/5 overflow-hidden">
            {r.stints.map((st, i) => {
              const end = st.lapEnd ?? Math.max(r.lap, st.lapStart)
              const left = ((st.lapStart - 1) / total) * 100
              const width = ((end - st.lapStart + 1) / total) * 100
              return <span key={i} className="absolute top-0 bottom-0 border-r border-black/60" style={{ left: `${left}%`, width: `${width}%`, background: (st.compound && COMPOUND[st.compound]?.bar) || '#555' }} title={`${st.compound ?? '?'} · voltas ${st.lapStart}–${end}`} />
            })}
          </div>
          <span className="w-14 text-right text-[11px] text-gray-500 tabular-nums">{r.degPerLap === null ? '' : `${r.degPerLap > 0 ? '+' : ''}${r.degPerLap.toFixed(2)}s/v`}</span>
        </div>
      ))}
      <div className="flex flex-wrap gap-3 pt-2 text-[11px] text-gray-400">
        {Object.entries(COMPOUND).map(([k, c]) => <span key={k} className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: c.bar }} />{k === 'SOFT' ? 'Macio' : k === 'MEDIUM' ? 'Médio' : k === 'HARD' ? 'Duro' : k === 'INTERMEDIATE' ? 'Intermédio' : 'Chuva'}</span>)}
        <span className="ml-auto">À direita: tendência de ritmo no stint (negativo = a ficar mais rápido)</span>
      </div>
    </div>
  )
}

function RcRow({ r }: { r: RcItem }) {
  const icon = r.kind === 'flag' ? FLAG_ICON[(r.flag ?? '').toUpperCase()] ?? '🏁' : RC_ICON[r.kind]
  return (
    <li className="flex gap-2 py-1.5 border-b border-gray-800/50 text-xs">
      <span className="w-6 text-center shrink-0">{icon}</span>
      <span className="text-gray-500 tabular-nums shrink-0 w-[88px]">{r.lap ? `V${r.lap} · ` : ''}{clock(r.date)}</span>
      <span className="text-gray-200 break-words min-w-0">{r.message.replace(/ \(\d{1,2}:\d{2}:\d{2}\)$/, '')}</span>
    </li>
  )
}

export default function TelemetryView({ endpoint = '/api/telemetria/state' }: { endpoint?: string }) {
  const [data, setData] = useState<StateResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let stop = false
    let busy = false
    async function tick() {
      if (document.hidden || busy) return
      busy = true
      try {
        const res = await fetch(endpoint, { cache: 'no-store' })
        const j = await res.json() as StateResponse
        if (stop) return
        setData(j); setErr(res.ok ? null : (j.message ?? `Erro ${res.status}`))
      } catch { if (!stop) setErr('Sem ligação ao servidor.') }
      busy = false
    }
    tick()
    const id = setInterval(tick, POLL_MS)
    return () => { stop = true; clearInterval(id) }
  }, [endpoint])

  if (!data) return <div className="card text-center text-gray-400 py-16">A ligar à telemetria…</div>
  if (!data.ready || !data.state || !data.scene || !data.session) {
    return (
      <div className="card text-center py-16">
        <div className="text-4xl mb-3">📡</div>
        <p className="text-gray-300 font-semibold">{data.message ?? err ?? 'Telemetria indisponível.'}</p>
      </div>
    )
  }

  const { state: s, scene, session, gp, play, favCode } = data
  const st = STATUS[s.status]
  const featured = scene.featured
  const favRow = favCode ? s.tower.find(r => r.code === favCode) : undefined
  const focus = Array.from(new Set([...(favCode ? [favCode] : []), ...featured]))
  const { outline, compare } = data
  const rejoinCodes = Array.from(new Set([...(favCode ? [favCode] : []), ...featured]))
  const rejoinList = (rejoinCodes.length ? rejoinCodes : s.tower.filter(r => !r.out).slice(0, 4).map(r => r.code))
    .map(c => s.rejoin.find(x => x.code === c)).filter((x): x is RejoinSim => !!x)

  return (
    <div className="space-y-4">
      {err && <div className="text-xs text-orange-300 bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2">⚠️ {err} — a mostrar os últimos dados recebidos.</div>}
      {!scene.members_enabled && data.isAdmin && <div className="text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2">👁️ Pré-visualização: os membros ainda não vêem esta página.</div>}

      {/* Header */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest">{session.country}</div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              {flagSrc(gp?.emoji) && <img src={flagSrc(gp?.emoji)!} alt="" className="w-8 h-5 rounded-[3px] object-cover ring-1 ring-white/15" />}
              {gp ? `GP ${gp.nome} · ` : ''}{session.name}
            </h1>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${scene.mode === 'live' ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-700 text-gray-100'}`}>
              {scene.mode === 'live' ? '● AO VIVO' : `↺ REPLAY${scene.replay_playing ? ` ${scene.replay_speed}×` : ' · PAUSA'}`}
            </span>
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
            <span className="text-sm font-black tabular-nums bg-black/40 rounded-lg px-3 py-1">VOLTA {s.leaderLap}{s.totalLaps ? `/${s.totalLaps}` : ''}</span>
            <span className="text-xs text-gray-500 tabular-nums">{clock(s.t)}</span>
          </div>
        </div>
        {s.weather && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-300">
            <span className="bg-black/30 rounded-md px-2 py-1">🌡️ Ar {s.weather.air.toFixed(0)}°</span>
            <span className="bg-black/30 rounded-md px-2 py-1">🛣️ Pista {s.weather.track.toFixed(0)}°{s.weather.trackTrend !== null && s.weather.trackTrend !== 0 ? ` (${s.weather.trackTrend > 0 ? '↗' : '↘'} ${Math.abs(s.weather.trackTrend)}°/10min)` : ''}</span>
            <span className="bg-black/30 rounded-md px-2 py-1">💧 {s.weather.humidity.toFixed(0)}%</span>
            <span className="bg-black/30 rounded-md px-2 py-1">💨 {s.weather.wind.toFixed(1)} m/s</span>
            <span className={`rounded-md px-2 py-1 ${s.weather.rain ? 'bg-blue-700 text-white font-bold' : 'bg-black/30'}`}>{s.weather.rain ? '🌧️ A CHOVER' : '☀️ Sem chuva'}</span>
          </div>
        )}
      </div>

      {scene.banner && (
        <div className="rounded-xl border-2 border-yellow-400/70 bg-yellow-400/10 px-4 py-3 text-yellow-100 font-semibold">📣 {scene.banner}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {panelOn(scene.panels, 'tower') && (
          <div className={panelOn(scene.panels, 'ours') ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <Section title="Tabela de tempos" hint={s.fastestLap ? `Volta mais rápida: ${s.fastestLap.code} ${fmtLap(s.fastestLap.time)} (V${s.fastestLap.lap})` : undefined}>
              <Tower s={s} favCode={favCode ?? null} featured={featured} />
            </Section>
          </div>
        )}

        {panelOn(scene.panels, 'ours') && (
          <aside className={`space-y-4 ${panelOn(scene.panels, 'tower') ? '' : 'lg:col-span-3'}`}>
            <Section title="O teu piloto">
              {favRow ? (
                <div>
                  <div className="flex items-baseline gap-2" style={{ borderLeft: `4px solid ${favRow.colour}`, paddingLeft: 10 }}>
                    <span className="text-3xl font-black">{favRow.code}</span>
                    <span className="text-sm text-gray-400">{favRow.name}</span>
                    <span className="ml-auto text-2xl font-black text-yellow-300">{favRow.out ? 'FORA' : `P${favRow.pos}`}</span>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                    <div className="bg-black/30 rounded-lg py-2"><dt className="text-gray-500">Líder</dt><dd className="font-bold">{favRow.gapLabel}</dd></div>
                    <div className="bg-black/30 rounded-lg py-2"><dt className="text-gray-500">Pneu</dt><dd><Tyre compound={favRow.tyre} age={favRow.tyreAge} /></dd></div>
                    <div className="bg-black/30 rounded-lg py-2"><dt className="text-gray-500">Boxes</dt><dd className="font-bold">{favRow.stops}</dd></div>
                  </dl>
                  {s.rejoin.find(x => x.code === favRow.code) && (
                    <p className="text-xs text-gray-300 mt-3">
                      Se parasse agora: <b className="text-white">P{s.rejoin.find(x => x.code === favRow.code)!.toPos}</b>
                      {s.rejoin.find(x => x.code === favRow.code)!.carAheadCode ? `, atrás de ${s.rejoin.find(x => x.code === favRow.code)!.carAheadCode}` : ''}.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Define o teu piloto favorito no perfil (ex.: <i>Hamilton</i> ou <i>HAM</i>) para o acompanhares aqui.</p>
              )}
            </Section>

            <Section title="Os teus pontos F1 Play" hint="provisórios — se a corrida acabasse agora">
              {!play ? (
                <p className="text-sm text-gray-400">Esta transmissão ainda não está ligada a um GP.</p>
              ) : !play.me ? (
                <p className="text-sm text-gray-400">Não submeteste previsões neste GP.</p>
              ) : (
                <div>
                  <div className="flex items-end gap-3">
                    <span className="text-5xl font-black text-yellow-300 tabular-nums">{play.me.total}</span>
                    <span className="text-sm text-gray-400 pb-1">pts{play.me.rank ? ` · #${play.me.rank} de ${play.participants}` : ''}</span>
                  </div>
                  <ul className="mt-3 divide-y divide-gray-800/60">
                    {play.me.lines.map(l => (
                      <li key={l.field} className="flex items-center gap-2 py-1 text-xs">
                        <span className="w-28 text-gray-400 truncate">{l.label}</span>
                        <span className="w-20 font-bold text-gray-200 truncate">{l.mine ?? '—'}</span>
                        <span className="w-20 text-gray-500 truncate">{l.field === 'p10_dotd' ? 'voto oficial' : (l.live ?? '—')}</span>
                        <span className={`ml-auto font-black ${l.pts > 0 ? 'text-green-400' : 'text-gray-600'}`}>{l.pts > 0 ? `+${l.pts}` : '·'}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-gray-500 mt-2">Colunas: pergunta · a tua resposta · estado agora. O Piloto do Dia só conta no fim.</p>
                </div>
              )}
            </Section>

            {play && play.closed && play.leaderboard.length > 0 && (
              <Section title="Classificação F1 Play em directo" hint="top 10">
                <ol className="space-y-1">
                  {play.leaderboard.map((l, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 ${l.isMe ? 'bg-yellow-400/10 border border-yellow-400/40' : ''} ${i === 10 ? 'mt-2' : ''}`}>
                      <span className="w-6 text-center font-bold text-gray-400 tabular-nums">{l.rank}</span>
                      {l.foto_url ? <img src={l.foto_url} alt="" className="w-6 h-6 rounded-full object-cover" /> : <span className="w-6 h-6 rounded-full bg-f1gray text-[10px] font-bold flex items-center justify-center">{l.nickname.charAt(0).toUpperCase()}</span>}
                      <span className="font-semibold truncate">{l.nickname}</span>
                      <span className="ml-auto font-black tabular-nums text-yellow-300">{l.total}</span>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </aside>
        )}
      </div>

      {panelOn(scene.panels, 'map') && (
        <Section title="Mapa da pista" hint={s.map.length ? `${s.map.filter(c => !c.out).length} carros em pista` : undefined}>
          <TrackMap outline={outline} cars={s.map} favCode={favCode ?? null} featured={featured} />
        </Section>
      )}

      {panelOn(scene.panels, 'championship') && s.championship && (
        <Section title="Campeonato em directo" hint="se a corrida acabasse agora">
          <Championship data={s.championship} favCode={favCode ?? null} featured={featured} />
        </Section>
      )}

      {panelOn(scene.panels, 'strategy') && (
        <Section title="Estratégia" hint="contas feitas com os tempos reais, não é IA">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Pneus e stints</h3>
                <StintTimeline s={s} />
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl bg-black/30 p-3 text-sm">
                <div className="text-xs text-gray-500 uppercase tracking-wide">Perda numa paragem</div>
                <div className="text-2xl font-black text-yellow-300">{s.pitLoss.nowS.toFixed(1)} s</div>
                <div className="text-[11px] text-gray-400">
                  {s.pitLoss.source === 'medida' ? `mediana de ${s.pitLoss.samples} paragens desta corrida (${s.pitLoss.greenS.toFixed(1)} s em pista livre)` : 'estimativa — ainda sem paragens medidas'}
                  {s.pitLoss.nowS !== s.pitLoss.greenS && ' · reduzida pelo VSC/SC'}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Janela de undercut</h3>
                {s.undercuts.length === 0 ? <p className="text-xs text-gray-500">Sem janelas abertas neste momento.</p> : (
                  <ul className="space-y-1">
                    {s.undercuts.slice(0, 6).map((u, i) => (
                      <li key={i} className="text-xs flex items-center gap-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${u.strength === 'forte' ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'}`}>{u.strength.toUpperCase()}</span>
                        <span><b>{u.attacker}</b> sobre <b>{u.target}</b> · {u.intervalS.toFixed(1)} s · pneus {u.attackerAge}v vs {u.targetAge}v</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-[10px] text-gray-600 mt-1">Regra prática: intervalo ≤ 2,5 s com pneus de pelo menos 8 voltas.</p>
              </div>
            </div>
          </div>
          {rejoinList.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Onde voltaria se parasse agora</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {rejoinList.map(r => <RejoinCard key={r.code} sim={r} row={s.tower.find(t => t.code === r.code)} />)}
              </div>
            </div>
          )}
        </Section>
      )}

      {panelOn(scene.panels, 'compare') && (
        <Section title="Telemetria de piloto" hint={compare ? (scene.compare_mode === 'last' ? 'última volta de cada um' : 'melhor volta de cada um') : undefined}>
          {compare ? <TelemetryCompare data={compare} /> : (
            <p className="text-sm text-gray-500">{featured.length < 2 ? 'O admin ainda não escolheu 2 pilotos em destaque para comparar.' : 'Ainda não há voltas completas destes pilotos para comparar.'}</p>
          )}
        </Section>
      )}

      {panelOn(scene.panels, 'positions') && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Gráfico de posições"><PositionChart lines={s.lapChart} highlight={focus} totalLaps={s.totalLaps} leaderLap={s.leaderLap} /></Section>
          </div>
          <Section title="Ultrapassagens"><OvertakeFeed items={s.overtakes} /></Section>
        </div>
      )}

      {panelOn(scene.panels, 'laps') && (
        <Section title="Análise de voltas" hint="sectores, velocidades e ritmo">
          <LapAnalysis s={s} focus={focus} />
        </Section>
      )}

      {panelOn(scene.panels, 'control') && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Direcção de corrida" hint={`SC ${s.events.sc} · VSC ${s.events.vsc} · Bandeira vermelha ${s.events.red}${s.deletedLaps ? ` · ⏱ ${s.deletedLaps} tempos anulados (limites da pista)` : ''}`}>
              {s.yellowSectors.length > 0 && <div className="mb-2 text-xs font-bold text-yellow-300">🟡 Amarela nos sectores: {s.yellowSectors.join(', ')}</div>}
              {s.raceControl.length === 0 ? <p className="text-xs text-gray-500">Sem mensagens ainda.</p> : <ul>{s.raceControl.map((r, i) => <RcRow key={i} r={r} />)}</ul>}
            </Section>
          </div>
          <div className="space-y-4">
            <Section title="Penalizações e incidentes">
              {s.penalties.length === 0 ? <p className="text-xs text-gray-500">Nenhuma até agora.</p> : <ul>{s.penalties.map((r, i) => <RcRow key={i} r={r} />)}</ul>}
            </Section>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-600 text-center">Dados: OpenF1 (openf1.org) · projecto não-oficial, sem ligação à Formula 1 · atraso em relação à TV pode variar</p>
    </div>
  )
}
