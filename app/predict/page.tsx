export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { isDeadlinePassed, getTimeUntilDeadline } from '@/lib/scoring'

export default async function PredictPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: gps } = await (supabase as any)
    .from('gp_calendar')
    .select('*')
    .eq('temporada', 2026)
    .order('round')

  const { data: myPredictions } = await (supabase as any)
    .from('predictions')
    .select('gp_id')
    .eq('member_email', user!.email!)

  const { data: answeredGps } = await (supabase as any)
    .from('gp_answers')
    .select('gp_id')

  const submitted = new Set(myPredictions?.map((p: any) => p.gp_id) ?? [])
  const hasAnswers = new Set(answeredGps?.map((a: any) => a.gp_id) ?? [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Previsões F1 Play</h1>
      <p className="text-gray-400 mb-8">
        Submete as tuas previsões antes do início de cada corrida.
      </p>

      <div className="grid gap-3">
        {(gps as any[])?.map((gp: any) => {
          const closed = isDeadlinePassed(gp.deadline_play)
          const scored = gp.status === 'scored'
          const hasPred = submitted.has(gp.id)
          const timeLeft = !closed ? getTimeUntilDeadline(gp.deadline_play) : null

          return (
            <div
              key={gp.id}
              className={`card flex items-center justify-between gap-4 ${
                gp.status === 'upcoming' && !closed ? 'border-f1red/30' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{gp.emoji_bandeira}</span>
                <div>
                  <div className="font-bold">
                    R{String(gp.round).padStart(2, '0')} · {gp.nome}
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(gp.data_corrida).toLocaleDateString('pt-MZ', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {timeLeft && (
                      <span className="ml-2 text-f1red font-medium">
                        ⏱ {timeLeft}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {/* Ver respostas — available whenever answers exist AND player submitted */}
                {hasPred && hasAnswers.has(gp.id) && (
                  <Link
                    href={`/predict/${gp.id}/results`}
                    className="text-sm text-yellow-400 hover:text-yellow-300 font-medium"
                  >
                    📊 Ver resultados
                  </Link>
                )}

                {scored && hasPred && (
                  <Link
                    href={`/ranking/play?gp=${gp.id}`}
                    className="text-sm text-gray-400 hover:text-white underline"
                  >
                    Ver pontos
                  </Link>
                )}

                {!closed && (
                  <Link
                    href={`/predict/${gp.id}`}
                    className={`btn-primary text-sm py-2 px-4 ${
                      hasPred ? 'opacity-80' : ''
                    }`}
                  >
                    {hasPred ? '✏️ Editar' : '🏎️ Submeter'}
                  </Link>
                )}

                {closed && !scored && (
                  <span className="text-sm text-gray-500 bg-gray-800 px-3 py-1.5 rounded-lg">
                    {hasPred ? '✅ Submetido' : '❌ Não participou'}
                  </span>
                )}

                {scored && (
                  <span
                    className={`text-sm px-3 py-1.5 rounded-lg ${
                      hasPred
                        ? 'bg-green-900/40 text-green-400'
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    {hasPred ? '✅ Pontuado' : '❌ Não participou'}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}