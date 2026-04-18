import type { Prediction, GpAnswers, ScorePlay } from './supabase/types'

type ScoreBreakdown = Omit<ScorePlay, 'member_email' | 'gp_id' | 'participou' | 'calculado_em'>

export function calculatePlayScore(
  prediction: Prediction,
  answers: GpAnswers
): ScoreBreakdown {
  const anuladas = answers.perguntas_anuladas ?? []

  const score = (field: keyof GpAnswers, pred: string | null | undefined): number => {
    if (anuladas.includes(field)) return 0
    const ans = answers[field] as string | null
    if (!ans || !pred) return 0
    return ans.toUpperCase() === pred.toUpperCase() ? 1 : 0
  }

  const pts_p1a = score('p1_primeiro', prediction.p1_primeiro)
  const pts_p1b = score('p1_segundo',  prediction.p1_segundo)
  const pts_p1c = score('p1_terceiro', prediction.p1_terceiro)
  const pts_p2  = score('p2_equipa',   prediction.p2_equipa)
  const pts_p3  = score('p3_lap',      prediction.p3_lap)
  const pts_p4a = score('p4_quarto',   prediction.p4_quarto)
  const pts_p4b = score('p4_quinto',   prediction.p4_quinto)
  const pts_p4c = score('p4_sexto',    prediction.p4_sexto)
  const pts_p5  = score('p5_duelo',    prediction.p5_duelo)
  const pts_p6  = score('p6_duelo',    prediction.p6_duelo)
  const pts_p7  = score('p7_duelo',    prediction.p7_duelo)
  const pts_p8  = score('p8_margem',   prediction.p8_margem)

  // P9 First to Retire = 3 pts
  const pts_p9  = anuladas.includes('p9_retire') ? 0
    : (answers.p9_retire && prediction.p9_retire &&
       answers.p9_retire.toUpperCase() === prediction.p9_retire.toUpperCase()) ? 3 : 0

  // P10 Driver of the Day = 2 pts
  const pts_p10 = anuladas.includes('p10_dotd') ? 0
    : (answers.p10_dotd && prediction.p10_dotd &&
       answers.p10_dotd.toUpperCase() === prediction.p10_dotd.toUpperCase()) ? 2 : 0

  const pts_p11 = score('p11_fl',       prediction.p11_fl)
  const pts_p12 = score('p12_classif',  prediction.p12_classif)
  const pts_p13 = score('p13_especial', prediction.p13_especial)
  const pts_p14 = score('p14_sc',       prediction.p14_sc)
  const pts_p15 = score('p15_outsider', prediction.p15_outsider)

  const total = pts_p1a + pts_p1b + pts_p1c + pts_p2 + pts_p3
    + pts_p4a + pts_p4b + pts_p4c + pts_p5 + pts_p6 + pts_p7
    + pts_p8 + pts_p9 + pts_p10 + pts_p11 + pts_p12
    + pts_p13 + pts_p14 + pts_p15

  return {
    pts_p1a, pts_p1b, pts_p1c, pts_p2, pts_p3,
    pts_p4a, pts_p4b, pts_p4c, pts_p5, pts_p6, pts_p7,
    pts_p8, pts_p9, pts_p10, pts_p11, pts_p12,
    pts_p13, pts_p14, pts_p15,
    total,
  }
}

export function calculateGlobalRanking(
  members: { email: string; play: number; fantasy: number; predict: number }[]
): { email: string; play_gpts: number; fantasy_gpts: number; predict_gpts: number; global_score: number; n_ligas: number }[] {
  const maxPlay    = Math.max(...members.map(m => m.play),    0)
  const maxFantasy = Math.max(...members.map(m => m.fantasy), 0)
  const maxPredict = Math.max(...members.map(m => m.predict), 0)

  return members.map(m => {
    const play_gpts    = maxPlay    > 0 ? +((m.play    / maxPlay)    * 100).toFixed(1) : 0
    const fantasy_gpts = maxFantasy > 0 ? +((m.fantasy / maxFantasy) * 100).toFixed(1) : 0
    const predict_gpts = maxPredict > 0 ? +((m.predict / maxPredict) * 100).toFixed(1) : 0

    // Ausência numa liga = 0 gpts, sempre dividir por 3
    const global_score = +((play_gpts + fantasy_gpts + predict_gpts) / 3).toFixed(1)
    const n_ligas = (m.play > 0 ? 1 : 0) + (m.fantasy > 0 ? 1 : 0) + (m.predict > 0 ? 1 : 0)

    return { email: m.email, play_gpts, fantasy_gpts, predict_gpts, global_score, n_ligas }
  })
}

export function isDeadlinePassed(deadline: string): boolean {
  return new Date() >= new Date(deadline)
}

export function getTimeUntilDeadline(deadline: string): string {
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff <= 0) return 'Prazo encerrado'
  const days  = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const mins  = Math.floor((diff % 3600000) / 60000)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}
