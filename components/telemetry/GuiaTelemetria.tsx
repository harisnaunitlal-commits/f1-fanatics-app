'use client'

import { useState } from 'react'

// Bump this every time the PDF and the video are rebuilt (each Grand Prix weekend with telemetry upgrades):
// it shows members when the guide was last updated and makes browsers fetch the new files instead of an old copy.
const GUIA_VERSION = { v: '2026-11-09', label: '9 Nov 2026', gp: 'GP do Brasil' }

const PDF = `/guia/guia-telemetria.pdf?v=${GUIA_VERSION.v}`
const VIDEO = `/guia/como-ler-a-telemetria.mp4?v=${GUIA_VERSION.v}`

// "How to read the telemetry": the video and the PDF guide, one click away from the telemetry page for every member.
export default function GuiaTelemetria() {
  const [open, setOpen] = useState(false)
  return (
    <div className="card mb-4 border-2 border-yellow-400/60 bg-yellow-400/[0.07]">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl leading-none">📘</span>
        <div className="min-w-0">
          <div className="font-black text-lg leading-tight">Como ler a Telemetria <span className="ml-1 align-middle text-[10px] font-bold uppercase tracking-wider rounded-full bg-yellow-400/20 text-yellow-300 px-2 py-0.5">actualizado: {GUIA_VERSION.gp} · {GUIA_VERSION.label}</span></div>
          <div className="text-xs sm:text-sm text-gray-400">Tem muita informação: vê o vídeo (5 min) ou lê o guia em PDF (11 páginas) para tirares partido dela durante a corrida. Actualizamos o guia a cada fim-de-semana de Grande Prémio.</div>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button onClick={() => setOpen(o => !o)} className="rounded-full bg-yellow-400 text-black font-black text-sm px-4 py-2">{open ? 'Fechar vídeo' : '▶ Ver vídeo'}</button>
          <a href={PDF} target="_blank" rel="noopener noreferrer" className="rounded-full border border-yellow-400/60 text-yellow-200 font-bold text-sm px-4 py-2 hover:bg-yellow-400/10">📄 Ler o guia (PDF)</a>
        </div>
      </div>
      {open && (
        <div className="mt-3">
          <video className="w-full rounded-xl bg-black aspect-video" src={VIDEO} controls autoPlay playsInline preload="metadata" />
          <p className="mt-2 text-[11px] text-gray-500">O vídeo tem legendas no próprio ecrã. Se preferires ler ao teu ritmo, o PDF tem a mesma matéria, painel a painel.</p>
        </div>
      )}
    </div>
  )
}
