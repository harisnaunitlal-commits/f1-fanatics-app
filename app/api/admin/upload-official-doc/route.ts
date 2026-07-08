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

    // Multipart: upload one file, append to existing array
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const file = form.get('file') as File | null
      const gpId = form.get('gp_id') as string | null

      if (!file || !gpId) return NextResponse.json({ error: 'Ficheiro e gp_id obrigatórios.' }, { status: 400 })
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Ficheiro demasiado grande (máx. 10MB).' }, { status: 400 })

      const ext = file.name.split('.').pop() || 'bin'
      const path = `${gpId}/oficial-${Date.now()}.${ext}`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadErr } = await supabaseAdmin.storage
        .from('resultados-oficiais')
        .upload(path, buffer, { upsert: true, contentType: file.type })
      if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 400 })

      const { data: urlData } = supabaseAdmin.storage.from('resultados-oficiais').getPublicUrl(path)
      const newUrl = urlData.publicUrl

      // Fetch existing URLs and append
      const { data: gp } = await supabaseAdmin
        .from('gp_calendar').select('resultado_oficial_urls').eq('id', parseInt(gpId)).single()
      const existing: string[] = (gp as any)?.resultado_oficial_urls ?? []
      const updated = [...existing, newUrl]

      const { error: updErr } = await supabaseAdmin
        .from('gp_calendar')
        .update({ resultado_oficial_urls: updated })
        .eq('id', parseInt(gpId))
      if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 })

      return NextResponse.json({ success: true, url: newUrl, urls: updated })
    }

    // JSON: remove one URL from array, or clear all
    const body = await req.json()
    const { gp_id, remove_url, clear_all } = body

    if (!gp_id) return NextResponse.json({ error: 'gp_id obrigatório.' }, { status: 400 })

    if (clear_all) {
      await supabaseAdmin.from('gp_calendar').update({ resultado_oficial_urls: [] }).eq('id', gp_id)
      return NextResponse.json({ success: true, urls: [] })
    }

    if (remove_url) {
      const { data: gp } = await supabaseAdmin
        .from('gp_calendar').select('resultado_oficial_urls').eq('id', gp_id).single()
      const existing: string[] = (gp as any)?.resultado_oficial_urls ?? []
      const updated = existing.filter((u: string) => u !== remove_url)
      await supabaseAdmin.from('gp_calendar').update({ resultado_oficial_urls: updated }).eq('id', gp_id)
      return NextResponse.json({ success: true, urls: updated })
    }

    return NextResponse.json({ error: 'Acção inválida.' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
