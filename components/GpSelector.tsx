import Link from 'next/link'

type Gp = { id: number; round: number; nome: string; emoji_bandeira: string }

export function GpSelector({ gps, selectedId, basePath }: {
  gps: Gp[]
  selectedId: number | null
  basePath: string
}) {
  return (
    <div className="flex gap-2 flex-wrap mt-3 mb-5">
      {/* Resultados acumulados — active when no GP is selected */}
      <Link href={basePath}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          selectedId === null
            ? 'bg-f1red text-white'
            : 'bg-f1gray text-gray-300 hover:text-white'
        }`}>
        🏆 Acumulado
      </Link>

      {gps.map(g => (
        <Link key={g.id} href={`${basePath}?gp=${g.id}`}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            g.id === selectedId
              ? 'bg-f1red text-white'
              : 'bg-f1gray text-gray-300 hover:text-white'
          }`}>
          {g.emoji_bandeira} {g.nome}
        </Link>
      ))}
    </div>
  )
}
