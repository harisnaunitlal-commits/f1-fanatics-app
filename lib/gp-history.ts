import { createServiceClient } from '@/lib/supabase/service'

// Last seasons at the same circuit (built from OpenF1 results, 2023-2025). Shown as a hint next to the
// questions that are hard for new fans (laps led, winning margin, classified cars).
export interface GpHistoryRow {
  year: number
  race_name: string | null
  laps: number | null
  cars: number | null
  leaders: number | null
  margin_s: number | null
  classified: number | null
  dnf: number | null
  winner: string | null
}

export async function getGpHistory(gpId: number): Promise<GpHistoryRow[]> {
  try {
    const db = createServiceClient()
    const { data } = await db.from('gp_history').select('year, race_name, laps, cars, leaders, margin_s, classified, dnf, winner').eq('gp_id', gpId).order('year', { ascending: false }).limit(3)
    return (data ?? []) as GpHistoryRow[]
  } catch { return [] }
}
