import Link from 'next/link'

type Tab = 'global' | 'play' | 'fantasy' | 'predict' | 'awards'

const TABS: { id: Tab; label: string; base: string; perGp: boolean }[] = [
  { id: 'global',  label: 'Triatlo',  base: '/ranking',         perGp: true },
  { id: 'play',    label: 'F1 Play',  base: '/ranking/play',    perGp: true },
  { id: 'fantasy', label: 'Fantasy',  base: '/ranking/fantasy', perGp: true },
  { id: 'predict', label: 'Predict',  base: '/ranking/predict', perGp: true },
  { id: 'awards',  label: '🏅 Awards', base: '/ranking/awards',  perGp: false },
]

export function RankingTabs({ active, gpId }: { active: Tab; gpId?: number | null }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TABS.map(tab => {
        const href = gpId && tab.perGp ? `${tab.base}?gp=${gpId}` : tab.base
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
