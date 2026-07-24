import { NextRequest, NextResponse } from 'next/server'

const OFI = 'https://api.openf1.org/v1'

type OFSession  = { session_key: number; session_name: string; date_start: string; date_end: string; meeting_key: number }
type OFDriver   = { session_key: number; driver_number: number; full_name: string; name_acronym: string; team_name: string; team_colour: string }
type OFPosition = { session_key: number; driver_number: number; position: number; date: string }
type OFLap      = { session_key: number; driver_number: number; lap_duration: number | null; is_pit_out_lap: boolean }

async function ofGet<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${OFI}${path}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 120 },
    })
    if (!res.ok) return []
    return res.json()
  } catch {
    return []
  }
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = (secs % 60).toFixed(3)
  const sPad = s.includes('.') ? s.split('.')[0].padStart(2, '0') + '.' + s.split('.')[1] : s.padStart(2, '0')
  return m > 0 ? `${m}:${sPad}` : `${sPad}s`
}

// Map our session keys → OpenF1 session_name
const OF_SESSION_NAME: Record<string, string> = {
  fp1:          'Practice 1',
  fp2:          'Practice 2',
  fp3:          'Practice 3',
  qual:         'Qualifying',
  race:         'Race',
  sprint_qual:  'Sprint Qualifying',
  sprint_race:  'Sprint',
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const sessionType = searchParams.get('type')   // our key: fp1, fp2, qual, race …
  const dateStr     = searchParams.get('date')   // YYYY-MM-DD (local date of session)

  if (!sessionType || !dateStr) {
    return NextResponse.json({ error: 'type e date são obrigatórios.' }, { status: 400 })
  }

  const ofName = OF_SESSION_NAME[sessionType]
  if (!ofName) return NextResponse.json({ error: 'Tipo de sessão inválido.' }, { status: 400 })

  // ── 1. Find the OpenF1 session ────────────────────────────────────────────
  const year = dateStr.slice(0, 4)
  const sessions = await ofGet<OFSession>(
    `/sessions?session_name=${encodeURIComponent(ofName)}&year=${year}&date_start>=${dateStr}T00:00:00&date_start<=${dateStr}T23:59:59`
  )

  // Try adjacent day if nothing found (UTC offset edge case)
  let session = sessions[0]
  if (!session) {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + 1)
    const nextDay = d.toISOString().split('T')[0]
    const next = await ofGet<OFSession>(
      `/sessions?session_name=${encodeURIComponent(ofName)}&year=${year}&date_start>=${nextDay}T00:00:00&date_start<=${nextDay}T23:59:59`
    )
    session = next[0]
  }

  if (!session) {
    return NextResponse.json({ error: 'Sessão não encontrada na OpenF1 API.', type: ofName, date: dateStr }, { status: 404 })
  }

  const sKey = session.session_key

  // ── 2. Fetch drivers ──────────────────────────────────────────────────────
  const drivers = await ofGet<OFDriver>(`/drivers?session_key=${sKey}`)
  const driverMap = new Map(drivers.map(d => [d.driver_number, d]))

  const isPractice = ['fp1', 'fp2', 'fp3'].includes(sessionType)

  // ── 3a. Practice: aggregate best lap per driver ───────────────────────────
  if (isPractice) {
    const laps = await ofGet<OFLap>(`/laps?session_key=${sKey}&is_pit_out_lap=false`)

    const bestLap = new Map<number, number>()
    for (const lap of laps) {
      if (lap.lap_duration && lap.lap_duration > 20) {
        const cur = bestLap.get(lap.driver_number)
        if (!cur || lap.lap_duration < cur) bestLap.set(lap.driver_number, lap.lap_duration)
      }
    }

    const sorted = Array.from(bestLap.entries()).sort((a, b) => a[1] - b[1])
    const fastest = sorted[0]?.[1] ?? 0

    const results = sorted.map(([num, t], i) => {
      const d = driverMap.get(num)
      return {
        position:    i + 1,
        acronym:     d?.name_acronym ?? `#${num}`,
        driver_name: d?.full_name    ?? `Piloto #${num}`,
        team:        d?.team_name    ?? '—',
        team_colour: d?.team_colour  ?? '888888',
        time:        fmtTime(t),
        gap:         i === 0 ? 'POLE' : `+${(t - fastest).toFixed(3)}`,
      }
    })

    return NextResponse.json({ session_key: sKey, session_name: ofName, results })
  }

  // ── 3b. Qualifying / Race: final positions ────────────────────────────────
  const positions = await ofGet<OFPosition>(`/position?session_key=${sKey}`)

  // Keep only the last position entry per driver
  const finalPos = new Map<number, { position: number; date: string }>()
  for (const p of positions) {
    const existing = finalPos.get(p.driver_number)
    if (!existing || p.date > existing.date) finalPos.set(p.driver_number, { position: p.position, date: p.date })
  }

  const results = Array.from(finalPos.entries())
    .map(([num, { position }]) => ({
      position,
      driver_number: num,
      acronym:     driverMap.get(num)?.name_acronym ?? `#${num}`,
      driver_name: driverMap.get(num)?.full_name    ?? `Piloto #${num}`,
      team:        driverMap.get(num)?.team_name    ?? '—',
      team_colour: driverMap.get(num)?.team_colour  ?? '888888',
      time: '',
      gap:  '',
    }))
    .sort((a, b) => a.position - b.position)

  return NextResponse.json({ session_key: sKey, session_name: ofName, results })
}
