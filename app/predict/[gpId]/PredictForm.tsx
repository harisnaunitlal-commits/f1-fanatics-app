'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026, MARGENS_VITORIA, OPCOES_CLASSIF } from '@/lib/supabase/types'
import type { GpCalendar, Prediction } from '@/lib/supabase/types'
import { getTimeUntilDeadline, isDeadlinePassed } from '@/lib/scoring'

// Duelos pré-definidos por equipa
const DUELOS = [
  { label: 'Red Bull: Verstappen vs Tsunoda', opts: ['VER', 'TSU'] },
  { label: 'McLaren: Norris vs Piastri', opts: ['NOR', 'PIA'] },
  { label: 'Ferrari: Leclerc vs Hamilton', opts: ['LEC', 'HAM'] },
  { label: 'Mercedes: Russell vs Antonelli', opts: ['RUS', 'ANT'] },
  { label: 'Aston Martin: Alonso vs Stroll', opts: ['ALO', 'STR'] },
  { label: 'Alpine: Gasly vs Doohan/Colapinto', opts: ['GAS', 'DOO'] },
  { label: 'Williams: Sainz vs Albon', opts: ['SAI', 'ALB'] },
  { label: 'RB: Lawson vs ...', opts: ['LAW', 'TSU'] },
  { label: 'Haas: Ocon vs Bearman', opts: ['OCO', 'BEA'] },
  { label: 'Sauber: Hülkenberg vs Bortoleto', opts: ['HUL', 'BOR'] },
]

type FormData = Omit<
  Prediction,
  'id' | 'member_email' | 'gp_id' | 'submetido_em' | 'editado_em' | 'versao'
>

export default function PredictForm({
  gp,
  userEmail,
  existing,
}: {
  gp: GpCalendar
  userEmail: string
  existing: Prediction | null
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(getTimeUntilDeadline(gp.deadline_play))

  const blank: FormData = {
    p1_primeiro: null,
    p1_segundo: null,
    p1_terceiro: null,
    p2_equipa: null,
    p3_lap: null,
    p4_quarto: null,
    p4_quinto: null,
    p4_sexto: null,
    p5_duelo: null,
    p6_duelo: null,
    p7_duelo: null,
    p8_margem: null,
    p9_retire: null,
    p10_dotd: null,
    p11_fl: null,
    p12_classif: null,
    p13_especial: null,
    p14_sc: null,
    p15_outsider: null,
  }

  const [form, setForm] = useState<FormData>(existing ?? blank)

  useEffect(() => {
    const t = setInterval(() => {
      if (isDeadlinePassed(gp.deadline_play)) {
        clearInterval(t)
        router.refresh()
      } else {
        setTimeLeft(getTimeUntilDeadline(gp.deadline_play))
      }
    }, 10000)
    return () => clearInterval(t)
  }, [])

  const set = (k: keyof FormData) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v || null }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (isDeadlinePassed(gp.deadline_play)) {
      setError('O prazo expirou.')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await (supabase as any)
      .from('predictions')
      .upsert({
        member_email: userEmail,
        gp_id: gp.id,
        ...form,
        editado_em: new Date().toISOString(),
      })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/predict'), 2000)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Previsão guardada!</h1>
        <p className="text-gray-400">Podes editar até ao início da corrida.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full text-lg py-4"
        >
          {loading ? 'A guardar...' : '🏎️ Submeter previsão'}
        </button>
      </form>
    </div>
  )
}