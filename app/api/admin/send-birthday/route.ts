import { createClient } from '@/lib/supabase/server'
import { sendBirthdayEmail } from '@/lib/email'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })

  const { data: me } = await (supabase as any)
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const { emails: targetEmails } = await req.json().catch(() => ({ emails: null }))

  // Get members with today's birthday (match by month and day)
  const { data: members, error } = await (supabase as any)
    .from('members')
    .select('email, nome_completo, nickname, data_nasc, criado_em, sexo')
    .not('data_nasc', 'is', null)
    .not('email', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Today in Mozambique time (UTC+2)
  const now = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const todayMonth = now.getUTCMonth() + 1
  const todayDay   = now.getUTCDate()

  const birthdayMembers = (members ?? []).filter((m: any) => {
    if (!m.data_nasc) return false
    const d = new Date(m.data_nasc)
    const month = d.getUTCMonth() + 1
    const day   = d.getUTCDate()
    return month === todayMonth && day === todayDay
  })

  // If specific emails provided (test mode), filter to those
  const toSend = targetEmails
    ? birthdayMembers.filter((m: any) => targetEmails.includes(m.email))
    : birthdayMembers

  if (toSend.length === 0) {
    return NextResponse.json({ sent: 0, members: [] })
  }

  // Get total play pts per member
  const { data: scores } = await (supabase as any)
    .from('scores_play')
    .select('member_email, total')

  const playPts = new Map<string, number>()
  for (const s of scores ?? []) {
    playPts.set(s.member_email, (playPts.get(s.member_email) ?? 0) + (s.total ?? 0))
  }

  const results: { email: string; success: boolean; error?: string }[] = []

  for (const m of toSend) {
    const birthYear = m.data_nasc ? new Date(m.data_nasc).getUTCFullYear() : null
    const idade = birthYear ? now.getUTCFullYear() - birthYear : null

    try {
      await sendBirthdayEmail({
        toEmail: m.email,
        toName: m.nome_completo?.split(' ')[0] ?? m.nickname,
        nickname: m.nickname,
        idade,
        membroDesde: m.criado_em ?? null,
        totalPlayPts: playPts.get(m.email) ?? 0,
      })
      results.push({ email: m.email, success: true })
    } catch (err: any) {
      results.push({ email: m.email, success: false, error: err?.message })
    }
  }

  const sent = results.filter(r => r.success).length
  return NextResponse.json({
    sent,
    total: toSend.length,
    members: toSend.map((m: any) => ({ email: m.email, nickname: m.nickname, data_nasc: m.data_nasc })),
    results,
  })
}
