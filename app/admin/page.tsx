import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: member } = await supabase
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!member?.is_admin) redirect('/')

  const { data: gps } = await supabase
    .from('gp_calendar')
    .select('*')
    .eq('temporada', 2026)
    .order('round')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Painel Admin</h1>
      <p className="text-gray-400 mb-8">Gestão de respostas, pontuações e dados das ligas.</p>

      <div className="grid gap-3">
        {gps?.map(gp => (
          <div key={gp.id} className="card flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{gp.emoji_bandeira}</span>
              <div>
                <div className="font-bold">R{String(gp.round).padStart(2,'0')} · {gp.nome}</div>
                <div className="text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    gp.status === 'scored'   ? 'bg-green-900/50 text-green-400' :
                    gp.status === 'closed'   ? 'bg-yellow-900/50 text-yellow-400' :
                    gp.status === 'active'   ? 'bg-blue-900/50 text-blue-400' :
                    'bg-gray-700 text-gray-400'
                  }`}>{gp.status.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/admin/answers/${gp.id}`} className="btn-secondary text-sm py-2 px-3">
                Respostas
              </Link>
              <Link href={`/admin/scores/${gp.id}`} className="btn-primary text-sm py-2 px-3">
                Calcular pts
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/admin/fantasy" className="card text-center hover:border-f1red/50 transition-colors">
          <div className="text-2xl mb-2">🏅</div>
          <div className="font-bold">Fantasy</div>
          <div className="text-sm text-gray-400">Importar pontuações</div>
        </Link>
        <Link href="/admin/predict-scores" className="card text-center hover:border-f1red/50 transition-colors">
          <div className="text-2xl mb-2">📊</div>
          <div className="font-bold">F1 Predict</div>
          <div className="text-sm text-gray-400">Importar pontuações</div>
        </Link>
        <Link href="/admin/members" className="card text-center hover:border-f1red/50 transition-colors">
          <div className="text-2xl mb-2">👥</div>
          <div className="font-bold">Membros</div>
          <div className="text-sm text-gray-400">Gerir membros</div>
        </Link>
      </div>
    </div>
  )
}
