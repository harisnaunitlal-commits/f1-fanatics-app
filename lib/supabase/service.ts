import { createClient } from '@supabase/supabase-js'

// Service role client — bypass RLS. Server-side only (cron jobs, admin actions).
// Reads are never served from Next's fetch cache: the telemetry scene must reflect admin changes immediately.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }) },
    }
  )
}
