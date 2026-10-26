'use client'

import { useState } from 'react'
import { F1_LEAGUES, type LeagueKey } from '@/lib/leagues'

// Shown under the Fantasy / Predict nick fields: where to create the account and the code to join our league.
export default function F1LeagueHelp({ which }: { which: LeagueKey }) {
  const l = F1_LEAGUES[which]
  const [copied, setCopied] = useState(false)
  async function copy() {
    try { await navigator.clipboard.writeText(l.code); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { window.prompt('Copia o código:', l.code) }
  }
  return (
    <div className="mt-2 rounded-lg bg-black/25 border border-white/10 px-2.5 py-2 text-[11px] leading-snug space-y-1.5">
      <p className="text-gray-400">
        1. Ainda não tens conta?{' '}
        <a href={l.site} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-2">Regista-te em {l.siteLabel} ↗</a>
      </p>
      <p className="text-gray-400">
        2. Junta-te à nossa liga:{' '}
        <a href={l.join} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline underline-offset-2">abrir link ↗</a>
      </p>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400">
        Código:
        <span className="font-black tracking-wider text-yellow-400 text-xs break-all">{l.code}</span>
        <button type="button" onClick={copy} className="rounded-md bg-white/10 hover:bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap">
          {copied ? '✅ copiado' : '📋 copiar'}
        </button>
      </p>
    </div>
  )
}
