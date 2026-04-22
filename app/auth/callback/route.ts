import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Password recovery — send to update-password page
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/update-password`)
      }

      // Normal login — check if member profile exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { data: member } = await (supabase as any)
          .from('members')
          .select('email')
          .eq('email', user.email)
          .single()

        if (!member) {
          return NextResponse.redirect(`${origin}/register`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
