import type { MapCar } from '@/lib/telemetry/engine'
import type { Corner } from '@/lib/telemetry/circuit'

interface Box { x0: number; y0: number; x1: number; y1: number }
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

export function TrackMap({ outline, corners, pitLane, cars, favCode, featured, fill }: { outline: { x: number; y: number }[] | null | undefined; corners?: Corner[] | null; pitLane?: { x: number; y: number }[] | null; cars: MapCar[]; favCode: string | null; featured: string[]; fill?: boolean }) {
  const base = [...(outline ?? []), ...cars].map(p => ({ x: p.x, y: -p.y })) // y grows upwards in OpenF1, downwards in SVG
  if (base.length === 0) return <p className="text-sm text-gray-500">Sem posições dos carros neste momento.</p>

  const bx = base.map(p => p.x), by = base.map(p => p.y)
  const span0 = Math.max(Math.max(...bx) - Math.min(...bx), Math.max(...by) - Math.min(...by), 1)
  // numbered corners: the number sits a little outside the track, along the direction given by the circuit data
  const cn = (corners ?? []).map(c => {
    const a = (c.angle * Math.PI) / 180
    const d = span0 * 0.032
    return { n: c.n, x: c.x, y: -c.y, lx: c.x + Math.cos(a) * d, ly: -c.y - Math.sin(a) * d }
  })

  const pl = pitLane && pitLane.length > 1 ? pitLane.map(p => ({ x: p.x, y: -p.y })) : null
  const pts = [...base, ...cn.map(c => ({ x: c.lx, y: c.ly })), ...(pl ?? [])]
  const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x))
  const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y))
  const span = Math.max(maxX - minX, maxY - minY, 1)
  const pad = span * 0.06
  const r = span / 95
  const font = span / 42
  const line = outline && outline.length > 1 ? outline.map((p, i) => `${i ? 'L' : 'M'}${p.x},${-p.y}`).join('') + 'Z' : null
  const hl = new Set([...(favCode ? [favCode] : []), ...featured])

  // driver labels: the highlighted ones keep the default spot (right of the dot); the others try other spots so they do not cover each other
  const ordered = [...cars].sort((a, b) => Number(hl.has(b.code)) - Number(hl.has(a.code)))
  // corner numbers are obstacles too
  const placed: Box[] = cn.map(c => { const w = c.n.length * font * 0.85 * 0.8; return { x0: c.lx - w / 2, x1: c.lx + w / 2, y0: c.ly - font * 0.85, y1: c.ly + font * 0.4 } })
  const labels = new Map<string, { dx: number; dy: number; anchor: 'start' | 'end'; moved: boolean }>()
  for (const c of ordered) {
    const on = hl.has(c.code)
    const fs = on ? font * 1.1 : font * 0.9
    const w = c.code.length * fs * 0.85
    const cx = c.x, cy = -c.y
    const gap = r * 1.9
    // spots in order of preference: right of the dot, then left, then a ladder up and down on both sides
    const opts: { dx: number; dy: number; anchor: 'start' | 'end' }[] = []
    for (let k = 0; k <= 8; k++) {
      const dys = k === 0 ? [fs * 0.35] : [fs * 0.35 - k * fs * 1.55, fs * 0.35 + k * fs * 1.55]
      for (const dy of dys) { opts.push({ dx: gap, dy, anchor: 'start' }); opts.push({ dx: -gap, dy, anchor: 'end' }) }
    }
    const boxOf = (o: typeof opts[number]): Box => {
      const x0 = o.anchor === 'start' ? cx + o.dx : cx + o.dx - w
      return { x0, x1: x0 + w, y0: cy + o.dy - fs * 1.05, y1: cy + o.dy + fs * 0.45 }
    }
    const pick = opts.find(o => { const b = boxOf(o); return !placed.some(p => hit(p, b)) }) ?? opts[0]
    placed.push(boxOf(pick))
    labels.set(c.code, { ...pick, moved: pick !== opts[0] })
  }

  return (
    <div>
      <svg viewBox={`${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`} className={`w-full h-auto ${fill ? 'max-h-[calc(100vh-3rem)]' : 'max-h-[460px]'} rounded-xl bg-black/30`}>
        {line && <>
          <path d={line} fill="none" stroke="#2c2c38" strokeWidth={r * 4.2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={line} fill="none" stroke="#454556" strokeWidth={r * 1.1} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${r * 3} ${r * 3}`} />
        </>}
        {pl && (() => {
          const a = pl[0], z = pl[pl.length - 1]
          return (
            <g>
              <path d={pl.map((p, i) => `${i ? 'L' : 'M'}${p.x},${p.y}`).join('')} fill="none" stroke="#3b82f6" strokeWidth={r * 1.3} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${r * 2.4} ${r * 1.6}`} opacity={0.9} />
              <circle cx={a.x} cy={a.y} r={r * 1.1} fill="#22c55e" stroke="#052e16" strokeWidth={r * 0.3} />
              <circle cx={z.x} cy={z.y} r={r * 1.1} fill="#ef4444" stroke="#450a0a" strokeWidth={r * 0.3} />
              <text x={a.x + r * 2} y={a.y - r * 1.6} fontSize={font * 0.8} fontWeight={800} fill="#86efac" stroke="#052e16" strokeWidth={font * 0.18} paintOrder="stroke">ENTRADA BOX</text>
              <text x={z.x + r * 2} y={z.y + font * 1.1} fontSize={font * 0.8} fontWeight={800} fill="#fca5a5" stroke="#450a0a" strokeWidth={font * 0.18} paintOrder="stroke">SAÍDA BOX</text>
            </g>
          )
        })()}
        {cn.map(c => (
          <g key={c.n}>
            <line x1={c.x} y1={c.y} x2={c.lx} y2={c.ly} stroke="#5a5a70" strokeWidth={r * 0.35} />
            <text x={c.lx} y={c.ly + font * 0.3} fontSize={font * 0.85} fontWeight={700} textAnchor="middle" fill="#9a9ab2" stroke="#16161e" strokeWidth={font * 0.2} paintOrder="stroke">{c.n}</text>
          </g>
        ))}
        {[...ordered].reverse().map(c => {
          const on = hl.has(c.code)
          const lb = labels.get(c.code) ?? { dx: r * 1.9, dy: font * 0.35, anchor: 'start' as const, moved: false }
          return (
            <g key={c.code} style={{ transform: `translate(${c.x}px, ${-c.y}px)`, transition: 'transform 5s linear' }} opacity={c.out ? 0.25 : 1}>
              <circle r={on ? r * 1.55 : r * 1.15} fill={c.colour} stroke={on ? '#fff' : c.inPit ? '#60a5fa' : '#000'} strokeWidth={on ? r * 0.35 : r * 0.25} />
              {lb.moved && <line x1={0} y1={0} x2={lb.dx * 0.9} y2={lb.dy - font * 0.3} stroke={c.colour} strokeWidth={r * 0.3} opacity={0.8} />}
              <text x={lb.dx} y={lb.dy} textAnchor={lb.anchor} fontSize={on ? font * 1.1 : font * 0.9} fontWeight={800} fill={on ? '#fff' : '#cfcfd8'} stroke="#000" strokeWidth={font * 0.18} paintOrder="stroke">{c.code}</text>
            </g>
          )
        })}
      </svg>
      {!outline && <p className="text-[11px] text-gray-500 mt-1">O traçado da pista aparece depois da primeira volta lançada.</p>}
      <p className="text-[11px] text-gray-600 mt-1">Posição aproximada (OpenF1 ~3,7 Hz). Contorno azul = no pit lane.{pl ? ' Linha azul tracejada = pit lane (verde entrada, vermelho saída).' : ''} ★ realçados: o teu piloto e os destacados pelo admin.{cn.length > 0 ? ' Números = curvas.' : ''}</p>
    </div>
  )
}
