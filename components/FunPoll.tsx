'use client'

import { useEffect, useState } from 'react'
import { getDriverPhoto } from '@/lib/gp-questions'

interface PollOption { code: string; name: string; team: string; colour: string; pts: number }
interface PollData {
  slug: string; title: string; question: string; note: string | null; options: PollOption[]
  closesAt: number; serverNow: number; closed: boolean; result: string | null
  counts: Record<string, number>; total: number; mine: string | null; voters: Record<string, string[]> | null; loggedIn?: boolean
}

function Countdown({ ms }: { ms: number }) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  const units = [{ v: d, l: 'DIAS' }, { v: h, l: 'HRS' }, { v: m, l: 'MIN' }, { v: sec, l: 'SEG' }]
  return (
    <div className="flex items-center gap-1.5">
      {units.map((u, i) => (
        <div key={u.l} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-gray-600 font-black">:</span>}
          <div className="text-center">
            <div className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 min-w-[40px]"><span className="text-xl font-black tabular-nums">{String(u.v).padStart(2, '0')}</span></div>
            <div className="text-[8px] text-gray-500 font-bold tracking-widest mt-0.5">{u.l}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// A light-hearted poll on the home page: pick the runner-up of the drivers' championship. Editable until it closes.
export default function FunPoll({ slug = 'segundo-lugar-2026' }: { slug?: string }) {
  const [data, setData] = useState<PollData | null>(null)
  const [skew, setSkew] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  function apply(j: PollData) { setData(j); setSkew(j.serverNow - Date.now()) }

  useEffect(() => {
    let stop = false
    fetch(`/api/fun-poll?slug=${slug}`, { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(j => { if (!stop && j) apply(j) }).catch(() => {})
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => { stop = true; clearInterval(id) }
  }, [slug])

  if (!data) return null
  const left = data.closesAt - (now + skew)
  const closed = data.closed || left <= 0
  const max = Math.max(1, ...Object.values(data.counts))

  async function vote(code: string) {
    if (closed || busy) return
    if (data && !data.loggedIn) { setErr('Faz login para votar.'); return }
    setBusy(code); setErr('')
    try {
      const r = await fetch('/api/fun-poll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, choice: code }) })
      const j = await r.json()
      if (!r.ok) setErr(j.error ?? 'Não foi possível guardar o voto.')
      else apply({ ...j, loggedIn: true })
    } catch { setErr('Sem ligação — tenta de novo.') }
    setBusy(null)
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-purple-400/40 bg-gradient-to-br from-purple-900/30 via-gray-900 to-gray-900 p-5 space-y-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0 w-full sm:w-auto sm:flex-1">
          <span className="inline-block text-[10px] font-black tracking-widest rounded-full bg-purple-500/25 text-purple-200 border border-purple-400/50 px-2.5 py-0.5 mb-2">🎲 SÓ POR BRINCADEIRA</span>
          <h2 className="text-xl font-black leading-tight">{data.title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{data.question}</p>
        </div>
        {!closed && (
          <div className="shrink-0 w-full sm:w-auto">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Fecha no arranque do GP do México</p>
            <Countdown ms={left} />
          </div>
        )}
        {closed && <span className="shrink-0 text-xs font-black px-3 py-1 rounded-full bg-gray-700 text-gray-200">{data.result ? '🏁 RESULTADO' : '🔒 VOTAÇÕES ENCERRADAS'}</span>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data.options.map(o => {
          const mine = data.mine === o.code
          const win = data.result === o.code
          const photo = getDriverPhoto(o.code)
          const n = data.counts[o.code] ?? 0
          const pct = data.total ? Math.round((n / data.total) * 100) : 0
          return (
            <button key={o.code} type="button" onClick={() => vote(o.code)} disabled={closed || !!busy}
              className={`relative text-left rounded-xl border-2 overflow-hidden transition-all ${closed ? 'cursor-default' : 'hover:scale-[1.02] active:scale-95'} ${win ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,.35)]' : mine ? 'border-green-400 shadow-[0_0_24px_rgba(74,222,128,.3)]' : 'border-white/10'} bg-black/40`}>
              <div className="relative h-28 sm:h-32" style={{ background: `linear-gradient(160deg, ${o.colour}55, transparent)` }}>
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={o.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pt-8 pb-1.5">
                  <div className="font-black text-lg leading-none">{o.code}</div>
                  <div className="text-[10px] text-gray-300 leading-tight">{o.name}</div>
                </div>
                {mine && <span className="absolute top-1.5 right-1.5 text-[10px] font-black bg-green-500 text-black rounded-full px-2 py-0.5">O TEU VOTO</span>}
                {win && <span className="absolute top-1.5 left-1.5 text-[10px] font-black bg-yellow-400 text-black rounded-full px-2 py-0.5">🥈 2.º</span>}
              </div>
              <div className="px-2.5 py-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-gray-400"><span>{o.team}</span><span className="tabular-nums font-bold text-gray-200">{o.pts} pts</span></div>
                {(data.mine || closed) && (
                  <div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(n / max) * 100}%`, background: o.colour }} /></div>
                    <div className="text-[10px] text-gray-400 mt-0.5 tabular-nums">{n} {n === 1 ? 'voto' : 'votos'} · {pct}%</div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        {err && <p className="text-red-400 font-semibold">⚠️ {err}</p>}
        {!closed && !data.mine && <p>👆 Toca num piloto para votar. <b className="text-gray-300">Podes mudar de ideias até ao arranque da corrida.</b></p>}
        {!closed && data.mine && <p>✅ Voto guardado. Mudaste de ideias? Toca noutro piloto até ao arranque do GP do México. <span className="text-gray-500">({data.total} {data.total === 1 ? 'voto' : 'votos'} até agora)</span></p>}
        {closed && !data.result && <p>Os resultados saem quando o campeonato terminar (Abu Dhabi, 6 Dez).</p>}
        {data.result && <p className="text-yellow-300 font-bold">🥈 Segundo classificado: {data.options.find(o => o.code === data.result)?.name}. {data.voters?.[data.result]?.length ? `Acertaram: ${data.voters[data.result].join(', ')}.` : 'Ninguém acertou!'}</p>}
        <p className="text-gray-500">{data.note}</p>
      </div>

      {closed && data.voters && (
        <div className="space-y-1">
          {data.options.map(o => (
            <div key={o.code}>
              <button type="button" onClick={() => setOpen(open === o.code ? null : o.code)} className="text-[11px] text-purple-300 underline underline-offset-2">
                {open === o.code ? 'Esconder' : 'Ver'} quem votou em {o.code} ({data.voters?.[o.code]?.length ?? 0})
              </button>
              {open === o.code && <p className="text-xs text-gray-300 mt-0.5">{data.voters?.[o.code]?.length ? data.voters[o.code].join(', ') : 'Ninguém.'}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
