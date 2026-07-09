import { createClient } from '@supabase/supabase-js'
import { getGpQuestions, type GpQuestions } from './gp-questions'

// Admin client bypasses RLS — safe for server-side config reads
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Fetches GP questions config — DB override first, then hardcoded fallback.
 * Stored in `gp_questions_config` table by gp_id.
 * Uses service role to bypass RLS.
 */
export async function getEffectiveGpConfig(
  _supabase: any,
  gpId: number,
  round: number
): Promise<GpQuestions | undefined> {
  try {
    const admin = getAdminClient()
    const { data } = await admin
      .from('gp_questions_config')
      .select('config')
      .eq('gp_id', gpId)
      .single()
    if (data?.config) {
      const dbConfig = data.config as GpQuestions
      // Merge p14Options from hardcoded config if DB config predates this field
      if (!dbConfig.p14Options) {
        const base = getGpQuestions(round)
        if (base?.p14Options) dbConfig.p14Options = base.p14Options
      }
      return dbConfig
    }
  } catch (_) { /* table may not exist yet, fall through */ }
  return getGpQuestions(round)
}
