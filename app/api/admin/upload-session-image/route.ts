import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function getAdminUser(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null
  const { data: member } = await supabaseAdmin.from('members').select('is_admin').eq('email', user.email).single()
  if (!member?.is_admin) return null
  return user
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser(req)
    if (!user) return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })

    const contentType = req.headers.get('content-type') ?? ''

    // Upload de imagem para uma sessão
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file   = form.get('file')   as File | null
      const gpId   = form.get('gp_id') as string | null
      const label  = form.get('label') as string | null

      if (!file || !gpId || !label)
        return NextResponse.json({ error: 'file, gp_id e label são obrigatórios.' }, { status: 400 })
      if (file.size > 10 * 1024 * 1024)
        return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 10MB).' }, { status: 400 })

      const ext  = file.name.split('.').pop() || 'jpg'
      const slug = label.toLowerCase().replace(/[\s/]+/g, '-')
      const path = `${gpId}/session-${slug}-${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadErr } = await supabaseAdmin.storage
        .from('resultados-oficiais')
        .upload(path, buffer, { upsert: true, contentType: file.type })
      if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 })

      const { data: urlData } = supabaseAdmin.storage.from('resultados-oficiais').getPublicUrl(path)
      const newUrl = urlData.publicUrl

      const { data: gp } = await supabaseAdmin
        .from('gp_calendar').select('session_images').eq('id', parseInt(gpId)).single()
      const existing: { label: string; url: string }[] = (gp as any)?.session_images ?? []
      const updated = [...existing.filter(i => i.label !== label), { label, url: newUrl }]

      await supabaseAdmin.from('gp_calendar').update({ session_images: updated }).eq('id', parseInt(gpId))
      return NextResponse.json({ success: true, images: updated })
    }

    // Remover imagem de uma sessão
    const body = await req.json()
    const { gp_id, remove_label } = body
    if (!gp_id) return NextResponse.json({ error: 'gp_id obrigatório.' }, { status: 400 })

    const { data: gp } = await supabaseAdmin
      .from('gp_calendar').select('session_images').eq('id', gp_id).single()
    const existing: { label: string; url: string }[] = (gp as any)?.session_images ?? []
    const updated = existing.filter(i => i.label !== remove_label)
    await supabaseAdmin.from('gp_calendar').update({ session_images: updated }).eq('id', gp_id)
    return NextResponse.json({ success: true, images: updated })

  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
