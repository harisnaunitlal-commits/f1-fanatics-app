export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata = { title: 'Histórico de Resultados · Beira F1 Fanatics' }

export default async function HistoricoPage() {
  const supabase = await createClient()
  const { data: gps } = await (supabase as any)
    .from('gp_calendar')
    .select('*')
    .order('round', { ascending: false })

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Histórico de Resultados</h1>
        <p className="text-gray-400 text-sm">
          Documentos oficiais usados como base para validar as respostas do F1 Play em cada GP.
          Útil para conferir em caso de dúvida e para consultar em apostas futuras.
        </p>
      </div>

      <div className="space-y-2">
        {(gps ?? []).map((gp: any) => (
          <div
            key={gp.id}
            className="flex items-center justify-between gap-3 bg-f1dark border border-f1gray rounded-xl px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl shrink-0">{gp.emoji_bandeira}</span>
              <div className="min-w-0">
                <div className="font-bold text-white truncate">
                  R{String(gp.round).padStart(2, '0')} · {gp.nome}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(gp.data_corrida).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>

            {gp.resultado_oficial_url ? (
              <a
                href={gp.resultado_oficial_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm bg-blue-900/30 text-blue-400 border border-blue-700/40 px-3 py-1.5 rounded-lg hover:bg-blue-900/50 transition-colors"
              >
                📄 Ver documento
              </a>
            ) : (
              <span className="shrink-0 text-xs text-gray-600 italic px-3 py-1.5">Sem documento</span>
            )}
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <Link href="/" className="text-gray-500 hover:text-white text-sm">← Voltar ao início</Link>
      </div>
    </main>
  )
}
