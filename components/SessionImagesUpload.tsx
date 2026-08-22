'use client'

import { useState, useRef } from 'react'

export type SessionImage = { label: string; url: string }

const SPRINT_SESSIONS  = ['FP1', 'Sprint Qualifying', 'Sprint Race', 'Qualifying', 'Starting Grid']
const NORMAL_SESSIONS  = ['FP1', 'FP2', 'FP3', 'Qualifying', 'Starting Grid']

export default function SessionImagesUpload({
  gpId,
  isSprint,
  currentImages,
}: {
  gpId: number
  isSprint: boolean
  currentImages: SessionImage[]
}) {
  const sessions = isSprint ? SPRINT_SESSIONS : NORMAL_SESSIONS
  const [images, setImages]     = useState<SessionImage[]>(currentImages)
  const [uploading, setUploading] = useState<string | null>(null)
  const [error, setError]       = useState('')
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function getImg(label: string) {
    return images.find(i => i.label === label)
  }

  async function handleUpload(label: string, file: File) {
    if (file.size > 10 * 1024 * 1024) { setError('Ficheiro demasiado grande (máx. 10MB).'); return }
    setUploading(label); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('gp_id', String(gpId))
      form.append('label', label)
      const res    = await fetch('/api/admin/upload-session-image', { method: 'POST', body: form })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error ?? 'Erro ao carregar.')
      setImages(result.images)
    } catch (err: any) {
      setError(err.message ?? 'Erro.')
    } finally {
      setUploading(null)
    }
  }

  async function handleRemove(label: string) {
    setUploading(label); setError('')
    try {
      const res    = await fetch('/api/admin/upload-session-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gp_id: gpId, remove_label: label }),
      })
      const result = await res.json()
      if (!res.ok || result.error) throw new Error(result.error ?? 'Erro.')
      setImages(result.images)
    } catch (err: any) {
      setError(err.message ?? 'Erro.')
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="bg-black/30 border border-gray-700 rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
        🏁 Resultados das Sessões
        <span className="ml-2 text-gray-600 normal-case font-normal">(visíveis no formulário de previsões)</span>
      </p>

      <div className="grid grid-cols-5 gap-2">
        {sessions.map(label => {
          const img       = getImg(label)
          const isLoading = uploading === label
          return (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center leading-tight">
                {label}
              </span>

              <div className="relative rounded-lg overflow-hidden border border-gray-700/60 bg-gray-900/50"
                   style={{ aspectRatio: '9/16' }}>
                {img ? (
                  <>
                    <img src={img.url} alt={label} className="w-full h-full object-cover" />
                    {isLoading ? (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-xs text-white">…</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRemove(label)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-[10px] flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputRefs.current[label]?.click()}
                    disabled={isLoading}
                    className="w-full h-full flex flex-col items-center justify-center text-gray-600 hover:text-gray-400 transition-colors gap-1 disabled:opacity-40"
                  >
                    {isLoading
                      ? <span className="text-xs">…</span>
                      : <>
                          <span className="text-lg">⬆</span>
                          <span className="text-[8px] font-bold uppercase tracking-widest">Upload</span>
                        </>
                    }
                  </button>
                )}
              </div>

              <input
                ref={el => { inputRefs.current[label] = el }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) { handleUpload(label, file); e.target.value = '' }
                }}
              />
            </div>
          )
        })}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
