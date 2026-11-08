const VOTE_URL = 'https://www.formula1.com/en/page/vote'

// Driver of the Day is voted on formula1.com (the vote cannot be embedded): a prominent button that opens the official page.
export function DotdVote({ finished }: { finished: boolean }) {
  return (
    <a
      href={VOTE_URL} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-4 rounded-2xl border-2 border-yellow-400/70 bg-yellow-400/10 hover:bg-yellow-400/20 transition-colors px-5 py-4 text-yellow-50"
    >
      <span className="text-4xl leading-none">🏆</span>
      <span className="min-w-0">
        <span className="block text-lg sm:text-xl font-black leading-tight">Vota no Piloto do Dia</span>
        <span className="block text-xs sm:text-sm text-yellow-100/80">
          {finished ? 'A corrida terminou: a votação oficial da F1 está aberta.' : 'A votação oficial da F1 abre durante a corrida.'} Abre no site da Fórmula 1.
        </span>
      </span>
      <span className="ml-auto shrink-0 rounded-full bg-yellow-400 text-black font-black text-sm px-4 py-2">Votar ↗</span>
    </a>
  )
}
