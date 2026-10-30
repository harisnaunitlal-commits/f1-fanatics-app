// Builds public.gp_history (laps led, winning margin, classified cars per circuit, last 3 seasons) from OpenF1.
// Run from the project root: node scripts/build-gp-history.mjs  (then upsert gp_history_rows.json, see docs). Safe outside live sessions.
import fs from 'node:fs'
const env = fs.readFileSync('.env.local', 'utf8')
const get = k => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1].trim()
const SB = get('NEXT_PUBLIC_SUPABASE_URL'), KEY = get('SUPABASE_SERVICE_ROLE_KEY')
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }
const B = 'https://api.openf1.org/v1'
let last = 0
async function g(p, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const wait = Math.max(0, last + 420 - Date.now()); if (wait) await new Promise(r => setTimeout(r, wait)); last = Date.now()
    const r = await fetch(B + p)
    if (r.status === 429) { await new Promise(r => setTimeout(r, 2500)); continue }
    const j = await r.json()
    if (!Array.isArray(j)) { await new Promise(r => setTimeout(r, 2500)); continue }
    return j
  }
  return []
}
const cal = await fetch(`${SB}/rest/v1/gp_calendar?select=id,round,nome,data_corrida&order=round`, { headers: H }).then(r => r.json())
const s26 = await g('/sessions?session_name=Race&year=2026')
console.log('2026 race sessions:', s26.length)
const rows = []
for (const gp of cal) {
  const t = Date.parse(gp.data_corrida)
  const s = s26.find(x => Math.abs(Date.parse(x.date_start) - t) < 40 * 3600_000)
  if (!s) { console.log(gp.round, gp.nome, '-> sem sessao 2026 no OpenF1'); continue }
  for (const year of [2025, 2024, 2023]) {
    const hs = await g(`/sessions?session_name=Race&year=${year}&circuit_key=${s.circuit_key}`)
    const h = hs[0]; if (!h) continue
    const res = await g(`/session_result?session_key=${h.session_key}`)
    if (!res.length) continue
    const laps = await g(`/laps?session_key=${h.session_key}`)
    const pits = await g(`/pit?session_key=${h.session_key}`)
    const rcs = await g(`/race_control?session_key=${h.session_key}`)
    const drv = await g(`/drivers?session_key=${h.session_key}`)
    const winnerRow = res.find(r => r.position === 1)
    const maxLaps = Math.max(...res.map(r => r.number_of_laps ?? 0))
    const classified = res.filter(r => !r.dns && !r.dsq && (r.number_of_laps ?? 0) >= 0.9 * maxLaps).length
    const dnf = res.filter(r => r.dnf).length
    // P3 of the F1 Play form: cars still running at the flag that finished at least one lap behind the winner
    const lapped = res.filter(r => !r.dnf && !r.dns && !r.dsq && (r.number_of_laps ?? 0) < maxLaps).length
    const p2 = res.find(r => r.position === 2)
    const margin = p2 && typeof p2.gap_to_leader === 'number' ? p2.gap_to_leader : null
    // who crossed the line first at the end of each lap = laps led
    const byDriver = new Map()
    for (const l of laps) { if (!l.date_start) continue; const a = byDriver.get(l.driver_number) ?? new Map(); a.set(l.lap_number, l); byDriver.set(l.driver_number, a) }
    const endOf = (d, n) => { const m = byDriver.get(d); const nx = m?.get(n + 1); const cur = m?.get(n); if (nx?.date_start) return Date.parse(nx.date_start); if (cur?.date_start && cur.lap_duration) return Date.parse(cur.date_start) + cur.lap_duration * 1000; return null }
    const leaders = new Set()
    for (let n = 1; n <= maxLaps; n++) {
      let best = null
      for (const d of byDriver.keys()) { const e = endOf(d, n); if (e !== null && (best === null || e < best.e)) best = { d, e } }
      if (best) leaders.add(best.d)
    }
    // strategy: stops per classified driver outside Safety Car / VSC / red flag periods, and the lap of the first such stop
    const neutral = []
    { let from = null; let kind = null
      for (const r of [...rcs].sort((a, b) => Date.parse(a.date) - Date.parse(b.date))) {
        const at = Date.parse(r.date), m = String(r.message ?? '').toUpperCase()
        if (r.category === 'SafetyCar') {
          if (m.includes('DEPLOYED')) { if (from === null) from = at }
          else if ((m.includes('ENDING') || m.includes('IN THIS LAP')) && from !== null) { neutral.push([from, at + 90000]); from = null }
        } else if (r.category === 'Flag' && String(r.flag).toUpperCase() === 'RED' && from === null) from = at
        else if (r.category === 'Flag' && from !== null && ['GREEN', 'CLEAR'].includes(String(r.flag).toUpperCase()) && kind === null && m.includes('TRACK')) { neutral.push([from, at + 90000]); from = null }
        else if (r.category === 'SessionStatus' && m.includes('STARTED') && from !== null) { neutral.push([from, at + 90000]); from = null }
      }
    }
    const clsNums = new Set(res.filter(r => !r.dns && !r.dsq && (r.number_of_laps ?? 0) >= 0.9 * maxLaps).map(r => r.driver_number))
    const stopsBy = new Map()
    for (const p of pits) {
      if (!clsNums.has(p.driver_number)) continue
      const at = Date.parse(p.date)
      if (neutral.some(([a, b]) => at >= a && at <= b)) continue
      const arr = stopsBy.get(p.driver_number) ?? []; arr.push(p.lap_number); stopsBy.set(p.driver_number, arr)
    }
    const avgStops = clsNums.size ? [...clsNums].reduce((n, d) => n + (stopsBy.get(d)?.length ?? 0), 0) / clsNums.size : null
    const firsts = [...stopsBy.values()].map(a => Math.min(...a)).sort((a, b) => a - b)
    const firstStopLap = firsts.length ? firsts[Math.floor(firsts.length / 2)] : null
    const code = drv.find(d => d.driver_number === winnerRow?.driver_number)?.name_acronym ?? null
    rows.push({ gp_id: gp.id, year, race_name: h.meeting_name ?? `${h.country_name} ${year}`, laps: maxLaps, cars: res.length, leaders: leaders.size, margin_s: margin, classified, dnf, lapped, winner: code, avg_stops: avgStops === null ? null : Math.round(avgStops * 100) / 100, first_stop_lap: firstStopLap })
    console.log(gp.round, gp.nome, year, `lideres=${leaders.size} margem=${margin} classif=${classified}/${res.length} dnf=${dnf} dobrados=${lapped} paragens=${avgStops === null ? '-' : avgStops.toFixed(2)} 1a=${firstStopLap} vencedor=${code} voltas=${maxLaps}`)
  }
}
fs.writeFileSync('gp_history_rows.json', JSON.stringify(rows))
console.log('rows', rows.length)

// write straight to the database (service role)
{
  const body = rows.map(r => ({ ...r, leaders: r.leaders > 0 ? r.leaders : null }))
  if (body.length >= 30) {
    const res = await fetch(`${SB}/rest/v1/gp_history?on_conflict=gp_id,year`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(body) })
    console.log('upsert gp_history:', res.status, body.length, 'linhas')
  } else console.log('poucas linhas, nao grava:', body.length)
}
