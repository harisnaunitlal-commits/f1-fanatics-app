export function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-700/60 bg-white/[0.03]">
        <h2 className="text-xs font-black uppercase tracking-widest text-yellow-400">{title}</h2>
        {hint && <span className="ml-auto text-[10px] text-gray-500 text-right">{hint}</span>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function fmtLap(s: number | null | undefined): string {
  if (s === null || s === undefined) return '—'
  const m = Math.floor(s / 60)
  return `${m}:${(s - m * 60).toFixed(3).padStart(6, '0')}`
}

export const COMPOUND: Record<string, { letter: string; cls: string; bar: string; name: string }> = {
  SOFT: { letter: 'S', cls: 'border-red-500 text-red-400', bar: '#ef4444', name: 'Macio' },
  MEDIUM: { letter: 'M', cls: 'border-yellow-400 text-yellow-300', bar: '#facc15', name: 'Médio' },
  HARD: { letter: 'H', cls: 'border-gray-200 text-gray-100', bar: '#e5e7eb', name: 'Duro' },
  INTERMEDIATE: { letter: 'I', cls: 'border-green-500 text-green-400', bar: '#22c55e', name: 'Intermédio' },
  WET: { letter: 'W', cls: 'border-blue-500 text-blue-400', bar: '#3b82f6', name: 'Chuva' },
}
