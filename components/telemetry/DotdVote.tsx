import type { DotdResult } from '@/lib/telemetry/shared'

const VOTE_URL = 'https://www.formula1.com/en/page/vote'

// Driver of the Day. While the F1 vote is open: a prominent button to the official page (the vote cannot be embedded).
// Once the admin has typed in the result: the winner and the top of the vote.
export function DotdVote({ finished, result, drivers }: { finished: boolean; result?: DotdResult | null; drivers?: { code: string; name: string; colour: string }[] }) {
  const list = result?.results ?? []
  if (list.length > 0) {
    const top = list[0]
    const max = Math.max(...list.map(r => r.pct), 1)
    const info = (code: string) => drivers?.find(d => d.code === code)
    return (
      <div className="rounded-2xl border-2 border-yellow-400/70 bg-yellow-400/10 px-5 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-4xl leading-none">🏆</span>
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-widest text-yellow-300">Piloto do Dia · votação encerrada</div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="inline-flex items-center gap-2 text-3xl sm:text-4xl font-black leading-none"><span className="w-1.5 h-8 rounded-sm" style={{ background: info(top.code)?.colour ?? '#facc15' }} />{top.code}</span>
              <span className="text-lg text-yellow-50/90">{info(top.code)?.name ?? ''}</span>
              <span className="text-2xl font-black tabular-nums text-yellow-300">{top.pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          {list.slice(0, 5).map((r, i) => (
            <div key={r.code} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-right tabular-nums text-gray-400">{i + 1}</span>
              <span className="w-10 font-black">{r.code}</span>
              <div className="flex-1 h-2.5 rounded bg-black/40 overflow-hidden"><div className="h-full rounded" style={{ width: `${(r.pct / max) * 100}%`, background: info(r.code)?.colour ?? '#facc15' }} /></div>
              <span className="w-14 text-right tabular-nums text-gray-200">{r.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <a
      href={VOTE_URL} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-2xl border-2 border-yellow-400/70 bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors px-5 py-4 text-yellow-50"
    >
      <span className="text-4xl leading-none">🏆</span>
      <span className="min-w-0">
        <span className="block text-lg sm:text-xl font-black leading-tight">Vota no Piloto do Dia</span>
        <span className="block text-xs sm:text-sm text-yellow-100/80">
          {finished ? 'A corrida terminou: a votação oficial da F1 está aberta.' : 'A votação oficial da F1 está aberta durante a corrida.'} Abre no site da Fórmula 1.
        </span>
      </span>
      <span className="ml-auto shrink-0 rounded-full bg-yellow-400 text-black font-black text-sm px-4 py-2">Votar ↗</span>
    </a>
  )
}
