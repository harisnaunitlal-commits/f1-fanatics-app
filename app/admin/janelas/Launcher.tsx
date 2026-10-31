'use client'

import { useEffect, useMemo, useState } from 'react'
import { WINDOWS, WINDOW_GROUPS, SLOTS, type WindowDef, type WindowGroup } from '@/lib/telemetry/windows'
import { wallScript } from '@/lib/telemetry/wall-script'

interface Cfg { picked: string[]; drivers: string[]; zoom: number; header: boolean; black: boolean; place: Record<string, { screen: number; slot: string }> }
const KEY = 'f1w-launcher-v1'
const DEFAULT: Cfg = { picked: [], drivers: [], zoom: 1, header: true, black: false, place: {} }

interface Drv { code: string; name: string; colour: string }

export default function Launcher({ origin }: { origin: string }) {
  const [cfg, setCfg] = useState<Cfg>(DEFAULT)
  const [loaded, setLoaded] = useState(false)
  const [drivers, setDrivers] = useState<Drv[]>([])
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setCfg({ ...DEFAULT, ...JSON.parse(raw) }) } catch { /* first time */ }
    setLoaded(true)
    fetch('/api/telemetria/state?full=1', { cache: 'no-store' }).then(r => r.json()).then(j => {
      if (Array.isArray(j.drivers)) setDrivers(j.drivers.map((d: Drv) => ({ code: d.code, name: d.name, colour: d.colour })))
    }).catch(() => { /* chips are optional */ })
  }, [])
  useEffect(() => { if (loaded) { try { localStorage.setItem(KEY, JSON.stringify(cfg)) } catch { /* private mode */ } } }, [cfg, loaded])

  const patch = (p: Partial<Cfg>) => setCfg(c => ({ ...c, ...p }))
  const togglePick = (id: string) => patch({ picked: cfg.picked.includes(id) ? cfg.picked.filter(x => x !== id) : [...cfg.picked, id] })
  const toggleDriver = (code: string) => patch({ drivers: cfg.drivers.includes(code) ? cfg.drivers.filter(x => x !== code) : [...cfg.drivers, code].slice(-4) })
  const place = (id: string) => cfg.place[id] ?? { screen: 1, slot: 'full' }
  const setPlace = (id: string, p: Partial<{ screen: number; slot: string }>) => patch({ place: { ...cfg.place, [id]: { ...place(id), ...p } } })

  const pathFor = (w: WindowDef): string => {
    const q: string[] = []
    if (w.needsDrivers && cfg.drivers.length) q.push(`d=${cfg.drivers.join(',')}`)
    if (cfg.zoom !== 1) q.push(`z=${cfg.zoom}`)
    if (!cfg.header) q.push('h=0')
    if (cfg.black) q.push('bg=black')
    return `/janela/${w.id}${q.length ? `?${q.join('&')}` : ''}`
  }

  const open = (w: WindowDef, i = 0) => {
    const left = 40 + i * 36, top = 40 + i * 36
    const win = window.open(pathFor(w), `f1w-${w.id}`, `popup=yes,width=${w.w},height=${w.h},left=${left},top=${top}`)
    if (!win) setMsg('O navegador bloqueou a janela. Permite pop-ups para este site (ícone na barra de endereço) e tenta outra vez.')
  }
  const openPicked = () => {
    setMsg(null)
    WINDOWS.filter(w => cfg.picked.includes(w.id)).forEach((w, i) => open(w, i))
  }

  const picked = useMemo(() => WINDOWS.filter(w => cfg.picked.includes(w.id)), [cfg.picked])
  const download = () => {
    const text = wallScript(picked.map(w => ({ id: w.id, path: pathFor(w), screen: place(w.id).screen, slot: place(w.id).slot })), origin)
    const blob = new Blob(['﻿', text.replace(/\r?\n/g, '\r\n')], { type: 'text/plain;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'f1-janelas.ps1'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  }

  const groups = (Object.keys(WINDOW_GROUPS) as WindowGroup[]).map(g => ({ g, items: WINDOWS.filter(w => w.group === g) }))
  const needsDrivers = picked.some(w => w.needsDrivers)

  return (
    <div className="space-y-6 pb-28">
      <div className="card space-y-4">
        <div>
          <h2 className="font-bold mb-1">Pilotos para as janelas que comparam ou mostram um piloto</h2>
          <p className="text-xs text-gray-400 mb-2">Até 4. Os 2 primeiros são os da comparação de telemetria; o 1.º é o da ficha de piloto. Se não escolheres, usa o teu piloto favorito.</p>
          {drivers.length === 0 ? (
            <input className="input" placeholder="ex.: VER, LEC" value={cfg.drivers.join(', ')} onChange={e => patch({ drivers: e.target.value.split(/[ ,]+/).map(x => x.toUpperCase()).filter(x => /^[A-Z]{3}$/.test(x)).slice(0, 4) })} />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {drivers.map(d => {
                const idx = cfg.drivers.indexOf(d.code)
                return (
                  <button key={d.code} type="button" onClick={() => toggleDriver(d.code)} title={d.name}
                    className={`px-2.5 py-1 rounded-lg text-sm font-black border-2 transition-colors ${idx >= 0 ? 'bg-white/10 text-white' : 'border-transparent bg-black/30 text-gray-400 hover:text-white'}`}
                    style={idx >= 0 ? { borderColor: d.colour } : undefined}>
                    {d.code}{idx >= 0 && <span className="ml-1 text-[10px] text-yellow-300">{idx + 1}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <label className="flex items-center gap-2">Zoom
            <select className="bg-f1dark border border-gray-600 rounded px-2 py-1" value={cfg.zoom} onChange={e => patch({ zoom: Number(e.target.value) })}>
              {[0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2].map(z => <option key={z} value={z}>{Math.round(z * 100)}%</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={cfg.header} onChange={e => patch({ header: e.target.checked })} /> Faixa com o nome da janela</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={cfg.black} onChange={e => patch({ black: e.target.checked })} /> Fundo preto puro</label>
        </div>
      </div>

      {msg && <p className="text-sm text-orange-300 bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2">⚠️ {msg}</p>}

      {groups.map(({ g, items }) => (
        <section key={g}>
          <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-2">{WINDOW_GROUPS[g]}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(w => {
              const on = cfg.picked.includes(w.id)
              return (
                <div key={w.id} className={`card p-4 flex flex-col gap-2 ${on ? 'border-yellow-400/70' : ''}`}>
                  <div className="flex items-start gap-2">
                    <span className="text-2xl leading-none">{w.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold leading-tight">{w.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{w.desc}</div>
                    </div>
                    <input type="checkbox" className="mt-1 h-4 w-4" checked={on} onChange={() => togglePick(w.id)} aria-label={`Seleccionar ${w.title}`} />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {w.race && <span className="px-1.5 py-0.5 rounded bg-black/40 text-gray-400">só corrida/sprint</span>}
                    {w.needsDrivers && <span className="px-1.5 py-0.5 rounded bg-black/40 text-sky-300">usa os pilotos escolhidos</span>}
                  </div>
                  <button type="button" onClick={() => { setMsg(null); open(w) }} className="mt-auto self-start text-sm font-bold bg-f1red hover:bg-red-700 text-white rounded-lg px-3 py-1.5">Abrir janela</button>
                </div>
              )
            })}
          </div>
        </section>
      ))}

      {picked.length > 0 && (
        <section className="card space-y-3">
          <h2 className="font-bold">Montar o ecrã sem bordas (Windows)</h2>
          <p className="text-xs text-gray-400">O navegador não consegue tirar a barra de título de uma janela. Este script abre cada janela como aplicação, tira a barra e as bordas e põe-na no ecrã e no sítio que escolheres aqui. Os ecrãs são numerados da esquerda para a direita, como o Windows os vê.</p>
          <ul className="space-y-1.5">
            {picked.map(w => (
              <li key={w.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="w-56 truncate">{w.icon} {w.title}</span>
                <select className="bg-f1dark border border-gray-600 rounded px-2 py-1" value={place(w.id).screen} onChange={e => setPlace(w.id, { screen: Number(e.target.value) })}>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>Ecrã {n}</option>)}
                </select>
                <select className="bg-f1dark border border-gray-600 rounded px-2 py-1" value={place(w.id).slot} onChange={e => setPlace(w.id, { slot: e.target.value })}>
                  {SLOTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </li>
            ))}
          </ul>
          <button type="button" onClick={download} className="text-sm font-bold bg-white/10 hover:bg-white/20 rounded-lg px-4 py-2">⬇️ Descarregar f1-janelas.ps1</button>
          <ol className="text-xs text-gray-400 list-decimal pl-5 space-y-0.5">
            <li>Guarda o ficheiro, clica nele com o botão direito e escolhe <b className="text-gray-200">Executar com o PowerShell</b>.</li>
            <li>Na primeira vez, as janelas pedem o login (usa a tua conta de admin, numa delas) e voltas a executar o script. Fica guardado.</li>
            <li>Para ver os ecrãs que o Windows detecta: <code className="text-gray-300">.\f1-janelas.ps1 -Ecras</code> · para fechar tudo: <code className="text-gray-300">.\f1-janelas.ps1 -Fechar</code></li>
            <li>Sem barra de título não se arrasta com o rato: usa <b className="text-gray-200">Win + setas</b> ou volta a executar o script com outro sítio.</li>
          </ol>
        </section>
      )}

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-700 bg-f1dark/95 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center gap-3">
          <span className="text-sm text-gray-300">{picked.length} seleccionada{picked.length === 1 ? '' : 's'}{needsDrivers && cfg.drivers.length === 0 ? ' · escolhe pilotos para a comparação' : ''}</span>
          <button type="button" disabled={picked.length === 0} onClick={openPicked} className="ml-auto text-sm font-bold bg-f1red hover:bg-red-700 disabled:opacity-40 text-white rounded-lg px-4 py-2">Abrir seleccionadas</button>
          <button type="button" disabled={picked.length === 0} onClick={() => patch({ picked: [] })} className="text-sm text-gray-400 hover:text-white disabled:opacity-40">Limpar</button>
        </div>
      </div>
    </div>
  )
}
