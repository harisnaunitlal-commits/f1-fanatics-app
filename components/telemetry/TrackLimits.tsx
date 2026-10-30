import type { TelemetryState, TrackLimitRow } from '@/lib/telemetry/engine'

const STATUS: Record<TrackLimitRow['status'], { label: string; cls: string }> = {
  ok: { label: 'dentro do limite', cls: 'bg-gray-700 text-gray-300' },
  iminente: { label: 'AVISO IMINENTE', cls: 'bg-yellow-500 text-black' },
  aviso: { label: 'BANDEIRA P&B · próxima = +5 s', cls: 'bg-orange-600 text-white' },
  penalizado: { label: 'PENALIZADO', cls: 'bg-red-600 text-white' },
}

// Track limits: infringements counted from the stewards' "lap time deleted - track limits" messages, plus their own
// black-and-white flags and time penalties. The official messages always win over our indicative thresholds.
export function TrackLimitsPanel({ s }: { s: TelemetryState }) {
  const rows = s.trackLimits
  const total = rows.reduce((n, r) => n + r.count, 0)
  const alerts = rows.filter(r => r.status !== 'ok')
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-black tabular-nums">{total}</span>
        <span className="text-xs text-gray-400">infracções contabilizadas<br />em {rows.filter(r => r.count > 0).length} pilotos</span>
        {alerts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 ml-auto">
            {alerts.map(a => (
              <span key={a.code} className={`text-[11px] font-black px-2.5 py-1 rounded-full ${STATUS[a.status].cls}`}>
                ⚠️ {a.code} · {a.status === 'penalizado' ? `+${a.penaltySecs}s` : a.status === 'aviso' ? 'bandeira P&B' : `${a.count} infracções`}
              </span>
            ))}
          </div>
        )}
      </div>

      {rows.length === 0 ? <p className="text-sm text-gray-500">Sem infracções de limites da pista até agora.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
                <th className="py-1.5 px-2 text-left">Piloto</th>
                <th className="py-1.5 px-2 text-center">Infracções</th>
                <th className="py-1.5 px-2 text-left">Onde</th>
                <th className="py-1.5 px-2 text-center">Última</th>
                <th className="py-1.5 px-2 text-left">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.code} className="border-b border-gray-800/50">
                  <td className="py-1.5 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-5 rounded-sm" style={{ background: r.colour }} /><b>{r.code}</b></span></td>
                  <td className="py-1.5 px-2 text-center">
                    <span className="inline-flex gap-0.5 items-center">
                      {Array.from({ length: Math.max(r.count, 1) }).map((_, i) => <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < r.count ? (i >= 3 ? 'bg-red-500' : i === 2 ? 'bg-yellow-400' : 'bg-gray-300') : 'bg-gray-700'}`} />)}
                      <b className="ml-1.5 tabular-nums">{r.count}</b>
                    </span>
                  </td>
                  <td className="py-1.5 px-2 text-gray-400 text-xs">{r.turns.length ? r.turns.map(t => `T${t.turn}${t.n > 1 ? ` ×${t.n}` : ''}`).join(' · ') : '—'}</td>
                  <td className="py-1.5 px-2 text-center tabular-nums text-gray-400">{r.lastLap ? `V${r.lastLap}` : '—'}</td>
                  <td className="py-1.5 px-2"><span className={`text-[10px] font-black px-2 py-0.5 rounded ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-gray-600 leading-relaxed">
        Cada tempo de volta apagado por &quot;track limits&quot; conta como uma infracção. Regra habitual em corrida: ao fim de umas 3 infracções (varia consoante o circuito) a Direcção mostra a <b className="text-gray-400">bandeira preto e branco</b> como aviso e a infracção seguinte dá <b className="text-gray-400">+5 s</b>. O estado &quot;aviso iminente&quot; (3 ou mais) é só indicativo; o aviso e a penalização a sério vêm das mensagens oficiais da Direcção de Corrida.
      </p>
    </div>
  )
}
