import type { TyreAllocation, TyreHistory as TyreHistoryData } from '@/lib/telemetry/shared'
import { COMPOUND } from './ui'

function Chip({ compound, laps }: { compound: string | null; laps: number }) {
  const c = compound ? COMPOUND[compound] : null
  return (
    <span className="inline-flex items-center gap-0.5" title={`${c?.name ?? '?'} · ${laps || '?'} voltas`}>
      <span className={`inline-flex w-4 h-4 rounded-full border-2 items-center justify-center text-[8px] font-black ${c?.cls ?? 'border-gray-600 text-gray-500'}`}>{c?.letter ?? '?'}</span>
      <span className="text-[10px] text-gray-400 tabular-nums">{laps || ''}</span>
    </span>
  )
}

export function TyreHistory({ data, allocation }: { data: TyreHistoryData | null; allocation: TyreAllocation | null }) {
  const total = allocation ? allocation.HARD + allocation.MEDIUM + allocation.SOFT : 0
  return (
    <div className="space-y-4">
      {allocation && (
        <div className="rounded-xl bg-black/30 p-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Alocação do fim-de-semana (por piloto)</span>
          {(['SOFT', 'MEDIUM', 'HARD'] as const).map(k => allocation[k] > 0 && (
            <span key={k} className="inline-flex items-center gap-1.5">
              <span className={`inline-flex w-5 h-5 rounded-full border-2 items-center justify-center text-[10px] font-black ${COMPOUND[k].cls}`}>{COMPOUND[k].letter}</span>
              <b>{allocation[k]}</b> <span className="text-gray-400">{COMPOUND[k].name.toLowerCase()}s</span>
            </span>
          ))}
          <span className="text-gray-500 text-xs">{total} sets · informação da Pirelli inserida pelo admin</span>
        </div>
      )}

      {!data ? (
        <p className="text-sm text-gray-500">A carregar os pneus das sessões anteriores…</p>
      ) : data.sessions.length === 0 ? (
        <p className="text-sm text-gray-500">Esta é a primeira sessão do fim-de-semana — ainda não há pneus de sessões anteriores.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead>
              <tr className="text-[10px] text-gray-500 uppercase tracking-wider border-b border-gray-700/60">
                <th className="py-2 px-2 text-center w-8">#</th>
                <th className="py-2 px-2 text-left">Piloto</th>
                {data.sessions.map(s => <th key={s.key} className="py-2 px-2 text-left">{s.short}</th>)}
                <th className="py-2 px-2 text-right">Voltas por composto</th>
              </tr>
            </thead>
            <tbody>
              {data.drivers.map((d, i) => (
                <tr key={d.code} className="border-b border-gray-800/50">
                  <td className="py-1.5 px-2 text-center tabular-nums text-gray-400">{i + 1}</td>
                  <td className="py-1.5 px-2"><span className="inline-flex items-center gap-2"><span className="w-1 h-4 rounded-sm" style={{ background: d.colour }} /><b>{d.code}</b></span></td>
                  {d.bySession.map((st, j) => (
                    <td key={j} className="py-1.5 px-2">
                      {st.length === 0 ? <span className="text-gray-700">—</span> : <span className="inline-flex flex-wrap gap-x-1.5 gap-y-0.5">{st.map((x, k) => <Chip key={k} compound={x.compound} laps={x.laps} />)}</span>}
                    </td>
                  ))}
                  <td className="py-1.5 px-2 text-right">
                    <span className="inline-flex gap-2 justify-end">
                      {(['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'] as const).filter(k => d.totals[k]).map(k => (
                        <span key={k} className="inline-flex items-center gap-0.5"><span className={`text-[10px] font-black ${COMPOUND[k].cls.split(' ')[1]}`}>{COMPOUND[k].letter}</span><span className="tabular-nums text-gray-300">{d.totals[k]}</span></span>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-gray-600 mt-2">Cada bola é um stint: composto e número de voltas. O OpenF1 não identifica os sets nem diz quais restam — por isso não se calculam &quot;sets disponíveis&quot;.</p>
        </div>
      )}
    </div>
  )
}
