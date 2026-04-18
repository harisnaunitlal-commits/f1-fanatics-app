import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PredictRankingPage() {
  const supabase = await createClient()

  const { data: scoredGps } = await supabase
    .from('gp_calendar')
    .select('*')
    .eq('status', 'scored')
    .order('round', { ascending: false })

  const lastGpId = scoredGps?.[0]?.id

  const { data: scores } = lastGpId
    ? await supabase
        .from('scores_predict')
        .select('*, members(nickname, foto_url)')
        .eq('gp_id', lastGpId)
        .order('pontos_acum', { ascending: false })
    : { data: null }

  const { data: allScores } = scoredGps?.length
    ? await supabase
        .from('scores_predict')
        .select('member_email, gp_id, pontos_acum')
        .in('gp_id', scoredGps.map(g => g.id))
    : { data: null }

  // Columns oldest→newest
  const scoredGpsAsc = [...(scoredGps ?? [])].reverse()

  // Build per-GP cumulative map first, then compute deltas for display
  const memberAcum = new Map<string, Map<number, number>>()
  for (const s of allScores ?? []) {
    if (!memberAcum.has(s.member_email)) memberAcum.set(s.member_email, new Map())
    memberAcum.get(s.member_email)!.set(s.gp_id, s.pontos_acum)
  }

  // Delta per GP = acum[this] - acum[prev]; first GP delta = acum itself
  const memberDeltas = new Map<string, Map<number, number>>()
  for (const [email, acumMap] of memberAcum) {
    const deltaMap = new Map<number, number>()
    for (let i = 0; i < scoredGpsAsc.length; i++) {
      const gp = scoredGpsAsc[i]
      const curr = acumMap.get(gp.id)
      if (curr === undefined) continue
      const prevGp = i > 0 ? scoredGpsAsc[i - 1] : null
      const prev = prevGp ? (acumMap.get(prevGp.id) ?? 0) : 0
      deltaMap.set(gp.id, curr - prev)
    }
    memberDeltas.set(email, deltaMap)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h1 className="text-3xl font-bold">Ranking F1 Predict</h1>
        <div className="flex gap-2">
          <Link href="/ranking" className="text-sm px-3 py-1.5 bg-f1gray rounded-lg text-gray-300">Global</Link>
          <Link href="/ranking/play" className="text-sm px-3 py-1.5 bg-f1gray rounded-lg text-gray-300">F1 Play</Link>
          <Link href="/ranking/fantasy" className="text-sm px-3 py-1.5 bg-f1gray rounded-lg text-gray-300">Fantasy</Link>
          <Link href="/ranking/predict" className="text-sm px-3 py-1.5 bg-f1red rounded-lg font-bold">Predict</Link>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        Liga: <span className="font-mono text-gray-400">C4MIFTXAH05</span> · ID: 696205 ·
        Pontos acumulados reais do site (podem descer entre GPs, nunca negativos).
      </p>

      {!scores || scores.length === 0 ? (
        <div className="card text-center text-gray-500 py-16">Nenhum dado importado ainda.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-700 uppercase">
                <th className="text-left py-3 pr-3 w-8">#</th>
                <th className="text-left py-3 pr-3">Membro</th>
                {scoredGpsAsc.map(g => (
                  <th key={g.id} className="text-center py-3 px-2">{g.emoji_bandeira}</th>
                ))}
                <th className="text-right py-3 pl-4 font-bold text-white">Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s, i) => {
                const member = s.members as { nickname: string; foto_url: string | null } | null
                return (
                  <tr key={s.member_email} className={`border-b border-gray-800/50 ${i < 3 ? 'bg-f1red/5' : ''}`}>
                    <td className="py-3 pr-3">
                      <span className={`font-bold ${
                        i === 0 ? 'text-yellow-400' : i < 3 ? 'text-gray-300' : 'text-gray-500'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-medium">{member?.nickname ?? s.member_email.split('@')[0]}</div>
                      <div className="text-xs text-gray-500">{s.nick_predict}</div>
                    </td>
                    {scoredGpsAsc.map(g => {
                      const deltas = memberDeltas.get(s.member_email)
                      const delta = deltas?.get(g.id)
                      return (
                        <td key={g.id} className="text-center py-3 px-2">
                          {delta !== undefined ? (
                            <span className={`text-xs font-medium ${
                              delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-600'
                            }`}>{delta > 0 ? '+' : ''}{delta}</span>
                          ) : (
                            <span className="text-gray-700">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="text-right py-3 pl-4 font-bold text-lg">{s.pontos_acum}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
