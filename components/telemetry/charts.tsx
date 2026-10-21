export interface Series {
  key: string
  color: string
  x: number[]
  y: (number | null)[]
  width?: number
  dash?: string
  opacity?: number
  step?: boolean
  fill?: boolean
}

interface Props {
  series: Series[]
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  height?: number
  yTicks?: number[]
  xTicks?: number[]
  fmtY?: (v: number) => string
  fmtX?: (v: number) => string
  invertY?: boolean
  zeroLine?: boolean
  endLabels?: { key: string; text: string }[]
}

const W = 640, ML = 38, MR = 34, MT = 8, MB = 18

export function LineChart({ series, xMin, xMax, yMin, yMax, height = 140, yTicks, xTicks, fmtY = v => String(v), fmtX = v => String(v), invertY = false, zeroLine = false, endLabels }: Props) {
  const iw = W - ML - MR, ih = height - MT - MB
  const px = (x: number) => ML + ((x - xMin) / (xMax - xMin || 1)) * iw
  const py = (y: number) => MT + (invertY ? (y - yMin) / (yMax - yMin || 1) : 1 - (y - yMin) / (yMax - yMin || 1)) * ih

  const path = (s: Series): string => {
    let d = '', pen = false, lastY = 0
    for (let i = 0; i < s.x.length; i++) {
      const y = s.y[i]
      if (y === null || y === undefined || Number.isNaN(y)) { pen = false; continue }
      const X = px(s.x[i]), Y = py(y)
      if (!pen) { d += `M${X.toFixed(1)},${Y.toFixed(1)}`; pen = true }
      else d += s.step ? `H${X.toFixed(1)}V${Y.toFixed(1)}` : `L${X.toFixed(1)},${Y.toFixed(1)}`
      lastY = Y
    }
    void lastY
    return d
  }

  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="w-full h-auto" role="img">
      {(yTicks ?? []).map(t => (
        <g key={`y${t}`}>
          <line x1={ML} x2={W - MR} y1={py(t)} y2={py(t)} stroke="#ffffff" strokeOpacity={0.07} />
          <text x={ML - 5} y={py(t) + 3} textAnchor="end" fontSize={9} fill="#8a8a98">{fmtY(t)}</text>
        </g>
      ))}
      {(xTicks ?? []).map(t => (
        <text key={`x${t}`} x={px(t)} y={height - 4} textAnchor="middle" fontSize={9} fill="#8a8a98">{fmtX(t)}</text>
      ))}
      {zeroLine && <line x1={ML} x2={W - MR} y1={py(0)} y2={py(0)} stroke="#ffffff" strokeOpacity={0.35} strokeDasharray="3 3" />}
      {series.map(s => {
        const d = path(s)
        if (!d) return null
        return (
          <g key={s.key}>
            {s.fill && <path d={`${d}L${px(s.x[s.x.length - 1]).toFixed(1)},${py(yMin)}L${px(s.x[0]).toFixed(1)},${py(yMin)}Z`} fill={s.color} fillOpacity={0.12} stroke="none" />}
            <path d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? 1.6} strokeDasharray={s.dash} strokeOpacity={s.opacity ?? 1} strokeLinejoin="round" />
          </g>
        )
      })}
      {(endLabels ?? []).map(l => {
        const s = series.find(x => x.key === l.key)
        if (!s) return null
        let i = s.y.length - 1
        while (i >= 0 && (s.y[i] === null || s.y[i] === undefined)) i--
        if (i < 0) return null
        return <text key={l.key} x={px(s.x[i]) + 4} y={py(s.y[i] as number) + 3} fontSize={9} fontWeight={700} fill={s.color}>{l.text}</text>
      })}
    </svg>
  )
}
