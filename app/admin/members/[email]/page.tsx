export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminMemberDetailPage({
  params,
}: {
  params: { email: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: me } = await (supabase as any)
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  const email = decodeURIComponent(params.email)

  const { data: m } = await (supabase as any)
    .from('members').select('*').eq('email', email).single()

  if (!m) redirect('/admin/members')

  const { data: playScores } = await (supabase as any)
    .from('scores_play')
    .select('total, gp_id, gp_calendar(nome, emoji_bandeira, round)')
    .eq('member_email', email)
    .order('gp_id')

  const { data: predictions } = await (supabase as any)
    .from('predictions')
    .select('gp_id, gp_calendar(nome, emoji_bandeira, round)')
    .eq('member_email', email)
    .order('gp_id')

  const totalPlay = playScores?.reduce((acc: number, s: any) => acc + (s.total ?? 0), 0) ?? 0
  const gpsPlayed = playScores?.filter((s: any) => (s.total ?? 0) > 0).length ?? 0
  const totalPredictions = predictions?.length ?? 0

  const lastAccess = m.ultimo_acesso ? new Date(m.ultimo_acesso) : null
  const memberSince = new Date(m.criado_em)

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Back */}
      <div>
        <Link href="/admin/members" className="text-gray-500 hover:text-white text-sm">← Membros</Link>
      </div>

      {/* Header */}
      <div className="card">
        <div className="flex items-start gap-4 flex-wrap">
          {m.foto_url
            ? <img src={m.foto_url} alt="" className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-f1red/30" />
            : <div className="w-16 h-16 rounded-full bg-f1red/20 text-f1red flex items-center justify-center text-2xl font-black shrink-0">
                {m.nickname.charAt(0).toUpperCase()}
              </div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white">{m.nickname}</h1>
              {m.is_admin && <span className="text-xs bg-f1red/20 text-f1red px-2 py-0.5 rounded font-bold">Admin</span>}
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                m.activo ? 'bg-green-900/40 text-green-400' : 'bg-gray-800 text-gray-500'
              }`}>{m.activo ? 'Activo' : 'Inactivo'}</span>
            </div>
            {m.nome_completo && <p className="text-gray-400 mt-0.5">{m.nome_completo}</p>}
            {m.bio && <p className="text-gray-500 text-sm mt-1 italic">"{m.bio}"</p>}
            <p className="text-gray-600 text-xs mt-2">{m.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-f1red">{totalPlay}</div>
          <div className="text-xs text-gray-500 mt-1">Pontos F1 Play</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-f1red">{gpsPlayed}</div>
          <div className="text-xs text-gray-500 mt-1">GPs participados</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-f1red">{totalPredictions}</div>
          <div className="text-xs text-gray-500 mt-1">Previsões</div>
        </div>
      </div>

      {/* Profile details */}
      <div className="card space-y-4">
        <h2 className="font-bold text-gray-300">📋 Detalhes do perfil</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            { label: '📧 Email',           value: m.email },
            { label: '📍 Localização',      value: m.cidade ? `${m.cidade}, ${m.pais}` : m.pais },
            { label: '🏎️ Piloto favorito',  value: m.piloto_fav },
            { label: '🏁 Equipa favorita',  value: m.equipa_fav },
            { label: '🎮 Nick Fantasy',     value: m.fantasy_nick },
            { label: '📊 Nick Predict',     value: m.predict_nick },
            { label: '📅 Membro desde',     value: memberSince.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' }) },
            { label: '🕐 Último acesso',    value: lastAccess ? lastAccess.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sem registo' },
          ].map(row => row.value ? (
            <div key={row.label} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-500">{row.label}</span>
              <span className="text-white font-medium">{row.value}</span>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Play history */}
      {playScores && playScores.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-300 mb-4">🏆 Histórico F1 Play</h2>
          <div className="space-y-2">
            {playScores.map((s: any) => {
              const gp = s.gp_calendar as any
              return (
                <div key={s.gp_id} className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">
                    {gp?.emoji_bandeira} R{String(gp?.round ?? 0).padStart(2, '0')} {gp?.nome}
                  </span>
                  <span className={`font-bold text-sm ${
                    s.total >= 10 ? 'text-green-400' : s.total >= 6 ? 'text-yellow-400' : 'text-gray-400'
                  }`}>{s.total} pts</span>
                </div>
              )
            })}
            <div className="border-t border-gray-700 pt-2 flex justify-between">
              <span className="text-gray-500 text-sm font-medium">Total</span>
              <span className="font-black text-white">{totalPlay} pts</span>
            </div>
          </div>
        </div>
      )}

      {/* Predictions list */}
      {predictions && predictions.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-300 mb-4">📋 GPs com previsão submetida</h2>
          <div className="flex flex-wrap gap-2">
            {predictions.map((p: any) => {
              const gp = p.gp_calendar as any
              return (
                <span key={p.gp_id} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">
                  {gp?.emoji_bandeira} {gp?.nome}
                </span>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
