'use client'

import { useState, useRef } from 'react'

export default function OfficialDocUpload({
  gpId,
  currentUrls,
}: {
  gpId: number
  currentUrls: string[] | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [urls, setUrls] = useState<string[]>(currentUrls ?? [])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    if (inputRef.current) inputRef.current.value = ''

    setError('')
    setUploading(true)

    const newUrls = [...urls]
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`"${file.name}" demasiado grande (máx. 10MB).`)
        continue
      }
      try {
        const form = new FormData()
        form.append('file', file)
        form.append('gp_id', String(gpId))

        const res = await fetch('/api/admin/upload-official-doc', { method: 'POST', body: form })
        const result = await res.json()
        if (!res.ok || result.error) throw new Error(result.error ?? 'Erro ao carregar.')

        newUrls.push(result.url)
        setUrls([...newUrls])
      } catch (err: any) {
        setError(err.message ?? 'Erro ao carregar ficheiro.')
      }
    }
    setUploading(false)
  }

  async function handleRemove(urlToRemove: string, idx: number) {
    setUploadingIdx(idx)
    setError('')
    try {
      const res = await fetch('/api/admin/upload-official-doc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gp_id: gpId, remove_url: urlToRemove }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error ?? 'Erro ao remover.')
      setUrls(result.urls)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao remover.')
    } finally {
      setUploadingIdx(null)
    }
  }

  function fileName(url: string) {
    try { return decodeURIComponent(url.split('/').pop()?.split('?')[0] ?? url) }
    catch { return url }
  }

  return (
    <div className="bg-black/30 border border-gray-700 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        📄 Documentos oficiais (base da publicação)
      </p>

      {urls.length > 0 && (
        <div className="space-y-1.5">
          {urls.map((u, i) => (
            <div key={u} className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
              <a
                href={u}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex-1 truncate"
              >
                📎 {fileName(u)}
              </a>
              <button
                type="button"
                onClick={() => handleRemove(u, i)}
                disabled={uploadingIdx === i}
                className="text-[11px] text-gray-600 hover:text-red-400 transition-colors shrink-0 disabled:opacity-40"
              >
                {uploadingIdx === i ? '…' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm bg-f1gray hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {uploading ? 'A carregar...' : '⬆️ Adicionar ficheiro(s)'}
        </button>
        <span className="text-[11px] text-gray-600">{urls.length}/6 ficheiros · PDF, JPG, PNG ou WebP · máx. 10MB cada</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
