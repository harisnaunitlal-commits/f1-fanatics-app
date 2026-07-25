'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StartingGridButton({
  gpId, gpNome, currentUrl,
}: {
  gpId: number
  gpNome: string
  currentUrl: string | null
}) {
  const [open, setOpen]     = useState(false)
  const [url, setUrl]       = useState(currentUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  async function save() {
    setSaving(true)
    const sb = createClient()
    await (sb as any).from('gp_calendar').update({ starting_grid_image: url || null }).eq('id', gpId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setOpen(false) }, 1500)
  }

  return (
    <div className="inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-sm py-2 px-3 rounded-lg transition-colors ${
          currentUrl
            ? 'bg-green-900/40 text-green-400 hover:bg-green-800/50 border border-green-700/40'
            : 'bg-gray-800 text-gray-300 hover:text-white'
        }`}
      >
        {currentUrl ? '🏁 Grelha ✓' : '🏁 Grelha'}
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-xl border border-yellow-400/30 bg-gray-900 space-y-2 w-80">
          <p className="text-xs text-gray-400 font-bold">URL da imagem — Grelha de Partida · {gpNome}</p>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full text-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 text-xs font-bold py-1.5 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50 transition-colors"
            >
              {saving ? 'A guardar…' : saved ? '✓ Guardado!' : 'Guardar'}
            </button>
            {url && (
              <button
                onClick={() => { setUrl(''); save() }}
                className="text-xs py-1.5 px-3 rounded-lg bg-red-900/40 text-red-400 hover:bg-red-800/50 transition-colors"
              >
                Remover
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
