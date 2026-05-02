import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Uses service role — bypasses RLS and auto-confirms email
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email, password,
      nickname, nome_completo, cidade, pais, whatsapp,
      piloto_fav, equipa_fav, fantasy_nick, predict_nick, bio,
      foto_url,
    } = body

    if (!email || !password || !nickname) {
      return NextResponse.json({ error: 'Campos obrigatórios em falta.' }, { status: 400 })
    }

    const userEmail = (email as string).toLowerCase().trim()

    // ── Step 1: Find existing user or create new ─────────────────
    // First check if user already exists — avoids triggering rate limits
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = listData?.users?.find(u => u.email === userEmail)

    if (existingUser) {
      // User exists — update password and confirm email
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
      })
    } else {
      // New user — create with auto-confirmed email
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password,
        email_confirm: true,
      })

      if (createErr) {
        // Rate limit or other error — return friendly message
        if (
          createErr.message.toLowerCase().includes('security purposes') ||
          createErr.message.toLowerCase().includes('rate limit') ||
          createErr.message.toLowerCase().includes('after')
        ) {
          return NextResponse.json(
            { error: 'Demasiadas tentativas. Aguarda 60 segundos e tenta novamente.' },
            { status: 429 }
          )
        }
        return NextResponse.json({ error: createErr.message }, { status: 400 })
      }
    }

    // ── Step 2: Insert/update member profile ────────────────────
    const memberData: Record<string, unknown> = {
      email: userEmail,
      nickname: (nickname as string).trim(),
      nome_completo: nome_completo?.trim() || null,
      cidade: cidade?.trim() || null,
      pais: pais?.trim() || null,
      whatsapp: whatsapp?.trim() || null,
      piloto_fav: piloto_fav || null,
      equipa_fav: equipa_fav || null,
      fantasy_nick: fantasy_nick?.trim() || null,
      predict_nick: predict_nick?.trim() || null,
      bio: bio?.trim() || null,
      activo: true,
      actualizado_em: new Date().toISOString(),
    }

    if (foto_url) memberData.foto_url = foto_url

    const { error: memberErr } = await supabaseAdmin
      .from('members')
      .upsert(memberData, { onConflict: 'email' })

    if (memberErr) {
      return NextResponse.json({ error: memberErr.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
