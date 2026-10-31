'use client'

import { useEffect, useState } from 'react'
import type { RadioResponse } from '@/lib/telemetry/radio'

const clock = (iso: string) => new Date(iso).toLocaleTimeString('pt', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

// Team radio as text: English (original, blue) and Portuguese (translation, green) side by side.
export function RadioPanel({ isAdmin }: { isAdmin: boolean }) {
  const [data, setData] = useState<RadioResponse | null>(null)

  useEffect(() => {
    let stop = false
    let busy = false
    async function tick() {
      if (document.hidden || busy) return
      busy = true
      try {
        const r = await fetch('/api/telemetria/radio', { cache: 'no-store' })
        if (!stop && r.ok) setData(await r.json() as RadioResponse)
      } catch { /* keep the last copy */ }
      busy = false
    }
    tick()
    const id = setInterval(tick, 12_000)
    return () => { stop = true; clearInterval(id) }
  }, [])

  if (!data || !data.enabled) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
        <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/40">🇬🇧 Inglês — original</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/40">🇲🇿 Português — tradução</span>
        {data.pending > 0 && <span className="text-gray-400 font-semibold">⏳ {data.pending} a transcrever…</span>}
      </div>

      {!data.configured && isAdmin && (
        <p className="text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-3 py-2">⚙️ Falta a chave <code>OPENAI_API_KEY</code> no Vercel — sem ela não há transcrição.</p>
      )}
      {data.note && isAdmin && <p className="text-xs text-orange-300">⚠️ {data.note}</p>}

      {data.items.length === 0 ? (
        <p className="text-sm text-gray-500">Ainda sem rádios das equipas Mercedes, Red Bull, Ferrari e McLaren nesta sessão. Só aparecem as mensagens que a transmissão da F1 escolhe.</p>
      ) : (
        <ul className="space-y-2">
          {data.items.map(r => (
            <li key={r.id} className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/30 text-xs">
                <span className="w-1 h-4 rounded-sm" style={{ background: r.colour }} />
                <b className="tracking-wide">{r.code}</b>
                <span className="text-gray-500">{r.team}</span>
                <span className="ml-auto text-gray-500 tabular-nums">{clock(r.at)}</span>
              </div>
              <div className="px-3 py-2 border-l-4 border-sky-400/70 bg-sky-500/[0.06]">
                <div className="text-[9px] font-black tracking-widest text-sky-300">EN</div>
                <p className="text-sm text-sky-50 italic">“{r.en}”</p>
              </div>
              {r.pt && (
                <div className="px-3 py-2 border-l-4 border-emerald-400/70 bg-emerald-500/[0.07]">
                  <div className="text-[9px] font-black tracking-widest text-emerald-300">PT</div>
                  <p className="text-sm text-emerald-50 font-semibold">{r.pt}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[10px] text-gray-600">Transcrição automática (pode ter erros, sobretudo com ruído do motor). Só as mensagens escolhidas pela transmissão da F1, dos pilotos Mercedes, Red Bull, Ferrari e McLaren.</p>
    </div>
  )
}
