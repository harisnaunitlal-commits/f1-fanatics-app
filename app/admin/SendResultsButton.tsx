'use client'

import { useState } from 'react'

export default function SendResultsButton({
  gpId, gpNome,
}: {
  gpId: number
  gpNome: string
}) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!confirm(`Enviar emails de resultados para todos os jogadores que participaram no GP ${gpNome}?`)) return
    setLoading(true); setError(''); setDone(false)

    const res = await fetch('/api/admin/send-gp-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gp_id: gpId }),
    })
    const result = await res.json()

    if (!res.ok || result.error) {
      setError(result.error ?? 'Erro ao enviar.')
    } else {
      setDone(true)
      setTimeout(() => setDone(false), 5000)
    }
    setLoading(false)
  }

  if (done) return (
    <span className="text-sm text-green-400 bg-green-900/20 border border-green-700/30 px-3 py-2 rounded-lg font-bold">
      ✅ Emails enviados!
    </span>
  )

  return (
    <>
      <button
        onClick={handleSend}
        disabled={loading}
        className="text-sm py-2 px-3 rounded-lg bg-blue-900/40 text-blue-400 hover:bg-blue-900/60 border border-blue-700/30 transition-colors font-bold disabled:opacity-50"
      >
        {loading ? '📧 A enviar...' : '📧 Resultados'}
      </button>
      {error && <span className="text-xs text-red-400 ml-1">{error}</span>}
    </>
  )
}
