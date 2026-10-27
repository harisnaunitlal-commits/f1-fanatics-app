// Position change since the previous scored GP: green arrow up = climbed, red arrow down = dropped.
export default function RankMove({ prev, now, hasPrev }: { prev: number | null; now: number; hasPrev: boolean }) {
  if (!hasPrev) return null
  if (prev === null) return <span className="text-sky-400 text-[10px] font-black w-8 text-right" title="Entrou no ranking">NOVO</span>
  if (now < prev) return <span className="text-green-400 text-xs font-bold w-8 text-right tabular-nums" title={`Subiu ${prev - now} (era ${prev}.º)`}>▲{prev - now}</span>
  if (now > prev) return <span className="text-red-400 text-xs font-bold w-8 text-right tabular-nums" title={`Desceu ${now - prev} (era ${prev}.º)`}>▼{now - prev}</span>
  return <span className="text-gray-600 text-xs w-8 text-right" title="Manteve a posição">·</span>
}
