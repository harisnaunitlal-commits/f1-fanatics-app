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

// From R20 (Brasil) Rafael Câmara (CAM) drives the Haas seat; Ocon and Hirakawa are no longer offered in the questions
const GONE = new Set(['OCO', 'HIR'])
function withoutGoneDrivers(cfg: GpQuestions | undefined, round: number): GpQuestions | undefined {
  if (!cfg || round < 20) return cfg
  const cam = { codigo: 'CAM', nome: 'Rafael Câmara', equipa: 'Haas' }
  const opts = (list: GpQuestions['p13Options']) => {
    const mapped = (list ?? []).map(o => (GONE.has(o.codigo) ? { ...o, ...cam } : o))
    return mapped.filter((o, i) => mapped.findIndex(x => x.codigo === o.codigo) === i)
  }
  const duel = (d: GpQuestions['p5']): GpQuestions['p5'] => {
    if (!d) return d
    const next = { ...d }
    if (GONE.has(d.driverA)) { next.driverA = cam.codigo; next.nameA = cam.nome; next.teamA = cam.equipa }
    if (GONE.has(d.driverB)) { next.driverB = cam.codigo; next.nameB = cam.nome; next.teamB = cam.equipa }
    return next
  }
  return { ...cfg, p5: duel(cfg.p5), p6: duel(cfg.p6), p7: duel(cfg.p7), p13Options: opts(cfg.p13Options), p15Options: opts(cfg.p15Options) }
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
      return withoutGoneDrivers(dbConfig, round)
    }
  } catch (_) { /* table may not exist yet, fall through */ }
  return withoutGoneDrivers(getGpQuestions(round), round)
}
