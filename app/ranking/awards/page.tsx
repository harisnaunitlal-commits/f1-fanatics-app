export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RankingTabs } from '@/components/RankingTabs'

type Gp = { id: number; round: number; nome: string; emoji_bandeira: string | null; is_sprint: boolean | null }
type MemberLite = { nickname: string; foto_url: string | null } | null
type Entry = { email: string; member: MemberLite; pts: number; gp: Gp }
type Podium = { rank: number; entries: Entry[] }[]

const PODIUM_DEPTH = 3

// Groups ties: everyone with the same score shares the place, up to 3 places.
function buildPodium(entries: Entry[]): Podium {
  const sorted = [...entries].filter(e => e.pts > 0).sort((a, b) => b.pts - a.pts)
  const podium: Podium = []
  for (const e of sorted) {
    const last = podium[podium.length - 1]
    if (last && last.entries[0].pts === e.pts) { last.entries.push(e); continue }
    if (podium.length === PODIUM_DEPTH) break
    podium.push({ rank: podium.length + 1, entries: [e] })
  }
  return podium
}

// Older imports only stored the accumulated total; derive the GP score from the previous GP.
function perGpPoints(
  rows: { member_email: string; gp_id: number; pontos_gp: number | null; pontos_acum: number | null }[],
  gpOrder: number[],
): Map<string, number> {
  const pos = new Map(gpOrder.map((id, i) => [id, i]))
  const acum = new Map<string, number>()
  rows.forEach(r => { if (r.pontos_acum != null) acum.set(`${r.member_email}|${r.gp_id}`, r.pontos_acum) })
  const out = new Map<string, number>()
  for (const r of rows) {
    const key = `${r.member_email}|${r.gp_id}`
    if (r.pontos_gp != null) { out.set(key, r.pontos_gp); continue }
    if (r.pontos_acum == null) continue
    let prev = 0
    for (let i = (pos.get(r.gp_id) ?? 0) - 1; i >= 0; i--) {
      const p = acum.get(`${r.member_email}|${gpOrder[i]}`)
      if (p != null) { prev = p; break }
    }
    out.set(key, r.pontos_acum - prev)
  }
  return out
}

const LEAGUES = {
  play:    { title: 'F1 Play',    icon: '🎮', accent: 'text-blue-400',   ring: 'border-blue-500/40',   glow: 'rgba(96,165,250,0.18)' },
  fantasy: { title: 'F1 Fantasy', icon: '💰', accent: 'text-green-400',  ring: 'border-green-500/40',  glow: 'rgba(74,222,128,0.18)' },
  predict: { title: 'F1 Predict', icon: '🎯', accent: 'text-purple-400', ring: 'border-purple-500/40', glow: 'rgba(192,132,252,0.18)' },
} as const

// Flag emoji (🇦🇺) or text code (AU) → local flag image, same rule as the homepage.
function flagSrc(code: string | null): string | null {
  if (!code) return null
  const iso = Array.from(code).map(c => {
    const cp = c.codePointAt(0) ?? 0
    return cp >= 127462 && cp <= 127487 ? String.fromCharCode(cp - 127397) : c.toUpperCase()
  }).join('')
  return /^[A-Z]{2}$/.test(iso) ? `/flags/${iso}.png` : null
}

const RANK_STYLE = [
  { ring: 'bg-yellow-400/15 text-yellow-400 ring-1 ring-yellow-400/60' },
  { ring: 'bg-gray-300/15 text-gray-200 ring-1 ring-gray-300/50' },
  { ring: 'bg-amber-600/15 text-amber-500 ring-1 ring-amber-600/50' },
]

function PodiumCard({ league, podium }: { league: keyof typeof LEAGUES; podium: Podium }) {
  const L = LEAGUES[league]
  return (
    <div className={`rounded-2xl border ${L.ring} overflow-hidden`}
      style={{ background: 'rgba(0,0,0,0.45)', boxShadow: `0 0 28px ${L.glow}` }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <span className="text-lg">{L.icon}</span>
        <span className={`font-black uppercase tracking-widest text-sm ${L.accent}`}>{L.title}</span>
        <span className="ml-auto text-[10px] text-gray-500 uppercase tracking-wider">Recorde num GP</span>
      </div>

      {podium.length === 0 ? (
        <div className="px-4 py-10 text-center text-gray-600 text-sm">Sem dados ainda.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {podium.map(place => {
            const rs = RANK_STYLE[place.rank - 1]
            return place.entries.map(e => {
              const name = e.member?.nickname ?? e.email.split('@')[0]
              return (
                <li key={`${e.email}-${e.gp.id}`} className="flex items-center gap-3 px-4 py-3.5">
                  <span className={`w-9 h-9 rounded-full flex items-center justify-center text-base font-black tabular-nums shrink-0 ${rs.ring}`}>
                    {place.rank}
                  </span>
                  {e.member?.foto_url ? (
                    <img src={e.member.foto_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-gray-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-f1gray flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/players/${encodeURIComponent(name)}`} className="text-sm text-gray-300 hover:text-f1red transition-colors truncate block">
                      {name}
                    </Link>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {flagSrc(e.gp.emoji_bandeira) && (
                        <img src={flagSrc(e.gp.emoji_bandeira)!} alt="" className="w-6 h-4 rounded-[3px] object-cover ring-1 ring-white/15 shrink-0" />
                      )}
                      <span className="font-bold text-white text-base leading-tight">{e.gp.nome}</span>
                      {league === 'fantasy' && e.gp.is_sprint && (
                        <span className="text-[11px] font-semibold text-yellow-400 whitespace-nowrap">⚡ Sprint</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-2xl font-black tabular-nums ${L.accent}`}>{e.pts}</span>
                </li>
              )
            })
          })}
        </ul>
      )}
    </div>
  )
}

export default async function AwardsPage() {
  const supabase = await createClient()

  const { data: gpsRaw } = await (supabase as any)
    .from('gp_calendar')
    .select('id, round, nome, emoji_bandeira, is_sprint')
    .eq('status', 'scored')
    .order('round', { ascending: true })
  const gps: Gp[] = gpsRaw ?? []
  const gpById = new Map(gps.map(g => [g.id, g]))
  const gpIds = gps.map(g => g.id)
  const gpOrder = gpIds

  const [{ data: play }, { data: fantasy }, { data: predict }] = await Promise.all([
    (supabase as any).from('scores_play').select('member_email, gp_id, total, members(nickname, foto_url)').in('gp_id', gpIds),
    (supabase as any).from('scores_fantasy').select('member_email, gp_id, pontos_gp, pontos_acum, members(nickname, foto_url)').in('gp_id', gpIds),
    (supabase as any).from('scores_predict').select('member_email, gp_id, pontos_gp, pontos_acum, members(nickname, foto_url)').in('gp_id', gpIds),
  ])

  const toEntries = (rows: any[], ptsOf: (r: any) => number | undefined): Entry[] =>
    rows.flatMap(r => {
      const gp = gpById.get(r.gp_id); const pts = ptsOf(r)
      return gp && pts != null ? [{ email: r.member_email, member: r.members ?? null, pts, gp }] : []
    })

  const fantasyPts = perGpPoints(fantasy ?? [], gpOrder)
  const predictPts = perGpPoints(predict ?? [], gpOrder)

  const podiums = {
    play:    buildPodium(toEntries(play ?? [],    r => r.total ?? undefined)),
    fantasy: buildPodium(toEntries(fantasy ?? [], r => fantasyPts.get(`${r.member_email}|${r.gp_id}`))),
    predict: buildPodium(toEntries(predict ?? [], r => predictPts.get(`${r.member_email}|${r.gp_id}`))),
  }

  const first = gps[0], last = gps[gps.length - 1]

  return (
    <div>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="text-3xl font-bold">🏅 Awards</h1>
        <RankingTabs active="awards" />
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Maior pontuação numa única corrida, por liga
        {first && last && <> · R{String(first.round).padStart(2, '0')} {first.nome} → R{String(last.round).padStart(2, '0')} {last.nome}</>}
        {' '}· actualiza após cada GP · empates partilham o lugar
      </p>

      <div className="grid gap-5 md:grid-cols-3">
        <PodiumCard league="play"    podium={podiums.play} />
        <PodiumCard league="fantasy" podium={podiums.fantasy} />
        <PodiumCard league="predict" podium={podiums.predict} />
      </div>

      <p className="text-gray-600 text-xs mt-6">
        ⚡ No F1 Fantasy, os fins de semana Sprint têm corrida extra e, por isso, mais pontos disponíveis.
      </p>
    </div>
  )
}
