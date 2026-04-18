'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026, MARGENS_VITORIA, OPCOES_CLASSIF } from '@/lib/supabase/types'
import type { GpCalendar, GpAnswers } from '@/lib/supabase/types'

type FormData = Omit<GpAnswers, 'gp_id' | 'inserido_por' | 'inserido_em'>

export default function AnswersForm({
  gp, existing, adminEmail
}: {
  gp: GpCalendar; existing: GpAnswers | null; adminEmail: string
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<FormData>({
    p1_primeiro:  existing?.p1_primeiro  ?? null,
    p1_segundo:   existing?.p1_segundo   ?? null,
    p1_terceiro:  existing?.p1_terceiro  ?? null,
    p2_equipa:    existing?.p2_equipa    ?? null,
    p3_lap:       existing?.p3_lap       ?? null,
    p4_quarto:    existing?.p4_quarto    ?? null,
    p4_quinto:    existing?.p4_quinto    ?? null,
    p4_sexto:     existing?.p4_sexto     ?? null,
    p5_duelo:     existing?.p5_duelo     ?? null,
    p6_duelo:     existing?.p6_duelo     ?? null,
    p7_duelo:     existing?.p7_duelo     ?? null,
    p8_margem:    existing?.p8_margem    ?? null,
    p9_retire:    existing?.p9_retire    ?? null,
    p10_dotd:     existing?.p10_dotd     ?? null,
    p11_fl:       existing?.p11_fl       ?? null,
    p12_classif:  existing?.p12_classif  ?? null,
    p13_especial: existing?.p13_especial ?? null,
    p14_sc:       existing?.p14_sc       ?? null,
    p15_outsider: existing?.p15_outsider ?? null,
    perguntas_anuladas: existing?.perguntas_anuladas ?? [],
  })

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value || null }))

  function toggleAnulada(field: string) {
    setForm(f => {
      const current = f.perguntas_anuladas ?? []
      return {
        ...f,
        perguntas_anuladas: current.includes(field)
          ? current.filter(x => x !== field)
          : [...current, field]
      }
    })
  }

  function AnuladaCheck({ field }: { field: string }) {
    const anuladas = form.perguntas_anuladas ?? []
    return (
      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer mt-1">
        <input type="checkbox" checked={anuladas.includes(field)}
          onChange={() => toggleAnulada(field)}
          className="rounded" />
        Anular esta pergunta (0 pts para todos)
      </label>
    )
  }

  function PilotoSel({ field, label }: { field: keyof FormData; label: string }) {
    return (
      <div>
        <label className="label">{label}</label>
        <select className={`select ${(form.perguntas_anuladas ?? []).includes(field) ? 'opacity-40' : ''}`}
          value={(form[field] as string) ?? ''} onChange={set(field)}>
          <option value="">Selecciona...</option>
          {PILOTOS_2026.map(p => <option key={p.codigo} value={p.codigo}>{p.nome}</option>)}
        </select>
        <AnuladaCheck field={field} />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const { error: upsertErr } = await supabase.from('gp_answers').upsert({
      gp_id: gp.id,
      ...form,
      inserido_por: adminEmail,
      inserido_em: new Date().toISOString(),
    })

    if (upsertErr) { setError(upsertErr.message); setLoading(false); return }

    // Log audit
    await supabase.from('audit_log').insert({
      admin_email: adminEmail,
      accao: existing ? 'update_answers' : 'insert_answers',
      gp_id: gp.id,
      detalhes: { gp_nome: gp.nome },
    })

    setSuccess(true)
    setTimeout(() => router.push(`/admin/scores/${gp.id}`), 1500)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold">Respostas guardadas!</h1>
        <p className="text-gray-400 mt-2">A redirigir para calcular pontuações...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">
          {gp.emoji_bandeira} Respostas GP {gp.nome}
        </h1>
        <p className="text-gray-400 text-sm">Insere os resultados oficiais após a corrida.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🏆 Pódio</h3>
          <div className="grid grid-cols-3 gap-3">
            <PilotoSel field="p1_primeiro" label="1º" />
            <PilotoSel field="p1_segundo"  label="2º" />
            <PilotoSel field="p1_terceiro" label="3º" />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🏎️ 2ª / 3ª Equipa</h3>
          <label className="label">Equipa</label>
          <select className="select" value={form.p2_equipa ?? ''} onChange={set('p2_equipa')}>
            <option value="">Selecciona...</option>
            {EQUIPAS_2026.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <AnuladaCheck field="p2_equipa" />
        </div>

        <div className="card">
          <h3 className="font-bold text-f1red mb-4">📍 LAP / P4-P6 / Duelos</h3>
          <div className="grid grid-cols-2 gap-3">
            <PilotoSel field="p3_lap"    label="LAP" />
            <PilotoSel field="p4_quarto" label="4º" />
            <PilotoSel field="p4_quinto" label="5º" />
            <PilotoSel field="p4_sexto"  label="6º" />
            <PilotoSel field="p5_duelo"  label="Duelo 1 (Red Bull)" />
            <PilotoSel field="p6_duelo"  label="Duelo 2 (McLaren)" />
            <PilotoSel field="p7_duelo"  label="Duelo 3 (Ferrari)" />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-f1red mb-4">⏱️ Margem / FL / Classif.</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Margem vitória</label>
              <select className="select" value={form.p8_margem ?? ''} onChange={set('p8_margem')}>
                <option value="">Selecciona...</option>
                {MARGENS_VITORIA.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <PilotoSel field="p11_fl" label="Fastest Lap" />
            <div>
              <label className="label">Nº classificados</label>
              <select className="select" value={form.p12_classif ?? ''} onChange={set('p12_classif')}>
                <option value="">Selecciona...</option>
                {OPCOES_CLASSIF.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="card border-yellow-600/30">
          <h3 className="font-bold text-yellow-400 mb-4">💥 First to Retire / DOTD</h3>
          <div className="grid grid-cols-2 gap-3">
            <PilotoSel field="p9_retire" label="First to Retire (3 pts)" />
            <PilotoSel field="p10_dotd"  label="Driver of the Day (2 pts)" />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-f1red mb-4">🎲 Especiais</h3>
          <div className="space-y-3">
            <div>
              <label className="label">P13 · Pergunta especial</label>
              <input className="input" value={form.p13_especial ?? ''} onChange={set('p13_especial')} />
              <AnuladaCheck field="p13_especial" />
            </div>
            <div>
              <label className="label">P14 · Safety Car?</label>
              <select className="select" value={form.p14_sc ?? ''} onChange={set('p14_sc')}>
                <option value="">Selecciona...</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
                <option value="Virtual SC">Virtual SC</option>
              </select>
            </div>
            <PilotoSel field="p15_outsider" label="P15 · Outsider" />
          </div>
        </div>

        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'A guardar...' : '💾 Guardar respostas'}
        </button>
      </form>
    </div>
  )
}
