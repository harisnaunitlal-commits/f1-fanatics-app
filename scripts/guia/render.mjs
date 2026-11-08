// usage:
//   node guia_render.mjs shots <t1,t2,...>      -> PNG stills of the video at those seconds (out/shot_<t>.png)
//   node guia_render.mjs pages                  -> PNG of every PDF page + overflow report (out/page_<n>.png)
//   node guia_render.mjs video [fps]            -> all frames as JPEG (out/frames/f%05d.jpg)
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const DOCS = 'C:/Users/haris/OneDrive/Documents/Projecto F1 Play 2026/Code Project F1 Play 2026/docs/guia'
const OUT = 'C:/Users/haris/AppData/Local/Temp/promo_tools/out'
fs.mkdirSync(OUT, { recursive: true })
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => fs.existsSync(p))
const mode = process.argv[2]
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--force-device-scale-factor=1'] })
const page = await browser.newPage()

if (mode === 'pages') {
  await page.setViewport({ width: 794, height: 1123 })
  await page.goto(pathToFileURL(path.join(DOCS, 'guia-telemetria.html')).href, { waitUntil: 'networkidle0' })
  await page.evaluateHandle('document.fonts.ready')
  const info = await page.evaluate(() => Array.from(document.querySelectorAll('.page')).map((p, i) => {
    // content taller than the page = something is cut off
    const kids = Array.from(p.children)
    const last = kids[kids.length - 1].getBoundingClientRect(), pr = p.getBoundingClientRect()
    const bottoms = kids.filter(k => !k.classList.contains('foot')).map(k => k.getBoundingClientRect().bottom - pr.top)
    return { page: i + 1, height: Math.round(pr.height), contentBottom: Math.round(Math.max(...bottoms)), footTop: Math.round(last.top - pr.top), overflow: p.scrollHeight > p.clientHeight + 1, scrollH: p.scrollHeight }
  }))
  console.log(JSON.stringify(info))
  const els = await page.$$('.page')
  for (let i = 0; i < els.length; i++) await els[i].screenshot({ path: path.join(OUT, `page_${i + 1}.png`) })
} else {
  await page.setViewport({ width: 1280, height: 720 })
  await page.goto(pathToFileURL(path.join(DOCS, 'video.html')).href, { waitUntil: 'networkidle0' })
  await page.evaluateHandle('document.fonts.ready')
  const total = await page.evaluate('window.TOTAL')
  if (mode === 'shots') {
    for (const t of process.argv[3].split(',').map(Number)) {
      await page.evaluate(t => window.render(t), t)
      await page.screenshot({ path: path.join(OUT, `shot_${t}.png`) })
    }
    console.log('total', total)
  } else if (mode === 'video') {
    const fps = Number(process.argv[3] || 20)
    const dir = path.join(OUT, 'frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true })
    const n = Math.floor(total * fps)
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => window.render(t), i / fps)
      await page.screenshot({ path: path.join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 85 })
      if (i % 200 === 0) console.log('frame', i, '/', n)
    }
    console.log('frames', n, 'fps', fps)
  }
}
await browser.close()
