export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isDeadlinePassed } from '@/lib/scoring'
import CalcRankingButton from './CalcRankingButton'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const { data: me } = await (supabase as any)
    .from('members').select('is_admin').eq('email', user.email).single()
  if (!me?.is_admin) redirect('/')

  // ── Data fetches ──────────────────────────────────────────────────────────
  const [
    { data: gps },
    { data: members },
    { data: allPredictions },
    { data: playScores },
  ] = await Promise.all([
    (supabase as any).from('gp_calendar').select('*').eq('temporada', 2026).order('round'),
    (supabase as any).from('members').select('*').order('nickname'),
    (supabase as any).from('predictions').select('member_email, gp_id'),
    (supabase as any).from('scores_play').select('member_email, total'),
  ])

  const totalMembers: number = members?.length ?? 0
  const activeMembers: number = members?.filter((m: any) => m.activo)?.length ?? 0
  const gpsScored: number = gps?.filter((g: any) => g.status === 'scored')?.length ?? 0
  const totalPredictions: number = allPredictions?.length ?? 0

  // Next upcoming GP
  const nextGp = gps?.find((g: any) => g.status === 'upcoming' || g.status === 'active') ?? null
  const isOpen = nextGp && !isDeadlinePassed(nextGp.deadline_play)

  // Submissions per GP
  const submissionsPerGp = new Map<number, Set<string>>()
  for (const p of allPredictions ?? []) {
    if (!submissionsPerGp.has(p.gp_id)) submissionsPerGp.set(p.gp_id, new Set())
    submissionsPerGp.get(p.gp_id)!.add(p.member_email)
  }

  // Next GP: who submitted, who hasn't
  const nextGpSubmitted: Set<string> = nextGp
    ? (submissionsPerGp.get(nextGp.id) ?? new Set())
    : new Set()

  const submitted = (members ?? []).filter((m: any) => nextGpSubmitted.has(m.email))
  const pending   = (members ?? []).filter((m: any) => !nextGpSubmitted.has(m.email))
  const pct = totalMembers > 0 ? Math.round((submitted.length / totalMembers) * 100) : 0

  // Total Play pts per member
  const playPts = new Map<string, number>()
  for (const s of playScores ?? []) {
    playPts.set(s.member_email, (playPts.get(s.member_email) ?? 0) + (s.total ?? 0))
  }

  // ── Activity stats ────────────────────────────────────────────────────────
  const now = Date.now()
  const active24h  = members?.filter((m: any) => m.ultimo_acesso && (now - new Date(m.ultimo_acesso).getTime()) < 86400000).length ?? 0
  const active7d   = members?.filter((m: any) => m.ultimo_acesso && (now - new Date(m.ultimo_acesso).getTime()) < 7 * 86400000).length ?? 0
  const active30d  = members?.filter((m: any) => m.ultimo_acesso && (now - new Date(m.ultimo_acesso).getTime()) < 30 * 86400000).length ?? 0

  // New members by month (last 6 months)
  const monthLabels: string[] = []
  const monthCounts: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const y = d.getFullYear()
    const mo = d.getMonth()
    const label = d.toLocaleDateString('pt-MZ', { month: 'short', year: '2-digit' })
    monthLabels.push(label)
    const count = members?.filter((m: any) => {
      const created = new Date(m.criado_em)
      return created.getFullYear() === y && created.getMonth() === mo
    }).length ?? 0
    monthCounts.push(count)
  }
  const maxMonthCount = Math.max(...monthCounts, 1)

  // Recently joined (last 30 days)
  const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString()
  const recentMembers = (members ?? [])
    .filter((m: any) => m.criado_em > thirtyDaysAgo)
    .sort((a: any, b: any) => b.criado_em.localeCompare(a.criado_em))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-1">Painel Admin</h1>
        <p className="text-gray-500 text-sm">Vista geral da plataforma Beira F1 Fanatics 2026</p>
      </div>

      {/* ── Platform stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Membros',         value: totalMembers,    sub: `${activeMembers} activos`,       icon: '👥', color: 'text-blue-400' },
          { label: 'GPs pontuados',   value: gpsScored,       sub: `de ${gps?.length ?? 0} no calendário`, icon: '🏁', color: 'text-green-400' },
          { label: 'Total previsões', value: totalPredictions,sub: 'todas as corridas',               icon: '📋', color: 'text-yellow-400' },
          { label: 'Participação',    value: `${pct}%`,        sub: nextGp ? `GP ${nextGp.nome}` : '—', icon: '📊', color: 'text-f1red' },
        ].map(stat => (
          <div key={stat.label} className="card text-center py-5">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-xs font-bold text-white mt-1">{stat.label}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Next GP submissions tracker ─────────────────────────────────── */}
      {nextGp && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-bold text-lg">
                {nextGp.emoji_bandeira} GP {nextGp.nome} — Previsões
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {isOpen ? '🟢 Apostas abertas' : '🔴 Apostas fechadas'} ·{' '}
                <span className="text-yellow-400 font-bold">{submitted.length}</span>
                <span className="text-gray-500"> / {totalMembers} membros submeteram</span>
              </p>
            </div>
            <span className="text-3xl font-black text-yellow-400">{submitted.length}/{totalMembers}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden mb-5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-f1red to-yellow-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Submitted */}
            <div>
              <h3 className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">
                ✅ Já submeteram ({submitted.length})
              </h3>
              <div className="space-y-1.5">
                {submitted.length === 0 && (
                  <p className="text-gray-600 text-sm italic">Nenhum ainda.</p>
                )}
                {submitted.map((m: any) => (
                  <div key={m.email} className="flex items-center gap-2 bg-green-900/10 border border-green-700/20 rounded-lg px-3 py-2">
                    {m.foto_url
                      ? <img src={m.foto_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      : <div className="w-7 h-7 rounded-full bg-green-800/40 text-green-400 flex items-center justify-center text-xs font-bold shrink-0">
                          {m.nickname.charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="text-sm font-medium text-white">{m.nickname}</span>
                    {m.is_admin && <span className="text-[10px] bg-f1red/20 text-f1red px-1.5 py-0.5 rounded font-bold ml-auto">Admin</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Pending */}
            <div>
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">
                ⏳ Ainda não submeteram ({pending.length})
              </h3>
              <div className="space-y-1.5">
                {pending.length === 0 && (
                  <p className="text-gray-600 text-sm italic">Todos submeteram! 🎉</p>
                )}
                {pending.map((m: any) => (
                  <div key={m.email} className="flex items-center gap-2 bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2">
                    {m.foto_url
                      ? <img src={m.foto_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 opacity-50" />
                      : <div className="w-7 h-7 rounded-full bg-gray-700 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
                          {m.nickname.charAt(0).toUpperCase()}
                        </div>
                    }
                    <span className="text-sm text-gray-400">{m.nickname}</span>
                    {!m.activo && <span className="text-[10px] bg-gray-700 text-gray-500 px-1.5 py-0.5 rounded ml-auto">inactivo</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GP Management ───────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-lg mb-3">📅 Gestão de GPs</h2>
        <div className="grid gap-3">
          {gps?.map((gp: any) => {
            const count = submissionsPerGp.get(gp.id)?.size ?? 0
            const pctGp = totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0
            return (
              <div key={gp.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{gp.emoji_bandeira}</span>
                  <div className="min-w-0">
                    <div className="font-bold truncate">
                      R{String(gp.round).padStart(2, '0')} · {gp.nome}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        gp.status === 'scored'   ? 'bg-green-900/50 text-green-400' :
                        gp.status === 'closed'   ? 'bg-yellow-900/50 text-yellow-400' :
                        gp.status === 'active'   ? 'bg-blue-900/50 text-blue-400' :
                                                   'bg-gray-700 text-gray-400'
                      }`}>
                        {gp.status.toUpperCase()}
                      </span>
                      {count > 0 && (
                        <span className="text-xs text-gray-400">
                          📋 <span className="text-white font-bold">{count}</span>/{totalMembers} previsões
                          <span className="text-gray-600 ml-1">({pctGp}%)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                  <Link href={`/admin/answers/${gp.id}`} className="btn-secondary text-sm py-2 px-3">
                    Respostas
                  </Link>
                  <Link href={`/admin/scores/${gp.id}`} className="btn-primary text-sm py-2 px-3">
                    Calcular pts
                  </Link>
                  {(gp.status === 'scored' || gp.status === 'closed') && (
                    <CalcRankingButton
                      gpId={gp.id}
                      gpNome={gp.nome}
                      adminEmail={user.email!}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Activity stats ──────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-lg mb-3">📈 Actividade</h2>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Últimas 24h',  value: active24h,  color: 'text-green-400' },
            { label: 'Últimos 7 dias', value: active7d, color: 'text-yellow-400' },
            { label: 'Últimos 30 dias', value: active30d, color: 'text-blue-400' },
          ].map(s => (
            <div key={s.label} className="card text-center py-4">
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* New members by month bar chart */}
        <div className="card">
          <h3 className="font-bold text-sm text-gray-400 mb-4">👥 Novos membros por mês</h3>
          <div className="flex items-end gap-2 h-24">
            {monthLabels.map((label, i) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs font-bold text-gray-400">
                  {monthCounts[i] > 0 ? monthCounts[i] : ''}
                </div>
                <div
                  className="w-full rounded-t-md bg-f1red/70 transition-all"
                  style={{ height: `${Math.max((monthCounts[i] / maxMonthCount) * 72, monthCounts[i] > 0 ? 8 : 2)}px` }}
                />
                <div className="text-[9px] text-gray-600 text-center">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recently joined ─────────────────────────────────────────────── */}
      {recentMembers.length > 0 && (
        <div>
          <h2 className="font-bold text-lg mb-3">🆕 Novos membros (últimos 30 dias)</h2>
          <div className="card divide-y divide-gray-800">
            {recentMembers.map((m: any) => (
              <div key={m.email} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5">
                  {m.foto_url
                    ? <img src={m.foto_url} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                    : <div className="w-7 h-7 rounded-full bg-f1red/20 text-f1red flex items-center justify-center text-xs font-bold shrink-0">
                        {m.nickname.charAt(0).toUpperCase()}
                      </div>
                  }
                  <div>
                    <span className="text-sm font-medium text-white">{m.nickname}</span>
                    <span className="text-xs text-gray-500 ml-2">{m.email}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(m.criado_em).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick links ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-lg mb-3">🔧 Ferramentas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <div className="text-sm text-gray-400">{totalMembers} registados · {activeMembers} activos</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
