'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  email: string
  currentUrl: string | null
  nickname: string
}

export default function AvatarUpload({ email, currentUrl, nickname }: Props) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const initial = nickname.charAt(0).toUpperCase()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Foto demasiado grande. Máximo 2MB.')
      return
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setError('')
    setSuccess(false)
    setUploading(true)

    try {
      // Upload to Supabase Storage: avatars/{email}/avatar.jpg
      const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${email}/avatar.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })

      if (uploadErr) throw uploadErr

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path)

      const publicUrl = urlData.publicUrl + `?v=${Date.now()}`

      // Update members table
      const { error: dbErr, data: dbData } = await (supabase as any)
        .from('members')
        .update({ foto_url: urlData.publicUrl, actualizado_em: new Date().toISOString() })
        .eq('email', email)
        .select()

      if (dbErr) throw new Error(`DB: ${dbErr.message}`)
      if (!dbData || dbData.length === 0) throw new Error('Sem permissão para actualizar. Contacta o admin.')

      setPreviewUrl(publicUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao carregar foto.')
      setPreviewUrl(currentUrl)
    } finally {
      setUploading(false)
      // Reset input so same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleRemove() {
    if (!previewUrl) return
    setUploading(true)
    setError('')

    try {
      // Remove all possible extensions
      for (const ext of ['jpg', 'png', 'webp']) {
        await supabase.storage.from('avatars').remove([`${email}/avatar.${ext}`])
      }

      await (supabase as any)
        .from('members')
        .update({ foto_url: null })
        .eq('email', email)

      setPreviewUrl(null)
    } catch (err: any) {
      setError(err.message ?? 'Erro ao remover foto.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle — click to upload */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative group focus:outline-none"
        title="Clica para mudar foto"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={nickname}
            className="w-24 h-24 rounded-full object-cover border-2 border-f1red ring-2 ring-f1red/30 group-hover:ring-f1red/60 transition-all"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-f1red/20 text-f1red text-3xl flex items-center justify-center font-black border-2 border-f1red ring-2 ring-f1red/30 group-hover:ring-f1red/60 transition-all">
            {initial}
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </button>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Action text */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-xs text-f1red hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {uploading ? 'A carregar...' : previewUrl ? '📷 Mudar foto' : '📷 Adicionar foto'}
        </button>
        {previewUrl && !uploading && (
          <>
            <span className="text-gray-700 mx-1">·</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs text-gray-600 hover:text-red-400 transition-colors"
            >
              Remover
            </button>
          </>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 rounded px-3 py-1">{error}</p>
      )}
      {success && (
        <p className="text-xs text-green-400 bg-green-900/20 rounded px-3 py-1">
          ✅ Foto actualizada!
        </p>
      )}

      <p className="text-xs text-gray-600">JPG, PNG ou WebP · máx. 2MB</p>
    </div>
  )
}
