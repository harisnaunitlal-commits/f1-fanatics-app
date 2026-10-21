import type { TelemetryState } from '@/lib/telemetry/engine'

function Move({ from, to }: { from: number; to: number }) {
  if (to < from) return <span className="text-green-400 text-xs font-bold">▲{from - to}</span>
  if (to > from) return <span className="text-red-400 text-xs font-bold">▼{to - from}</span>
  return <span className="text-gray-600 text-xs">·</span>
}

export function Championship({ data, favCode, featured }: { data: NonNullable<TelemetryState['championship']>; favCode: string | null; featured: string[] }) {
  const hl = new Set([...(favCode ? [favCode] : []), ...featured])
  const drivers = data.drivers.filter((d, i) => i < 10 || hl.has(d.code))
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Pilotos</h3>
        <table className="w-full text-sm">
          <tbody>
            {drivers.map(d => (
              <tr key={d.code} className={`border-b border-gray-800/50 ${hl.has(d.code) ? 'bg-yellow-400/10' : ''}`}>
                <td className="py-1 px-1 w-7 text-center tabular-nums text-gray-400">{d.posNow}</td>
                <td className="py-1 px-1 w-8"><Move from={d.posStart} to={d.posNow} /></td>
                <td className="py-1 px-1"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: d.colour }} /><b>{d.code}</b></span></td>
                <td className="py-1 px-1 text-right tabular-nums font-bold">{d.pointsNow}</td>
                <td className="py-1 px-1 text-right tabular-nums text-xs w-12">{d.delta > 0 ? <span className="text-green-400">+{d.delta}</span> : <span className="text-gray-600">·</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Construtores</h3>
        <table className="w-full text-sm">
          <tbody>
            {data.teams.slice(0, 11).map(t => (
              <tr key={t.name} className="border-b border-gray-800/50">
                <td className="py-1 px-1 w-7 text-center tabular-nums text-gray-400">{t.posNow}</td>
                <td className="py-1 px-1 w-8"><Move from={t.posStart} to={t.posNow} /></td>
                <td className="py-1 px-1"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: t.colour }} /><b>{t.name}</b></span></td>
                <td className="py-1 px-1 text-right tabular-nums font-bold">{t.pointsNow}</td>
                <td className="py-1 px-1 text-right tabular-nums text-xs w-12">{t.delta > 0 ? <span className="text-green-400">+{t.delta}</span> : <span className="text-gray-600">·</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="sm:col-span-2 text-[10px] text-gray-600">Campeonato se a {data.sprint ? 'sprint' : 'corrida'} acabasse agora: pontos do início da sessão + pontos pela ordem actual. {data.sprint ? '' : 'Sem ponto pela volta mais rápida (regra desde 2025). '}Os pontos oficiais só se confirmam no fim.</p>
    </div>
  )
}
