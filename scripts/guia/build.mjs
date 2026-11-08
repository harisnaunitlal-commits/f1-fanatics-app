// One command to rebuild the telemetry guide (PDF + video) after a telemetry upgrade:
//   node scripts/guia/build.mjs            -> PDF and video
//   node scripts/guia/build.mjs pdf        -> only the PDF (fast)
// Needs puppeteer-core and ffmpeg-static; they live outside the repo, in %TEMP%\promo_tools (installed on first run).
// Afterwards: bump GUIA_VERSION in components/telemetry/GuiaTelemetria.tsx, commit and deploy.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const repo = path.resolve(here, '..', '..')
const tools = path.join(os.tmpdir(), 'promo_tools')
const only = process.argv[2]
const run = (cmd, args, cwd = tools) => execFileSync(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' && cmd === 'npm' })

fs.mkdirSync(tools, { recursive: true })
if (!fs.existsSync(path.join(tools, 'package.json'))) fs.writeFileSync(path.join(tools, 'package.json'), '{"name":"promo_tools","private":true}')
if (!fs.existsSync(path.join(tools, 'node_modules', 'puppeteer-core')) || !fs.existsSync(path.join(tools, 'node_modules', 'ffmpeg-static'))) {
  run('npm', ['install', 'puppeteer-core@23', 'ffmpeg-static@5.2.0', '--no-audit', '--no-fund'])
}
// the render scripts import from node_modules, so they run from the tools folder
for (const f of ['render.mjs', 'pdf.mjs']) fs.copyFileSync(path.join(here, f), path.join(tools, f === 'render.mjs' ? 'guia_render.mjs' : 'guia_pdf.mjs'))

console.log('→ PDF')
run('node', ['guia_pdf.mjs'])
if (only !== 'pdf') {
  console.log('→ fotogramas do vídeo (demora uns 10 minutos)')
  run('node', ['guia_render.mjs', 'video', '20'])
  console.log('→ codificar')
  const ffmpeg = path.join(tools, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe')
  const out = path.join(repo, 'public', 'guia', 'como-ler-a-telemetria.mp4')
  run(ffmpeg, ['-y', '-loglevel', 'error', '-framerate', '20', '-i', path.join(tools, 'out', 'frames', 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '27', '-preset', 'medium', '-movflags', '+faststart', '-r', '20', out])
}
console.log('Pronto. Falta: subir GUIA_VERSION em components/telemetry/GuiaTelemetria.tsx, commit e deploy.')
