'use client'

import { useCallback, useEffect, useState } from 'react'
import { sceneTime, panelOn, type PanelKey, type Scene, type StateResponse } from '@/lib/telemetry/shared'

export interface SessionOpt { key: number; label: string; start: string; end: string; gpGuess: number | null }
export interface GpOpt { id: number; label: string }

const PANELS: { key: PanelKey; label: string }[] = [
  { key: 'tower', label: 'Tabela de tempos' },
  { key: 'ours', label: 'Os nossos (piloto favorito + pontos F1 Play)' },
  { key: 'map', label: 'Mapa da pista com os carros' },
  { key: 'championship', label: 'Campeonato em directo (corridas e sprints)' },
  { key: 'strategy', label: 'Estratégia (pneus, paragens, undercut, "se parasse agora")' },
  { key: 'tyres', label: 'Pneus do fim-de-semana (usados em sessões anteriores + alocação)' },
  { key: 'compare', label: 'Telemetria de piloto: comparar 2 pilotos (velocidade, acelerador, travão, mudança)' },
  { key: 'positions', label: 'Gráfico de posições + ultrapassagens (corridas)' },
  { key: 'laps', label: 'Análise de voltas (sectores, velocidade máxima, ritmo)' },
  { key: 'control', label: 'Direcção de corrida + penalizações' },
]
const SPEEDS = [1, 2, 5, 10, 20, 30]

function mmss(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  return `${Math.floor(s / 3600) ? `${Math.floor(s / 3600)}:` : ''}${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function ControlRoom({ initialScene, sessions, gps, liveReady }: { initialScene: Scene; sessions: SessionOpt[]; gps: GpOpt[]; liveReady: boolean }) {
  const [scene, setScene] = useState<Scene>(initialScene)
  const [preview, setPreview] = useState<StateResponse | null>(null)
  const [now, setNow] = useState(Date.now())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [banner, setBanner] = useState(initialScene.banner ?? '')
  const [totalLaps, setTotalLaps] = useState(initialScene.total_laps ? String(initialScene.total_laps) : '')
  const [drag, setDrag] = useState<number | null>(null)
  const [alloc, setAlloc] = useState({ SOFT: String(initialScene.tyre_allocation?.SOFT ?? ''), MEDIUM: String(initialScene.tyre_allocation?.MEDIUM ?? ''), HARD: String(initialScene.tyre_allocation?.HARD ?? '') })
  const [checking, setChecking] = useState(false)
  const [checkMsg, setCheckMsg] = useState('')

  const session = sessions.find(s => s.key === scene.session_key)
  const startMs = session ? Date.parse(session.start) : 0
  const endMs = session ? Date.parse(session.end) : 0

  const call = useCallback(async (action: string, body: Record<string, unknown> = {}) => {
    setBusy(true); setError('')
    try {
      const res = await fetch('/api/admin/telemetria/scene', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) })
      const j = await res.json() as { scene?: Scene; error?: string }
      if (!res.ok || !j.scene) setError(j.error ?? `Erro ${res.status}`)
      else setScene(j.scene)
    } catch { setError('Sem ligação ao servidor.') }
    setBusy(false)
  }, [])

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  useEffect(() => {
    let stop = false
    async function load() {
      try { const r = await fetch('/api/telemetria/state', { cache: 'no-store' }); const j = await r.json() as StateResponse; if (!stop) setPreview(j) } catch { /* keep last */ }
    }
    load(); const id = setInterval(load, 5000)
    return () => { stop = true; clearInterval(id) }
  }, [scene.updated_at])

  const tNow = scene.session_key ? sceneTime(scene, now, endMs || undefined) : now
  const elapsed = startMs ? (tNow - startMs) / 1000 : 0
  const duration = endMs && startMs ? (endMs - startMs) / 1000 : 0
  const isReplay = scene.mode === 'replay'

  const seekBy = (deltaSec: number) => call('seek', { to: new Date(Math.min(Math.max(tNow + deltaSec * 1000, startMs), endMs)).toISOString() })
  const drivers = preview?.drivers ?? []
  const st = preview?.state

  return (
    <div className="space-y-4 max-w-3xl">
      {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">⚠️ {error}</p>}

      <div className="card space-y-3">
        <h2 className="font-bold">1 · Sessão</h2>
        <div>
          <label className="label">Sessão do OpenF1</label>
          <select className="select" value={scene.session_key ?? ''} disabled={busy}
            onChange={e => { const k = Number(e.target.value); const s = sessions.find(x => x.key === k); call('set', { session_key: k, ...(s?.gpGuess ? { gp_id: s.gpGuess } : {}) }) }}>
            <option value="">Escolhe a sessão…</option>
            {sessions.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">GP da nossa app (para os pontos F1 Play)</label>
            <select className="select" value={scene.gp_id ?? ''} disabled={busy} onChange={e => call('set', { gp_id: e.target.value ? Number(e.target.value) : null })}>
              <option value="">— nenhum —</option>
              {gps.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Total de voltas (corrida)</label>
            <input className="input" inputMode="numeric" placeholder="ex.: 56" value={totalLaps}
              onChange={e => setTotalLaps(e.target.value.replace(/\D/g, ''))}
              onBlur={() => call('set', { total_laps: totalLaps ? Number(totalLaps) : null })} />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-bold">2 · Modo</h2>
        <div className="flex gap-2">
          <button disabled={busy} onClick={() => call('set', { mode: 'replay' })} className={`px-4 py-2 rounded-lg text-sm font-bold ${isReplay ? 'bg-f1red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>↺ Replay</button>
          <button disabled={busy || !liveReady} onClick={() => call('set', { mode: 'live' })} className={`px-4 py-2 rounded-lg text-sm font-bold ${!isReplay ? 'bg-f1red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'} disabled:opacity-40`}>● Ao vivo</button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={busy || checking} onClick={async () => {
            setChecking(true); setCheckMsg('')
            try {
              const r = await fetch('/api/admin/telemetria/check', { cache: 'no-store' })
              const j = await r.json() as { configured?: boolean; ok?: boolean; status?: number; error?: string }
              setCheckMsg(j.error ? `⚠️ ${j.error}` : !j.configured ? '⚠️ Variáveis OPENF1_USERNAME/OPENF1_PASSWORD em falta.' : j.ok ? '✅ Credenciais válidas — o OpenF1 aceitou o login.' : `❌ O OpenF1 recusou o login${j.status ? ` (HTTP ${j.status})` : ''}. Confirma o email e a palavra-passe no Vercel.`)
            } catch { setCheckMsg('⚠️ Sem ligação ao servidor.') }
            setChecking(false)
          }} className="btn-secondary">{checking ? 'A testar…' : '🔑 Testar credenciais OpenF1'}</button>
          {checkMsg && <span className="text-sm">{checkMsg}</span>}
        </div>
        {!liveReady && <p className="text-xs text-yellow-300 bg-yellow-900/20 rounded-lg px-3 py-2">O modo ao vivo precisa das variáveis <code>OPENF1_USERNAME</code> e <code>OPENF1_PASSWORD</code> no Vercel (Settings → Environment Variables, como <b>Secret</b>) e um redeploy. Nunca as escrevas no chat.</p>}

        {isReplay && session && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {scene.replay_playing
                ? <button disabled={busy} onClick={() => call('pause')} className="btn-secondary">⏸ Pausa</button>
                : <button disabled={busy} onClick={() => call('play')} className="btn-primary">▶ Play</button>}
              <select className="select !w-auto" value={scene.replay_speed} disabled={busy} onChange={e => call('speed', { speed: Number(e.target.value) })}>
                {SPEEDS.map(v => <option key={v} value={v}>{v}×</option>)}
              </select>
              <button disabled={busy} onClick={() => seekBy(-300)} className="btn-secondary">−5 min</button>
              <button disabled={busy} onClick={() => seekBy(-60)} className="btn-secondary">−1 min</button>
              <button disabled={busy} onClick={() => seekBy(60)} className="btn-secondary">+1 min</button>
              <button disabled={busy} onClick={() => seekBy(300)} className="btn-secondary">+5 min</button>
              <span className="ml-auto text-sm tabular-nums text-gray-300">{mmss(drag ?? elapsed)} / {mmss(duration)}</span>
            </div>
            <input type="range" className="w-full accent-red-600" min={0} max={Math.max(duration, 1)} step={5} value={drag ?? Math.min(elapsed, duration)}
              onChange={e => setDrag(Number(e.target.value))}
              onPointerUp={() => { if (drag !== null) { call('seek', { to: new Date(startMs + drag * 1000).toISOString() }); setDrag(null) } }}
              onKeyUp={() => { if (drag !== null) { call('seek', { to: new Date(startMs + drag * 1000).toISOString() }); setDrag(null) } }} />
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h2 className="font-bold">3 · O que os membros vêem</h2>
        <div className="space-y-2">
          {PANELS.map(p => (
            <label key={p.key} className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-red-600" checked={panelOn(scene.panels, p.key)} disabled={busy} onChange={e => call('set', { panels: { ...scene.panels, [p.key]: e.target.checked } })} />
              {p.label}
            </label>
          ))}
        </div>
        <div>
          <label className="label">Pilotos em destaque (máx. 4) — aparecem realçados e com o cálculo &quot;se parasse agora&quot;</label>
          <div className="flex flex-wrap gap-2">
            {drivers.length === 0 && <span className="text-xs text-gray-500">Escolhe uma sessão para ver os pilotos.</span>}
            {drivers.map(d => {
              const on = scene.featured.includes(d.code)
              return (
                <button key={d.code} disabled={busy || (!on && scene.featured.length >= 4)}
                  onClick={() => call('set', { featured: on ? scene.featured.filter(c => c !== d.code) : [...scene.featured, d.code] })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black border-2 disabled:opacity-30 ${on ? 'bg-white/10 text-white' : 'border-transparent bg-gray-800 text-gray-400 hover:text-white'}`}
                  style={on ? { borderColor: d.colour } : undefined}>{d.code}</button>
              )
            })}
          </div>
        </div>
        <div>
          <label className="label">Alocação de pneus do fim-de-semana, por piloto (anúncio da Pirelli) — opcional</label>
          <div className="flex flex-wrap items-center gap-3">
            {([['SOFT', 'Macios'], ['MEDIUM', 'Médios'], ['HARD', 'Duros']] as const).map(([k, name]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-gray-300">
                {name}
                <input className="input !w-16 text-center" inputMode="numeric" placeholder="0" value={alloc[k]} disabled={busy}
                  onChange={e => setAlloc({ ...alloc, [k]: e.target.value.replace(/D/g, '').slice(0, 2) })} />
              </label>
            ))}
            <button disabled={busy} className="btn-secondary" onClick={() => call('set', { tyre_allocation: { SOFT: Number(alloc.SOFT) || 0, MEDIUM: Number(alloc.MEDIUM) || 0, HARD: Number(alloc.HARD) || 0 } })}>Aplicar</button>
            <button disabled={busy} className="btn-secondary" onClick={() => { setAlloc({ SOFT: '', MEDIUM: '', HARD: '' }); call('set', { tyre_allocation: null }) }}>Limpar</button>
          </div>
        </div>
        <div>
          <label className="label">Telemetria de piloto: compara os 2 <b>primeiros</b> pilotos destacados ({scene.featured.slice(0, 2).join(' vs ') || 'escolhe 2'}) — usando</label>
          <div className="flex gap-2">
            {(['best', 'last'] as const).map(m => (
              <button key={m} disabled={busy} onClick={() => call('set', { compare_mode: m })}
                className={`px-3 py-1.5 rounded-lg text-sm font-bold ${scene.compare_mode === m ? 'bg-f1red text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}>
                {m === 'best' ? 'Melhor volta de cada um' : 'Última volta de cada um'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Mensagem do director (aparece em destaque no topo)</label>
          <div className="flex gap-2">
            <input className="input" maxLength={160} placeholder='ex.: "Hamilton vai parar — janela de undercut aberta!"' value={banner} onChange={e => setBanner(e.target.value)} />
            <button disabled={busy} onClick={() => call('set', { banner: banner.trim() || null })} className="btn-primary whitespace-nowrap">Publicar</button>
            <button disabled={busy} onClick={() => { setBanner(''); call('set', { banner: null }) }} className="btn-secondary">Limpar</button>
          </div>
        </div>
      </div>

      <div className="card space-y-2 border-yellow-700/40">
        <h2 className="font-bold">4 · Abrir aos membros</h2>
        <p className="text-xs text-gray-400">O plano OpenF1 Sponsor é <b>uso pessoal</b>. Antes de abrires aos membros, confirma com o OpenF1 que podes mostrar os dados na nossa comunidade (sem fins lucrativos). Até lá, só tu vês <code>/telemetria</code>.</p>
        <label className="flex items-center gap-3 text-sm cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-red-600" checked={scene.members_enabled} disabled={busy} onChange={e => call('set', { members_enabled: e.target.checked })} />
          <span className={scene.members_enabled ? 'text-green-400 font-bold' : 'text-gray-300'}>{scene.members_enabled ? 'Visível para todos os membros' : 'Só administradores'}</span>
        </label>
      </div>

      <div className="card">
        <h2 className="font-bold mb-2">Pré-visualização</h2>
        {!preview?.ready || !st ? <p className="text-sm text-gray-400">{preview?.message ?? 'A carregar…'}</p> : (
          <div className="text-sm text-gray-300 space-y-1">
            <div>Estado: <b>{st.status}</b> · Volta <b>{st.leaderLap}{st.totalLaps ? `/${st.totalLaps}` : ''}</b> · Líder: <b>{st.tower[0]?.code ?? '—'}</b></div>
            <div className="text-xs text-gray-500">Pista {st.weather ? `${st.weather.track}°` : '—'} · SC {st.events.sc} · VSC {st.events.vsc} · RF {st.events.red} · 1º a desistir: {st.firstRetirement ?? '—'}</div>
          </div>
        )}
      </div>
    </div>
  )
}
