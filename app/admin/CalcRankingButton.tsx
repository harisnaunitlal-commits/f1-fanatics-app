'use client'

import { useState } from 'react'

export default function CalcRankingButton({
  gpId,
  gpNome,
  adminEmail,
}: {
  gpId: number
  gpNome: string
  adminEmail: string
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function handleClick() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/calc-global-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gp_id: gpId, admin_email: adminEmail }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setResult({ ok: false, msg: data.error ?? 'Erro desconhecido.' })
      } else {
        setResult({ ok: true, msg: `✅ Ranking calculado — ${data.n_rows} membros actualizados.` })
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e.message ?? 'Erro de rede.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-primary text-sm py-2 px-3 whitespace-nowrap"
      >
        {loading ? '⏳ A calcular...' : '🌍 Ranking Global'}
      </button>
      {result && (
        <p className={`text-xs px-2 py-1 rounded ${result.ok ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
          {result.msg}
        </p>
      )}
    </div>
  )
}
