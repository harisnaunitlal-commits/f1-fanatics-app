// (Columns show the points each member scored in THIS GP in the 3 leagues; Score is the accumulated Triatlo score.)
// Top 10 flyer announcing that the results of a GP were published (Triatlo Score, with arrows vs the previous GP).
// Run from the project root:  node scripts/top10-flyer.mjs <gp_id>     (e.g. 16 for the US GP)
// Reads .env.local (Supabase service key), writes docs/promo/top10-<gp>.html and docs/entregas/top10-<gp>.png
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const gpId = Number(process.argv[2])
if (!gpId) { console.error('Uso: node scripts/top10-flyer.mjs <gp_id>'); process.exit(1) }

const env = fs.readFileSync('.env.local', 'utf8')
const get = k => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim()
const SB = get('NEXT_PUBLIC_SUPABASE_URL'), KEY = get('SUPABASE_SERVICE_ROLE_KEY')
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY }
const q = p => fetch(`${SB}/rest/v1/${p}`, { headers: H }).then(r => r.json())

const [gp] = await q(`gp_calendar?select=id,round,nome,emoji_bandeira,circuito&id=eq.${gpId}`)
if (!gp) { console.error('GP não encontrado'); process.exit(1) }
const scored = await q('gp_calendar?select=id,round&status=eq.scored&order=round.desc')
const prev = scored.find(g => g.round < gp.round)
const [cur, before, members] = await Promise.all([
  q(`global_ranking?select=*&gp_id=eq.${gpId}`),
  prev ? q(`global_ranking?select=member_email,global_score&gp_id=eq.${prev.id}`) : Promise.resolve([]),
  q('members?select=email,nickname,foto_url'),
])
if (!cur.length) { console.error('Ainda não há ranking global para este GP (recalcula o ranking global primeiro).'); process.exit(1) }

const byEmail = Object.fromEntries(members.map(m => [m.email, m]))
const order = rows => [...rows].sort((a, b) => b.global_score - a.global_score || a.member_email.localeCompare(b.member_email))
const prevRank = new Map(order(before).map((r, i) => [r.member_email, i + 1]))
const top = order(cur).slice(0, 10)

// flag emoji -> ISO code (regional indicator letters)
const cc = [...(gp.emoji_bandeira ?? '')].map(c => String.fromCodePoint(c.codePointAt(0) - 0x1F1E6 + 97)).join('')
const flag = cc.length === 2 && fs.existsSync(`public/flags/${cc}.png`) ? `../../public/flags/${cc}.png` : null

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const move = (r, i) => {
  if (!prev) return ''
  const p = prevRank.get(r.member_email)
  if (p === undefined) return '<span class="mv new">NOVO</span>'
  if (p > i + 1) return `<span class="mv up">▲${p - i - 1}</span>`
  if (p < i + 1) return `<span class="mv down">▼${i + 1 - p}</span>`
  return '<span class="mv same">•</span>'
}
const rowsHtml = top.map((r, i) => {
  const m = byEmail[r.member_email]
  const name = m?.nickname ?? r.member_email.split('@')[0]
  const av = m?.foto_url ? `<img class="av" src="${esc(m.foto_url)}" alt="">` : `<span class="av ini">${esc(name.charAt(0).toUpperCase())}</span>`
  const cls = i === 0 ? 'gold' : i < 3 ? 'podium' : ''
  return `<div class="row ${cls}">
    <div class="pos">${i + 1}</div>${move(r, i)}
    ${av}
    <div class="nm">${esc(name)}</div>
    <div class="lg"><b>${r.play_gp_pts ?? 0}</b><small>Play</small></div>
    <div class="lg"><b>${r.fantasy_gp_pts ?? 0}</b><small>Fantasy</small></div>
    <div class="lg"><b>${r.predict_gp_pts ?? 0}</b><small>Predict</small></div>
    <div class="sc">${Number(r.global_score).toFixed(1)}</div>
  </div>`
}).join('\n')

const leader = byEmail[top[0].member_email]?.nickname ?? ''
const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Top 10 · GP ${esc(gp.nome)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: 1080px; height: 1920px; background: #08080b; }
  body { color: #f0f0f2; font-family: 'DM Sans', system-ui, sans-serif; position: relative; overflow: hidden;
    background: radial-gradient(1000px 650px at 50% -5%, rgba(225,6,0,.42), transparent 70%), radial-gradient(900px 600px at 50% 108%, rgba(225,6,0,.2), transparent 70%), #08080b; }
  .stripe { position: absolute; left: 0; right: 0; top: 0; height: 14px; background: #e10600; }
  .wrap { padding: 64px 60px 50px; height: 100%; display: flex; flex-direction: column; gap: 26px; }
  .head { display: flex; align-items: center; gap: 20px; }
  .logo { width: 88px; height: 88px; border-radius: 50%; background: #fff; border: 4px solid #e10600; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .logo img { width: 78px; height: 78px; object-fit: contain; }
  .brand { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 40px; line-height: 1; }
  .brand small { display: block; font-family: 'DM Sans'; font-weight: 500; font-size: 17px; color: #9a9aa8; margin-top: 5px; letter-spacing: .08em; text-transform: uppercase; }
  .badge { display: inline-flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 800; letter-spacing: .16em; color: #fff; background: #16a34a; border-radius: 999px; padding: 9px 24px; text-transform: uppercase; }
  h1 { font-family: 'Barlow Condensed'; font-weight: 900; font-size: 128px; line-height: .88; text-transform: uppercase; margin-top: 16px; }
  h1 span { color: #e10600; }
  .gp { display: flex; align-items: center; gap: 18px; font-family: 'Barlow Condensed'; font-weight: 800; font-size: 46px; color: #e8e8ee; }
  .gp img { height: 44px; border-radius: 6px; }
  .tbl { display: flex; flex-direction: column; gap: 9px; }
  .th { display: flex; align-items: center; padding: 0 18px; font-size: 18px; font-weight: 700; letter-spacing: .14em; color: #8a8a98; text-transform: uppercase; }
  .th .a { margin-left: auto; display: flex; gap: 0; }
  .th .a span { width: 92px; text-align: center; letter-spacing: .04em; font-size: 16px; } .th .a span:last-child { width: 118px; color: #fff; }
  .row { display: flex; align-items: center; gap: 12px; background: #15151b; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 10px 18px; height: 102px; }
  .row.podium { border-color: rgba(245,197,24,.45); background: linear-gradient(90deg, rgba(245,197,24,.12), #15151b 60%); }
  .row.gold { border-color: rgba(245,197,24,.9); background: linear-gradient(90deg, rgba(245,197,24,.28), #1b1810 65%); box-shadow: 0 0 34px rgba(245,197,24,.25); }
  .pos { width: 52px; height: 52px; border-radius: 50%; background: #23232b; color: #cfcfd8; font-family: 'Barlow Condensed'; font-weight: 900; font-size: 36px; display: flex; align-items: center; justify-content: center; flex: none; }
  .podium .pos, .gold .pos { background: #f5c518; color: #08080b; }
  .mv { width: 44px; font-size: 20px; font-weight: 800; text-align: center; flex: none; }
  .mv.up { color: #4ade80; } .mv.down { color: #f87171; } .mv.same { color: #4a4a55; } .mv.new { color: #38bdf8; font-size: 14px; letter-spacing: .06em; }
  .av { width: 64px; height: 64px; border-radius: 50%; object-fit: cover; flex: none; background: #2a2a33; border: 2px solid rgba(255,255,255,.18); }
  .av.ini { display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 28px; color: #cfcfd8; }
  .nm { flex: 1; min-width: 0; font-weight: 700; font-size: 30px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gold .nm, .podium .nm { color: #fde68a; }
  .lg { width: 92px; text-align: center; line-height: 1.05; flex: none; }
  .lg b { display: block; font-size: 26px; font-weight: 700; font-variant-numeric: tabular-nums; }
  .lg small { font-size: 13px; color: #8a8a98; letter-spacing: .1em; text-transform: uppercase; }
  .sc { width: 118px; text-align: right; font-family: 'Barlow Condensed'; font-weight: 900; font-size: 58px; color: #fff; flex: none; font-variant-numeric: tabular-nums; }
  .gold .sc, .podium .sc { color: #f5c518; }
  .foot { margin-top: auto; text-align: center; }
  .foot .cta { display: inline-block; background: #15151b; border: 2px solid rgba(225,6,0,.6); border-radius: 999px; padding: 14px 38px; font-size: 30px; font-weight: 700; }
  .foot .cta b { color: #e10600; }
  .foot p { color: #8a8a98; font-size: 20px; margin-top: 14px; }
</style></head><body>
<div class="stripe"></div>
<div class="wrap">
  <div class="head"><div class="logo"><img src="../../public/logos/beira-f1.png" alt=""></div><div class="brand">Beira F1 Fanatics<small>Temporada 2026 · Beira, Moçambique</small></div></div>
  <div>
    <span class="badge">✓ Resultados publicados</span>
    <h1>Top 10<br><span>Triatlo</span></h1>
  </div>
  <div class="gp">${flag ? `<img src="${flag}" alt="">` : ''}<span>GP ${esc(gp.nome)} · R${String(gp.round).padStart(2, '0')}</span></div>
  <div class="tbl">
    <div class="th"><span>Pontos do GP ${esc(gp.nome)} + score da época</span><div class="a"><span>Play</span><span>Fantasy</span><span>Predict</span><span>Score</span></div></div>
    ${rowsHtml}
  </div>
  <div class="foot">
    <div class="cta">Ranking completo em <b>app.beiraf1fanatics.com</b></div>
    <p>Play / Fantasy / Predict = pontos deste GP · Score = Triatlo acumulado da época · ▲ subiu · ▼ desceu</p>
  </div>
</div></body></html>`

const htmlPath = path.resolve(`docs/promo/top10-${gpId}.html`)
fs.writeFileSync(htmlPath, html)
const safeName = gp.nome.normalize('NFD').replace(/[^\w]+/g, '-').toLowerCase()
const out = path.resolve(`docs/entregas/top10-gp${String(gp.round).padStart(2, '0')}-${safeName}.png`)
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))
if (!chrome) { console.error('Chrome/Edge não encontrado'); process.exit(1) }
execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=1080,1920', '--virtual-time-budget=10000', `--screenshot=${out}`, pathToFileURL(htmlPath).href], { stdio: 'ignore' })
console.log('Flyer:', out)
console.log(`Líder: ${leader}. Top 10: ${top.map((r, i) => `${i + 1}.º ${byEmail[r.member_email]?.nickname}`).join(', ')}`)
