import Link from 'next/link'

type Tab = 'global' | 'play' | 'fantasy' | 'predict'

const TABS: { id: Tab; label: string; base: string }[] = [
  { id: 'global',  label: 'Global',   base: '/ranking' },
  { id: 'play',    label: 'F1 Play',  base: '/ranking/play' },
  { id: 'fantasy', label: 'Fantasy',  base: '/ranking/fantasy' },
  { id: 'predict', label: 'Predict',  base: '/ranking/predict' },
]

export function RankingTabs({ active, gpId }: { active: Tab; gpId?: number | null }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map(tab => {
        const href = gpId ? `${tab.base}?gp=${gpId}` : tab.base
        return (
          <Link key={tab.id} href={href}
            className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
              tab.id === active
                ? 'bg-f1red text-white font-bold'
                : 'bg-f1gray text-gray-300 hover:text-white'
            }`}>
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
