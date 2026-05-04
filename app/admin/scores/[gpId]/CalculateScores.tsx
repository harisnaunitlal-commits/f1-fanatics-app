'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculatePlayScore } from '@/lib/scoring'
import type { GpCalendar, GpAnswers, Prediction, ScorePlay } from '@/lib/supabase/types'
import CalcRankingButton from '@/app/admin/CalcRankingButton'

type PreviewRow = ReturnType<typeof calculatePlayScore> & { email: string }

export default function CalculateScores({
  gp, answers, predictions, existingScores, adminEmail
}: {
  gp: GpCalendar
  answers: GpAnswers | null
  predictions: Prediction[]
  existingScores: ScorePlay[]
  adminEmail: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [calculated, setCalculated] = useState(false)
  const [saved, setSaved] = useState(false)

  function doPreview() {
    if (!answers) {
      setError('Insere primeiro as respostas correctas.')
      return
    }

    const results: PreviewRow[] = predictions.map(pred => ({
      email: pred.member_email,
      ...calculatePlayScore(pred, answers),
    }))

    results.sort((a, b) => b.total - a.total)
    setPreview(results)
    setCalculated(true)
  }

  async function doSave() {
    if (!answers || preview.length === 0) return
    setLoading(true)
    setError('')

    const scores = preview.map(r => ({
      member_email: r.email,
      gp_id: gp.id,
      pts_p1a: r.pts_p1a,
      pts_p1b: r.pts_p1b,
      pts_p1c: r.pts_p1c,
      pts_p2: r.pts_p2,
      pts_p3: r.pts_p3,
      pts_p4a: r.pts_p4a,
      pts_p4b: r.pts_p4b,
      pts_p4c: r.pts_p4c,
      pts_p5: r.pts_p5,
      pts_p6: r.pts_p6,
      pts_p7: r.pts_p7,
      pts_p8: r.pts_p8,
      pts_p9: r.pts_p9,
      pts_p10: r.pts_p10,
      pts_p11: r.pts_p11,
      pts_p12: r.pts_p12,
      pts_p13: r.pts_p13,
      pts_p14: r.pts_p14,
      pts_p15: r.pts_p15,
      total: r.total,
      participou: true,
      calculado_em: new Date().toISOString(),
    }))

    // Use server API route with service role to bypass RLS
    const res = await fetch('/api/admin/save-scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scores, gp_id: gp.id, admin_email: adminEmail }),
    })

    const result = await res.json()

    if (!res.ok || result.error) {
      setError(result.error ?? 'Erro ao guardar.')
      setLoading(false)
      return
    }

    setSaved(true)
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">
          {gp.emoji_bandeira} Calcular Pontuações — GP {gp.nome}
        </h1>
        <p className="text-gray-400 text-sm">
          {predictions.length} previsão(ões) · {existingScores.length > 0 ? '⚠️ Pontuações já calculadas' : 'Ainda não calculado'}
        </p>
      </div>

      {!answers && (
        <div className="card border-red-600/30 text-center mb-6">
          <p className="text-red-400 mb-3">Não há respostas correctas inseridas para este GP.</p>
          <a href={`/admin/answers/${gp.id}`} className="btn-primary inline-block">
            Inserir respostas
          </a>
        </div>
      )}

      {answers && !calculated && (
        <div className="card text-center mb-6">
          <p className="text-gray-400 mb-4">
            Pré-visualiza os resultados antes de guardar.
          </p>
          <button onClick={doPreview} className="btn-primary px-8">
            🔍 Pré-visualizar pontuações
          </button>
        </div>
      )}

      {preview.length > 0 && (
        <>
          <div className="card mb-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Membro</th>
                  <th className="text-center py-2 px-2">P1</th>
                  <th className="text-center py-2 px-2">P2</th>
                  <th className="text-center py-2 px-2">P3</th>
                  <th className="text-center py-2 px-2">P4</th>
                  <th className="text-center py-2 px-2">P5-7</th>
                  <th className="text-center py-2 px-2">P8</th>
                  <th className="text-center py-2 px-2 text-yellow-400">P9</th>
                  <th className="text-center py-2 px-2 text-yellow-400">P10</th>
                  <th className="text-center py-2 px-2">P11+</th>
                  <th className="text-center py-2 pl-4 font-bold text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={r.email} className={`border-b border-gray-800 ${i === 0 ? 'text-yellow-400' : ''}`}>
                    <td className="py-2 pr-4 font-medium truncate max-w-[120px]">
                      {r.email.split('@')[0]}
                    </td>
                    <td className="text-center px-2">{r.pts_p1a + r.pts_p1b + r.pts_p1c}</td>
                    <td className="text-center px-2">{r.pts_p2}</td>
                    <td className="text-center px-2">{r.pts_p3}</td>
                    <td className="text-center px-2">{r.pts_p4a + r.pts_p4b + r.pts_p4c}</td>
                    <td className="text-center px-2">{r.pts_p5 + r.pts_p6 + r.pts_p7}</td>
                    <td className="text-center px-2">{r.pts_p8}</td>
                    <td className="text-center px-2 text-yellow-400">{r.pts_p9}</td>
                    <td className="text-center px-2 text-yellow-400">{r.pts_p10}</td>
                    <td className="text-center px-2">{r.pts_p11 + r.pts_p12 + r.pts_p13 + r.pts_p14 + r.pts_p15}</td>
                    <td className="text-center pl-4 font-bold text-lg">{r.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3 mb-4">{error}</p>}

          {!saved ? (
            <div className="flex gap-3">
              <button onClick={() => setCalculated(false)} className="btn-secondary flex-1">
                ← Recalcular
              </button>
              <button onClick={doSave} disabled={loading} className="btn-primary flex-1">
                {loading ? 'A guardar...' : '✅ Confirmar e guardar'}
              </button>
            </div>
          ) : (
            <div className="card bg-green-900/20 border-green-700/40 space-y-3">
              <p className="text-green-400 font-bold text-center">✅ Pontuações Play guardadas!</p>
              <p className="text-gray-400 text-sm text-center">
                Agora podes calcular o Ranking Global para este GP.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/ranking/play?gp=${gp.id}`)}
                  className="btn-secondary flex-1 text-sm"
                >
                  Ver ranking Play
                </button>
                <div className="flex-1">
                  <CalcRankingButton gpId={gp.id} gpNome={gp.nome} adminEmail={adminEmail} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}