import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

interface PollOption { code: string; name: string; team: string; colour: string; pts: number }

// Fun polls (do not count for the Triatlo). Members read the poll and vote (or change the vote) until it closes.
async function load(slug: string, email: string) {
  const db = createServiceClient()
  const { data: poll } = await db.from('fun_polls').select('*').eq('slug', slug).maybeSingle()
  if (!poll) return null
  const { data: votes } = await db.from('fun_poll_votes').select('member_email, choice').eq('slug', slug)
  const { data: members } = await db.from('members').select('email, nickname')
  const nick = new Map((members ?? []).map(m => [m.email as string, (m.nickname as string) ?? (m.email as string).split('@')[0]]))
  const options = poll.options as PollOption[]
  const closed = Date.now() >= Date.parse(poll.closes_at)
  const counts: Record<string, number> = {}
  for (const o of options) counts[o.code] = 0
  for (const v of votes ?? []) counts[v.choice] = (counts[v.choice] ?? 0) + 1
  const mine = (votes ?? []).find(v => v.member_email === email)?.choice ?? null
  // who picked whom is only shown once the votes are closed
  const voters: Record<string, string[]> | null = closed
    ? Object.fromEntries(options.map(o => [o.code, (votes ?? []).filter(v => v.choice === o.code).map(v => nick.get(v.member_email) ?? v.member_email.split('@')[0]).sort((a, b) => a.localeCompare(b))]))
    : null
  return {
    slug: poll.slug as string, title: poll.title as string, question: poll.question as string, note: poll.note as string | null,
    options, closesAt: Date.parse(poll.closes_at), serverNow: Date.now(), closed, result: poll.result as string | null,
    counts, total: (votes ?? []).length, mine, voters,
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const slug = req.nextUrl.searchParams.get('slug') ?? 'segundo-lugar-2026'
  const data = await load(slug, user?.email ?? '')
  if (!data) return NextResponse.json({ error: 'Votação não encontrada.' }, { status: 404 })
  return NextResponse.json({ ...data, loggedIn: !!user?.email })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return NextResponse.json({ error: 'Faz login para votar.' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const slug = typeof body.slug === 'string' ? body.slug : 'segundo-lugar-2026'
  const choice = typeof body.choice === 'string' ? body.choice : ''
  const db = createServiceClient()
  const { data: poll } = await db.from('fun_polls').select('options, closes_at').eq('slug', slug).maybeSingle()
  if (!poll) return NextResponse.json({ error: 'Votação não encontrada.' }, { status: 404 })
  if (Date.now() >= Date.parse(poll.closes_at)) return NextResponse.json({ error: 'As votações já encerraram.' }, { status: 400 })
  if (!(poll.options as PollOption[]).some(o => o.code === choice)) return NextResponse.json({ error: 'Opção inválida.' }, { status: 400 })
  const { data: me } = await db.from('members').select('email').eq('email', user.email).maybeSingle()
  if (!me) return NextResponse.json({ error: 'Só membros registados podem votar.' }, { status: 403 })
  const { error } = await db.from('fun_poll_votes').upsert({ slug, member_email: user.email, choice, updated_at: new Date().toISOString() }, { onConflict: 'slug,member_email' })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(await load(slug, user.email))
}
