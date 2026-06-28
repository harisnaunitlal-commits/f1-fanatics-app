export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import LocalDateTime from '@/components/LocalDateTime'

function toFlag(code: string) {
  const clean = Array.from(code).map(c => {
    const cp = c.codePointAt(0) ?? 0
    if (cp >= 127462 && cp <= 127487) return String.fromCharCode(cp - 127397)
    return c.toUpperCase()
  }).join('')
  return `/flags/${clean}.png`
}

export default async function GpDetailPage({ params }: { params: { gpId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/auth/login')

  const gpId = parseInt(params.gpId)
  if (isNaN(gpId)) notFound()

  const { data: gp } = await (supabase as any)
    .from('gp_calendar').select('*').eq('id', gpId).single()
  if (!gp) notFound()

  const isScored = gp.status === 'scored'

  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <Link href="/" className="text-gray-500 hover:text-white text-sm">← Início</Link>
      </div>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-f1red/15 to-f1dark border border-f1red/30 p-6 text-center">
        <img src={toFlag(gp.emoji_bandeira)} alt={gp.nome} className="w-24 h-16 object-cover rounded-lg shadow mx-auto mb-3" />
        <p className="text-f1red font-bold text-xs uppercase tracking-widest mb-1">
          R{String(gp.round).padStart(2, '0')} · Temporada {gp.temporada}
        </p>
        <h1 className="text-3xl font-black text-white">GP {gp.nome}</h1>
        <p className="text-gray-400 text-sm mt-1">{gp.circuito}</p>
        <p className="text-gray-400 text-sm mt-1">
          <LocalDateTime isoDate={gp.data_corrida} />
        </p>
      </div>

      {/* Circuit history */}
      {gp.historia_circuito && (
        <div className="card">
          <h2 className="font-bold text-lg mb-2">🏟️ História do Circuito</h2>
          <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
            {gp.historia_circuito}
          </p>
        </div>
      )}

      {/* Official results document */}
      {gp.resultado_oficial_url && (
        <div className="card">
          <h2 className="font-bold text-lg mb-2">📄 Documento Oficial</h2>
          <p className="text-gray-400 text-sm mb-3">
            Base oficial usada para validar as respostas do F1 Play deste GP.
          </p>
          <a
            href={gp.resultado_oficial_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm bg-blue-900/30 text-blue-400 border border-blue-700/40 px-4 py-2 rounded-lg hover:bg-blue-900/50 transition-colors"
          >
            📎 Ver documento oficial
          </a>
        </div>
      )}

      {!gp.historia_circuito && !gp.resultado_oficial_url && (
        <div className="card text-center py-8">
          <div className="text-4xl mb-2">🏁</div>
          <p className="text-gray-400 text-sm">Ainda sem informação adicional para este GP.</p>
        </div>
      )}

      {/* Link to results if scored */}
      {isScored && (
        <Link href={`/predict/${gp.id}/results`} className="btn-primary w-full block text-center">
          📊 Ver Resultados F1 Play
        </Link>
      )}
    </main>
  )
}
