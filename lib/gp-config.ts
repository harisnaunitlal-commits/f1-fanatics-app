import { getGpQuestions, type GpQuestions } from './gp-questions'

/**
 * Fetches GP questions config — DB override first, then hardcoded fallback.
 * Stored in `gp_questions_config` table by gp_id.
 */
export async function getEffectiveGpConfig(
  supabase: any,
  gpId: number,
  round: number
): Promise<GpQuestions | undefined> {
  try {
    const { data } = await supabase
      .from('gp_questions_config')
      .select('config')
      .eq('gp_id', gpId)
      .single()
    if (data?.config) return data.config as GpQuestions
  } catch (_) { /* table may not exist yet, fall through */ }
  return getGpQuestions(round)
}
