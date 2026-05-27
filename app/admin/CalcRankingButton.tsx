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
  const [loading, setLoading]     = useState<'full' | 'test' | null>(null)
  const [result, setResult]       = useState<{ ok: boolean; msg: string } | null>(null)

  async function callEndpoint(sendOnlyTo?: string) {
    const mode = sendOnlyTo ? 'test' : 'full'
    setLoading(mode)
    setResult(null)
    try {
      const res = await fetch('/api/admin/calc-global-ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gp_id: gpId,
          admin_email: adminEmail,
          ...(sendOnlyTo ? { send_only_to: sendOnlyTo } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setResult({ ok: false, msg: data.error ?? 'Erro desconhecido.' })
      } else if (sendOnlyTo) {
        setResult({ ok: true, msg: `📧 Email de teste enviado para ${sendOnlyTo}` })
      } else {
        setResult({ ok: true, msg: `✅ Ranking calculado — ${data.n_rows} membros, ${data.emails_sent} emails enviados.` })
      }
    } catch (e: any) {
      setResult({ ok: false, msg: e.message ?? 'Erro de rede.' })
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => callEndpoint()}
          disabled={loading !== null}
          className="btn-primary text-sm py-2 px-3 whitespace-nowrap"
        >
          {loading === 'full' ? '⏳ A calcular...' : '🌍 Ranking Global'}
        </button>
        <button
          onClick={() => callEndpoint(adminEmail)}
          disabled={loading !== null}
          title={`Envia só para ${adminEmail}`}
          className="text-sm py-2 px-3 rounded-lg bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50 border border-yellow-700/40 transition-colors font-bold disabled:opacity-50 whitespace-nowrap"
        >
          {loading === 'test' ? '📧 A enviar...' : '📧 Testar Email'}
        </button>
      </div>
      {result && (
        <p className={`text-xs px-2 py-1 rounded ${result.ok ? 'text-green-400 bg-green-900/20' : 'text-red-400 bg-red-900/20'}`}>
          {result.msg}
        </p>
      )}
    </div>
  )
}
