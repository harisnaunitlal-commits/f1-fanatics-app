'use client'

import { useState } from 'react'

export default function CircuitHistoryEdit({
  gpId,
  currentText,
}: {
  gpId: number
  currentText: string | null
}) {
  const [text, setText] = useState(currentText ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSave() {
    setSaving(true); setError(''); setSuccess(false)
    try {
      const res = await fetch('/api/admin/save-circuit-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gp_id: gpId, historia: text }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error ?? 'Erro ao guardar.')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-black/30 border border-gray-700 rounded-xl p-4 space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        🏟️ História do circuito
      </p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
        placeholder="Ex: Silverstone, inaugurado em 1948, é conhecido como o berço da Fórmula 1..."
        className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-f1red/50"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-sm bg-f1gray hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? 'A guardar...' : '💾 Guardar história'}
        </button>
        {error && <span className="text-xs text-red-400">{error}</span>}
        {success && <span className="text-xs text-green-400">✅ Guardado!</span>}
      </div>
    </div>
  )
}
