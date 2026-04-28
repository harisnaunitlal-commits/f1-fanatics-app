export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PILOTOS_2026 } from '@/lib/supabase/types'
import { getGpQuestions } from '@/lib/gp-questions'
import { calculatePlayScore } from '@/lib/scoring'
import type { Prediction, GpAnswers } from '@/lib/supabase/types'

function dn(code: string | null | undefined): string {
  if (!code) return '—'
  if (code.toUpperCase() === 'NONE') return 'Nenhum Piloto'
  const p = (PILOTOS_2026 as readonly { codigo: string; nome: string }[])
    .find(x => x.codigo === code.toUpperCase())
  return p?.nome ?? code
}

function Row({
  code, label, playerVal, correctVal, pts, earned, anulada,
}: {
  code: string; label: string
  playerVal: string; correctVal: string
  pts: number; earned: number; anulada: boolean
}) {
  const hasAnswer = playerVal !== '' && playerVal !== '—'
  const isCorrect = hasAnswer && playerVal.toUpperCase() === correctVal.toUpperCase()
  return (
    <div className={`flex items-center gap-2 py-2.5 border-b border-gray-800/50 text-sm ${anulada ? 'opacity-40' : ''}`}>
      <div className="w-6 text-center shrink-0 text-base">
        {anulada ? '🚫' : !hasAnswer ? '⬜' : isCorrect ? '✅' : '❌'}
      </div>
      <div className="w-28 shrink-0">
        <span className="text-xs font-bold text-f1red">{code}</span>
        <span className="block text-[11px] text-gray-400 leading-tight">{label}</span>
      </div>
      <div className={`flex-1 truncate ${isCorrect ? 'text-green-400' : !hasAnswer ? 'text-gray-600 italic' : 'text-red-300'}`}>
        {hasAnswer ? playerVal : 'Não respondeu'}
      </div>
      <div className="flex-1 truncate text-right">
        {!isCorrect && hasAnswer && !anulada
          ? <span className="text-green-400">{correctVal}</span>
          : <span className="text-gray-700">—</span>}
      </div>
      <div className={`w-12 text-right font-bold shrink-0 ${earned > 0 ? 'text-yellow-400' : 'text-gray-600'}`}>
        {anulada ? '—' : `${earned}/${pts}`}
      </div>
    </div>
  )
}

export default async function GpResultsPage({ params }: { params: { gpId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const gpId = parseInt(params.gpId)
  if (isNaN(gpId)) redirect('/predict')

  const [{ data: gp }, { data: pred }, { data: ans }, { data: allScores }] = await Promise.all([
    (supabase as any).from('gp_calendar').select('*').eq('id', gpId).single(),
    (supabase as any).from('predictions').select('*').eq('member_email', user.email).eq('gp_id', gpId).single(),
    (supabase as any).from('gp_answers').select('*').eq('gp_id', gpId).single(),
    // Fetch all scores for ranking — try scores_play first
    (supabase as any)
      .from('scores_play')
      .select('member_email, total, members(nickname, foto_url)')
      .eq('gp_id', gpId)
      .order('total', { ascending: false }),
  ])

  if (!gp) redirect('/predict')

  // If no stored scores, calculate on-the-fly from all predictions
  let ranking: { email: string; nickname: string; foto_url: string | null; total: number }[] = []

  if (allScores && allScores.length > 0) {
    ranking = allScores.map((s: any) => ({
      email: s.member_email,
      nickname: s.members?.nickname ?? s.member_email.split('@')[0],
      foto_url: s.members?.foto_url ?? null,
      total: s.total,
    }))
  } else if (ans) {
    // Calculate from all predictions
    const { data: allPreds } = await (supabase as any)
      .from('predictions')
      .select('*, members(nickname, foto_url)')
      .eq('gp_id', gpId)

    if (allPreds) {
      ranking = (allPreds as any[])
        .map((p: any) => ({
          email: p.member_email,
          nickname: p.members?.nickname ?? p.member_email.split('@')[0],
          foto_url: p.members?.foto_url ?? null,
          total: calculatePlayScore(p as Prediction, ans as GpAnswers).total,
        }))
        .sort((a, b) => b.total - a.total)
    }
  }

  const config = getGpQuestions(gp.round)
  const anuladas: string[] = ans?.perguntas_anuladas ?? []
  const p = pred as Prediction | null
  const a = ans as GpAnswers | null
  const s = (p && a) ? calculatePlayScore(p, a) : null
  const maxPts = 20

  return (
    <div className="max-w-2xl mx-auto pb-12">

      {/* Header */}
      <div className="mb-6">
        <Link href="/predict" className="text-gray-500 hover:text-white text-sm">← Previsões</Link>
        <h1 className="text-2xl font-bold mt-2">
          {gp.emoji_bandeira} GP {gp.nome} — Resultados
        </h1>
      </div>

      {/* No answers yet */}
      {!a && (
        <div className="card text-center py-10">
          <div className="text-5xl mb-3">⏳</div>
          <h2 className="text-lg font-bold mb-1">Resultados ainda não disponíveis</h2>
          <p className="text-gray-400 text-sm">As respostas correctas ainda não foram inseridas.</p>
        </div>
      )}

      {a && (
        <>
          {/* ── Personal score card ── */}
          {s ? (
            <div className="card mb-6 py-6 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">A tua pontuação</p>
              <div className="text-7xl font-black text-yellow-400 leading-none">{s.total}</div>
              <div className="text-gray-400 text-sm mt-1">pontos de {maxPts}</div>
              <div className="mt-4 h-2.5 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-f1red to-yellow-400"
                  style={{ width: `${Math.round((s.total / maxPts) * 100)}%` }}
                />
              </div>
              {anuladas.length > 0 && (
                <p className="text-xs text-yellow-600 mt-2">🚫 {anuladas.length} pergunta(s) anulada(s)</p>
              )}
            </div>
          ) : (
            <div className="card mb-6 py-6 text-center border-gray-700">
              <div className="text-4xl mb-2">🏎️</div>
              <p className="text-gray-400 text-sm">Não submeteste previsão para este GP.</p>
            </div>
          )}

          {/* ── GP Ranking table ── */}
          {ranking.length > 0 && (
            <div className="card mb-6">
              <h2 className="font-bold text-lg mb-4">🏆 Classificação — GP {gp.nome}</h2>
              <div className="space-y-2">
                {ranking.map((r, i) => {
                  const isMe = r.email === user.email
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                  const initial = r.nickname.charAt(0).toUpperCase()
                  return (
                    <div
                      key={r.email}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                        isMe ? 'bg-f1red/10 border border-f1red/30' : 'bg-white/3'
                      }`}
                    >
                      {/* Position */}
                      <div className="w-8 text-center shrink-0">
                        {medal
                          ? <span className="text-lg">{medal}</span>
                          : <span className="text-gray-500 font-bold text-sm">{i + 1}</span>}
                      </div>
                      {/* Avatar */}
                      {r.foto_url
                        ? <img src={r.foto_url} alt={r.nickname} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-f1red/20 text-f1red flex items-center justify-center font-bold text-xs shrink-0">{initial}</div>
                      }
                      {/* Name */}
                      <span className={`flex-1 font-medium text-sm ${isMe ? 'text-white' : 'text-gray-300'}`}>
                        {r.nickname} {isMe && <span className="text-f1red text-xs">(tu)</span>}
                      </span>
                      {/* Score */}
                      <span className={`font-black text-lg shrink-0 ${
                        i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-white'
                      }`}>
                        {r.total}
                        <span className="text-xs font-normal text-gray-500 ml-0.5">pts</span>
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Personal breakdown (only if participated) ── */}
          {s && p && (
            <div className="card">
              <h2 className="font-bold text-lg mb-4">📋 As tuas respostas</h2>
              <div className="flex items-center gap-2 pb-2 mb-1 border-b border-gray-700 text-[10px] uppercase tracking-widest text-gray-500">
                <div className="w-6" />
                <div className="w-28">Pergunta</div>
                <div className="flex-1">A tua resposta</div>
                <div className="flex-1 text-right">Correcta</div>
                <div className="w-12 text-right">Pts</div>
              </div>

              <Row code="P1 · 1º" label="Pódio"          playerVal={dn(p.p1_primeiro)}  correctVal={dn(a.p1_primeiro)}  pts={1} earned={s.pts_p1a} anulada={anuladas.includes('p1_primeiro')} />
              <Row code="P1 · 2º" label="Pódio"          playerVal={dn(p.p1_segundo)}   correctVal={dn(a.p1_segundo)}   pts={1} earned={s.pts_p1b} anulada={anuladas.includes('p1_primeiro')} />
              <Row code="P1 · 3º" label="Pódio"          playerVal={dn(p.p1_terceiro)}  correctVal={dn(a.p1_terceiro)}  pts={1} earned={s.pts_p1c} anulada={anuladas.includes('p1_primeiro')} />
              <Row code="P2"      label="Equipa"          playerVal={p.p2_equipa   ?? ''} correctVal={a.p2_equipa   ?? ''} pts={1} earned={s.pts_p2}  anulada={anuladas.includes('p2_equipa')} />
              <Row code="P3"      label="Volta de Avanço" playerVal={p.p3_lap      ?? ''} correctVal={a.p3_lap      ?? ''} pts={1} earned={s.pts_p3}  anulada={anuladas.includes('p3_lap')} />
              <Row code="P4 · 4º" label="Posições 4-6"   playerVal={dn(p.p4_quarto)}    correctVal={dn(a.p4_quarto)}    pts={1} earned={s.pts_p4a} anulada={anuladas.includes('p4_quarto')} />
              <Row code="P4 · 5º" label="Posições 4-6"   playerVal={dn(p.p4_quinto)}    correctVal={dn(a.p4_quinto)}    pts={1} earned={s.pts_p4b} anulada={anuladas.includes('p4_quinto')} />
              <Row code="P4 · 6º" label="Posições 4-6"   playerVal={dn(p.p4_sexto)}     correctVal={dn(a.p4_sexto)}     pts={1} earned={s.pts_p4c} anulada={anuladas.includes('p4_sexto')} />
              <Row code="P5"      label={config ? `${config.p5.nameA} vs ${config.p5.nameB}` : 'Duelo 1'} playerVal={dn(p.p5_duelo)} correctVal={dn(a.p5_duelo)} pts={1} earned={s.pts_p5} anulada={anuladas.includes('p5_duelo')} />
              <Row code="P6"      label={config ? `${config.p6.nameA} vs ${config.p6.nameB}` : 'Duelo 2'} playerVal={dn(p.p6_duelo)} correctVal={dn(a.p6_duelo)} pts={1} earned={s.pts_p6} anulada={anuladas.includes('p6_duelo')} />
              <Row code="P7"      label={config ? `${config.p7.nameA} vs ${config.p7.nameB}` : 'Duelo 3'} playerVal={dn(p.p7_duelo)} correctVal={dn(a.p7_duelo)} pts={1} earned={s.pts_p7} anulada={anuladas.includes('p7_duelo')} />
              <Row code="P8"      label="Margem de Vitória"  playerVal={p.p8_margem   ?? ''} correctVal={a.p8_margem   ?? ''} pts={1} earned={s.pts_p8}  anulada={anuladas.includes('p8_margem')} />
              <Row code="P9"      label="First to Retire"    playerVal={dn(p.p9_retire)}    correctVal={dn(a.p9_retire)}    pts={3} earned={s.pts_p9}  anulada={anuladas.includes('p9_retire')} />
              <Row code="P10"     label="Driver of the Day"  playerVal={dn(p.p10_dotd)}     correctVal={dn(a.p10_dotd)}     pts={2} earned={s.pts_p10} anulada={anuladas.includes('p10_dotd')} />
              <Row code="P11"     label="Volta Mais Rápida"  playerVal={dn(p.p11_fl)}       correctVal={dn(a.p11_fl)}       pts={1} earned={s.pts_p11} anulada={anuladas.includes('p11_fl')} />
              <Row code="P12"     label="Nº Classificados"   playerVal={p.p12_classif ?? ''} correctVal={a.p12_classif ?? ''} pts={1} earned={s.pts_p12} anulada={anuladas.includes('p12_classif')} />
              <Row code="P13"     label={config?.p13Label ?? 'Pergunta Especial'} playerVal={dn(p.p13_especial)} correctVal={dn(a.p13_especial)} pts={1} earned={s.pts_p13} anulada={anuladas.includes('p13_especial')} />
              <Row code="P14"     label="Safety Car"         playerVal={p.p14_sc      ?? ''} correctVal={a.p14_sc      ?? ''} pts={1} earned={s.pts_p14} anulada={anuladas.includes('p14_sc')} />
              <Row code="P15"     label={config?.p15Label ?? 'Outsider'} playerVal={dn(p.p15_outsider)} correctVal={dn(a.p15_outsider)} pts={1} earned={s.pts_p15} anulada={anuladas.includes('p15_outsider')} />

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-700">
                <span className="font-bold text-white text-sm uppercase tracking-wide">Total</span>
                <span className="text-2xl font-black text-yellow-400">{s.total} <span className="text-sm font-normal text-gray-500">pts</span></span>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6">
        <Link href="/predict" className="btn-secondary w-full block text-center">← Voltar às previsões</Link>
      </div>
    </div>
  )
}
