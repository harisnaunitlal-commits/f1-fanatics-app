'use client'

import { useState } from 'react'

export default function MemberNickEdit({
  email,
  initialFantasyNick,
  initialPredictNick,
}: {
  email: string
  initialFantasyNick: string | null
  initialPredictNick: string | null
}) {
  const [fantasyNick, setFantasyNick] = useState(initialFantasyNick ?? '')
  const [predictNick, setPredictNick] = useState(initialPredictNick ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/update-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fantasy_nick: fantasyNick, predict_nick: predictNick }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao guardar')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card space-y-4">
      <h2 className="font-bold text-gray-300">✏️ Editar nicks externos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">🏅 Fantasy Nick</label>
          <input
            className="input"
            placeholder="Nome da equipa em F1 Fantasy"
            value={fantasyNick}
            onChange={e => setFantasyNick(e.target.value)}
          />
        </div>
        <div>
          <label className="label">📊 Predict Nick</label>
          <input
            className="input"
            placeholder="Nome em F1 Predict"
            value={predictNick}
            onChange={e => setPredictNick(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
      >
        {saving ? 'A guardar…' : saved ? '✓ Guardado!' : '💾 Guardar'}
      </button>
    </div>
  )
}
