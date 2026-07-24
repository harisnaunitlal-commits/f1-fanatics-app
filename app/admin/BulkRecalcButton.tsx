'use client'

import { useState } from 'react'

export default function BulkRecalcButton({
  scoredGpIds,
  adminEmail,
}: {
  scoredGpIds: number[]
  adminEmail: string
}) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleBulkRecalc() {
    if (!confirm(`Recalcular Ranking Global para ${scoredGpIds.length} GPs pontuados?\nNenhum email será enviado.`)) return

    setLoading(true)
    setResult(null)
    setProgress({ done: 0, total: scoredGpIds.length })

    let failed = 0
    for (let i = 0; i < scoredGpIds.length; i++) {
      try {
        const res = await fetch('/api/admin/calc-global-ranking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gp_id: scoredGpIds[i],
            admin_email: adminEmail,
            skip_emails: true,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) failed++
      } catch {
        failed++
      }
      setProgress({ done: i + 1, total: scoredGpIds.length })
    }

    setLoading(false)
    setProgress(null)
    if (failed === 0) {
      setResult({ ok: true, msg: `✅ ${scoredGpIds.length} GPs recalculados sem envio de email.` })
    } else {
      setResult({ ok: false, msg: `⚠️ ${scoredGpIds.length - failed}/${scoredGpIds.length} GPs recalculados. ${failed} falharam.` })
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={handleBulkRecalc}
        disabled={loading || scoredGpIds.length === 0}
        className="text-sm py-2 px-4 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 transition-colors font-bold disabled:opacity-50 whitespace-nowrap"
      >
        {loading && progress
          ? `⏳ ${progress.done}/${progress.total} GPs...`
          : `🔄 Recalcular ${scoredGpIds.length} GPs (sem email)`}
      </button>
      {result && (
        <span className={`text-xs px-2 py-1 rounded ${result.ok ? 'text-green-400 bg-green-900/20' : 'text-yellow-400 bg-yellow-900/20'}`}>
          {result.msg}
        </span>
      )}
    </div>
  )
}
