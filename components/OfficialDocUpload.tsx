'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OfficialDocUpload({
  gpId,
  currentUrl,
}: {
  gpId: number
  currentUrl: string | null
}) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      setError('Ficheiro demasiado grande. Máximo 10MB.')
      return
    }

    setError('')
    setSuccess(false)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() || 'pdf'
      const path = `${gpId}/oficial-${Date.now()}.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('resultados-oficiais')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage
        .from('resultados-oficiais')
        .getPublicUrl(path)

      const res = await fetch('/api/admin/upload-official-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gp_id: gpId, url: urlData.publicUrl }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error ?? 'Erro ao guardar.')

      setUrl(urlData.publicUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar ficheiro.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    setUploading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/upload-official-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gp_id: gpId, url: null }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error ?? 'Erro ao remover.')
      setUrl(null)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao remover.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-black/30 border border-gray-700 rounded-xl p-4 space-y-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        📄 Documento oficial (base da publicação)
      </p>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue-400 hover:underline break-all"
        >
          📎 Ver ficheiro actual
        </a>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm bg-f1gray hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {uploading ? 'A carregar...' : url ? '🔄 Substituir ficheiro' : '⬆️ Carregar PDF/Imagem'}
        </button>
        {url && !uploading && (
          <button
            type="button"
            onClick={handleRemove}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Remover
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
      {success && <p className="text-xs text-green-400">✅ Documento guardado!</p>}
      <p className="text-[11px] text-gray-600">PDF, JPG, PNG ou WebP · máx. 10MB</p>
    </div>
  )
}
