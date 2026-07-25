'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function StartingGridButton({
  gpId, gpNome, currentUrl,
}: {
  gpId: number
  gpNome: string
  currentUrl: string | null
}) {
  const [open, setOpen]           = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [preview, setPreview]     = useState<string | null>(currentUrl)
  const [error, setError]         = useState<string | null>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  async function saveUrl(url: string | null) {
    const res = await fetch('/api/admin/starting-grid', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gp_id: gpId, image_url: url }),
    })
    if (!res.ok) {
      const d = await res.json()
      throw new Error(d.error ?? 'Erro ao guardar')
    }
  }

  async function handleFile(file: File) {
    setError(null)
    setUploading(true)
    try {
      const sb  = createClient()
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `gp-${gpId}/starting-grid.${ext}`

      const { error: upErr } = await sb.storage
        .from('starting-grids')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (upErr) throw new Error('Upload falhou: ' + upErr.message)

      const { data: { publicUrl } } = sb.storage
        .from('starting-grids')
        .getPublicUrl(path)

      await saveUrl(publicUrl)
      setPreview(publicUrl)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  async function remove() {
    setError(null)
    try {
      await saveUrl(null)
      setPreview(null)
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        className={`text-sm py-2 px-3 rounded-lg transition-colors ${
          preview
            ? 'bg-green-900/40 text-green-400 hover:bg-green-800/50 border border-green-700/40'
            : 'bg-gray-800 text-gray-300 hover:text-white'
        }`}
      >
        {preview ? '🏁 Grelha ✓' : '🏁 Grelha'}
      </button>

      {open && (
        <div className="mt-2 p-3 rounded-xl border border-yellow-400/30 bg-gray-900 space-y-3 w-72">
          <p className="text-xs text-gray-400 font-bold">Grelha de Partida · {gpNome}</p>

          {preview && (
            <div className="relative">
              <img src={preview} alt="Grelha" className="w-full rounded-lg border border-white/10" />
              <button
                onClick={remove}
                className="absolute top-1 right-1 text-[10px] bg-red-700 text-white px-1.5 py-0.5 rounded font-bold hover:bg-red-600"
              >
                ✕ Remover
              </button>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full text-sm font-bold py-2 rounded-lg bg-yellow-400 text-black hover:bg-yellow-300 disabled:opacity-50 transition-colors"
          >
            {uploading ? '⏳ A carregar…' : saved ? '✓ Guardado!' : preview ? '🔄 Substituir imagem' : '📁 Escolher imagem'}
          </button>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      )}
    </div>
  )
}
