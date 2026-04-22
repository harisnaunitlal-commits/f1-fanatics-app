export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SignOutButton from './SignOutButton'
import AvatarUpload from '@/components/AvatarUpload'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) redirect('/auth/login')

  const { data: member } = await (supabase as any)
    .from('members')
    .select('*')
    .eq('email', user.email)
    .single()

  if (!member) redirect('/register')

  const { data: playScores } = await (supabase as any)
    .from('scores_play')
    .select('total, gp_id, gp_calendar(nome, emoji_bandeira, round)')
    .eq('member_email', user.email)
    .order('gp_id')

  const totalPlay =
    playScores?.reduce((acc: number, s: any) => acc + (s.total ?? 0), 0) ?? 0

  const gpsPlayed =
    playScores?.filter((s: any) => (s.total ?? 0) > 0).length ?? 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header — avatar + name + actions */}
      <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
        <div className="flex items-center gap-5">
          {/* Clickable avatar upload */}
          <AvatarUpload
            email={user.email!}
            currentUrl={member.foto_url}
            nickname={member.nickname}
          />
          <div>
            <h1 className="text-2xl font-bold">{member.nickname}</h1>
            <p className="text-gray-400">{member.nome_completo}</p>
            {member.bio && (
              <p className="text-gray-500 text-sm mt-1 italic">"{member.bio}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 self-start">
          <Link href="/register" className="btn-secondary text-sm py-2 px-4">
            ✏️ Editar perfil
          </Link>
          <SignOutButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-black text-f1red">{totalPlay}</div>
          <div className="text-xs text-gray-500 mt-1">Pontos F1 Play</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-black text-f1red">{gpsPlayed}</div>
          <div className="text-xs text-gray-500 mt-1">GPs participados</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-black text-f1red">
            {gpsPlayed > 0 ? (totalPlay / gpsPlayed).toFixed(1) : '—'}
          </div>
          <div className="text-xs text-gray-500 mt-1">Média por GP</div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="font-bold mb-4">Detalhes do perfil</h2>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          {member.piloto_fav && (
            <>
              <span className="text-gray-500">Piloto favorito</span>
              <span>{member.piloto_fav}</span>
            </>
          )}
          {member.equipa_fav && (
            <>
              <span className="text-gray-500">Equipa favorita</span>
              <span>{member.equipa_fav}</span>
            </>
          )}
          {member.fantasy_nick && (
            <>
              <span className="text-gray-500">Nick Fantasy</span>
              <span className="font-mono text-xs">{member.fantasy_nick}</span>
            </>
          )}
          {member.predict_nick && (
            <>
              <span className="text-gray-500">Nick Predict</span>
              <span className="font-mono text-xs">{member.predict_nick}</span>
            </>
          )}
          {member.cidade && (
            <>
              <span className="text-gray-500">Cidade</span>
              <span>
                {member.cidade}, {member.pais}
              </span>
            </>
          )}
          <span className="text-gray-500">Membro desde</span>
          <span>
            {new Date(member.criado_em).toLocaleDateString('pt-MZ', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {playScores && playScores.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-4">Histórico F1 Play</h2>
          <div className="space-y-2">
            {playScores.map((s: any) => {
              const gp = s.gp_calendar as {
                nome: string
                emoji_bandeira: string
                round: number
              } | null

              return (
                <div key={s.gp_id} className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {gp?.emoji_bandeira} R{String(gp?.round ?? 0).padStart(2, '0')} {gp?.nome}
                  </span>
                  <span
                    className={`font-bold ${
                      s.total >= 10
                        ? 'text-green-400'
                        : s.total >= 6
                          ? 'text-yellow-400'
                          : 'text-gray-400'
                    }`}
                  >
                    {s.total} pts
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}