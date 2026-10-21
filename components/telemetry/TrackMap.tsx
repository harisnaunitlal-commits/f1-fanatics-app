import type { MapCar } from '@/lib/telemetry/engine'

export function TrackMap({ outline, cars, favCode, featured }: { outline: { x: number; y: number }[] | null | undefined; cars: MapCar[]; favCode: string | null; featured: string[] }) {
  const pts = [...(outline ?? []), ...cars].map(p => ({ x: p.x, y: -p.y })) // y grows upwards in OpenF1, downwards in SVG
  if (pts.length === 0) return <p className="text-sm text-gray-500">Sem posições dos carros neste momento.</p>

  const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x))
  const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y))
  const span = Math.max(maxX - minX, maxY - minY, 1)
  const pad = span * 0.06
  const r = span / 95
  const font = span / 42
  const line = outline && outline.length > 1 ? outline.map((p, i) => `${i ? 'L' : 'M'}${p.x},${-p.y}`).join('') + 'Z' : null
  const hl = new Set([...(favCode ? [favCode] : []), ...featured])

  return (
    <div>
      <svg viewBox={`${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`} className="w-full h-auto max-h-[460px] rounded-xl bg-black/30">
        {line && <>
          <path d={line} fill="none" stroke="#2c2c38" strokeWidth={r * 4.2} strokeLinejoin="round" strokeLinecap="round" />
          <path d={line} fill="none" stroke="#454556" strokeWidth={r * 1.1} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${r * 3} ${r * 3}`} />
        </>}
        {[...cars].sort((a, b) => Number(hl.has(a.code)) - Number(hl.has(b.code))).map(c => {
          const on = hl.has(c.code)
          return (
            <g key={c.code} style={{ transform: `translate(${c.x}px, ${-c.y}px)`, transition: 'transform 5s linear' }} opacity={c.out ? 0.25 : 1}>
              <circle r={on ? r * 1.55 : r * 1.15} fill={c.colour} stroke={on ? '#fff' : c.inPit ? '#60a5fa' : '#000'} strokeWidth={on ? r * 0.35 : r * 0.25} />
              <text x={r * 1.9} y={font * 0.35} fontSize={on ? font * 1.1 : font * 0.9} fontWeight={800} fill={on ? '#fff' : '#cfcfd8'} stroke="#000" strokeWidth={font * 0.18} paintOrder="stroke">{c.code}</text>
            </g>
          )
        })}
      </svg>
      {!outline && <p className="text-[11px] text-gray-500 mt-1">O traçado da pista aparece depois da primeira volta lançada.</p>}
      <p className="text-[11px] text-gray-600 mt-1">Posição aproximada (OpenF1 ~3,7 Hz). Contorno azul = no pit lane. ★ realçados: o teu piloto e os destacados pelo admin.</p>
    </div>
  )
}
