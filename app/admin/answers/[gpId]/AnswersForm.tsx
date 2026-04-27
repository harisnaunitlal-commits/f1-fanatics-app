'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026 } from '@/lib/supabase/types'
import { P8_MARGENS, P3_OPTIONS, P12_OPTIONS, getGpQuestions } from '@/lib/gp-questions'
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

  const config = getGpQuestions(gp.round)

  const [form, setForm] = useState<FormData>({
    p1_primeiro: existing?.p1_primeiro ?? null,
    p1_segundo: existing?.p1_segundo ?? null,
    p1_terceiro: existing?.p1_terceiro ?? null,
    p2_equipa: existing?.p2_equipa ?? null,
    p3_lap: existing?.p3_lap ?? null,
    p4_quarto: existing?.p4_quarto ?? null,
    p4_quinto: existing?.p4_quinto ?? null,
    p4_sexto: existing?.p4_sexto ?? null,
    p5_duelo: existing?.p5_duelo ?? null,
    p6_duelo: existing?.p6_duelo ?? null,
    p7_duelo: existing?.p7_duelo ?? null,
    p8_margem: existing?.p8_margem ?? null,
    p9_retire: existing?.p9_retire ?? null,
    p10_dotd: existing?.p10_dotd ?? null,
    p11_fl: existing?.p11_fl ?? null,
    p12_classif: existing?.p12_classif ?? null,
    p13_especial: existing?.p13_especial ?? null,
    p14_sc: existing?.p14_sc ?? null,
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
        <input
          type="checkbox"
          checked={anuladas.includes(field)}
          onChange={() => toggleAnulada(field)}
          className="rounded"
        />
        Anular esta pergunta (0 pts para todos)
      </label>
    )
  }

  function PilotoSel({ field, label }: { field: keyof FormData; label: string }) {
    const anuladas = form.perguntas_anuladas ?? []
    return (
      <div>
        <label className="label">{label}</label>
        <select
          className={`select ${anuladas.includes(field as string) ? 'opacity-40' : ''}`}
          value={(form[field] as string) ?? ''}
          onChange={set(field)}
        >
          <option value="">Selecciona...</option>
          {PILOTOS_2026.map(p => (
            <option key={p.codigo} value={p.codigo}>
              {p.nome} ({p.equipa})
            </option>
          ))}
        </select>
        <AnuladaCheck field={field as string} />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      gp_id: gp.id,
      ...form,
      inserido_por: adminEmail,
      inserido_em: new Date().toISOString(),
    }

    const { error: upsertErr } = await (supabase as any)
      .from('gp_answers')
      .upsert(payload)

    if (upsertErr) {
      setError(upsertErr.message)
      setLoading(false)
      return
    }

    await (supabase as any).from('audit_log').insert({
      admin_email: adminEmail,
      accao: existing ? 'update_answers' : 'insert_answers',
      tabela: 'gp_answers',
      detalhe: { gp_id: gp.id, gp_nome: gp.nome },
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

  const anuladas = form.perguntas_anuladas ?? []

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-6">
        <a href="/admin" className="text-gray-500 hover:text-white text-sm">← Admin</a>
        <h1 className="text-2xl font-bold mt-2">
          {gp.emoji_bandeira} Respostas — {gp.nome}
        </h1>
        <p className="text-gray-400 text-sm mt-1">Insere os resultados oficiais após a corrida.</p>
        {!config && (
          <p className="text-yellow-400 text-xs mt-2 bg-yellow-900/20 px-3 py-2 rounded">
            Sem config específica para o round {gp.round} — a usar seletores genéricos para P5/P6/P7/P13/P15.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* P1 — Pódio */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P1 · Pódio <span className="text-gray-400 font-normal text-sm">(3 pts)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Quem vai fazer o pódio?</p>
          <div className="grid grid-cols-3 gap-3">
            <PilotoSel field="p1_primeiro" label="1º lugar" />
            <PilotoSel field="p1_segundo" label="2º lugar" />
            <PilotoSel field="p1_terceiro" label="3º lugar" />
          </div>
        </div>

        {/* P2 — 2ª Equipa */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P2 · 2ª Equipa <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">
            {config?.p2Label ?? "Qual será a 2ª equipa que mais vai pontuar?"}
          </p>
          <select
            className={`select ${anuladas.includes('p2_equipa') ? 'opacity-40' : ''}`}
            value={form.p2_equipa ?? ''}
            onChange={set('p2_equipa')}
          >
            <option value="">Selecciona...</option>
            {EQUIPAS_2026.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <AnuladaCheck field="p2_equipa" />
        </div>

        {/* P3 — Carros dobrados */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P3 · Carros dobrados <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Quantos carros serão dobrados durante a corrida?</p>
          <select
            className={`select ${anuladas.includes('p3_lap') ? 'opacity-40' : ''}`}
            value={form.p3_lap ?? ''}
            onChange={set('p3_lap')}
          >
            <option value="">Selecciona...</option>
            {(config?.p3Options ?? P3_OPTIONS).map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <AnuladaCheck field="p3_lap" />
        </div>

        {/* P4 — P4-P6 */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P4 · Posições 4-6 <span className="text-gray-400 font-normal text-sm">(3 pts)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Quem vai terminar em 4º, 5º e 6º?</p>
          <div className="grid grid-cols-3 gap-3">
            <PilotoSel field="p4_quarto" label="4º lugar" />
            <PilotoSel field="p4_quinto" label="5º lugar" />
            <PilotoSel field="p4_sexto" label="6º lugar" />
          </div>
        </div>

        {/* P5/P6/P7 — Duelos */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P5 / P6 / P7 · Duelos <span className="text-gray-400 font-normal text-sm">(1 pt cada)</span></h3>
          <p className="text-xs text-gray-500 mb-4">Quem vai terminar à frente no duelo?</p>
          <div className="space-y-4">
            {/* P5 */}
            <div>
              <label className="label">
                P5 ·{' '}
                {config
                  ? `${config.p5.nameA} vs ${config.p5.nameB}`
                  : 'Duelo 1'}
              </label>
              {config ? (
                <select
                  className={`select ${anuladas.includes('p5_duelo') ? 'opacity-40' : ''}`}
                  value={form.p5_duelo ?? ''}
                  onChange={set('p5_duelo')}
                >
                  <option value="">Selecciona...</option>
                  <option value={config.p5.driverA}>{config.p5.nameA} ({config.p5.teamA})</option>
                  <option value={config.p5.driverB}>{config.p5.nameB} ({config.p5.teamB})</option>
                </select>
              ) : (
                <select
                  className={`select ${anuladas.includes('p5_duelo') ? 'opacity-40' : ''}`}
                  value={form.p5_duelo ?? ''}
                  onChange={set('p5_duelo')}
                >
                  <option value="">Selecciona...</option>
                  {PILOTOS_2026.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.nome}</option>
                  ))}
                </select>
              )}
              <AnuladaCheck field="p5_duelo" />
            </div>

            {/* P6 */}
            <div>
              <label className="label">
                P6 ·{' '}
                {config
                  ? `${config.p6.nameA} vs ${config.p6.nameB}`
                  : 'Duelo 2'}
              </label>
              {config ? (
                <select
                  className={`select ${anuladas.includes('p6_duelo') ? 'opacity-40' : ''}`}
                  value={form.p6_duelo ?? ''}
                  onChange={set('p6_duelo')}
                >
                  <option value="">Selecciona...</option>
                  <option value={config.p6.driverA}>{config.p6.nameA} ({config.p6.teamA})</option>
                  <option value={config.p6.driverB}>{config.p6.nameB} ({config.p6.teamB})</option>
                </select>
              ) : (
                <select
                  className={`select ${anuladas.includes('p6_duelo') ? 'opacity-40' : ''}`}
                  value={form.p6_duelo ?? ''}
                  onChange={set('p6_duelo')}
                >
                  <option value="">Selecciona...</option>
                  {PILOTOS_2026.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.nome}</option>
                  ))}
                </select>
              )}
              <AnuladaCheck field="p6_duelo" />
            </div>

            {/* P7 */}
            <div>
              <label className="label">
                P7 ·{' '}
                {config
                  ? `${config.p7.nameA} vs ${config.p7.nameB}`
                  : 'Duelo 3'}
              </label>
              {config ? (
                <select
                  className={`select ${anuladas.includes('p7_duelo') ? 'opacity-40' : ''}`}
                  value={form.p7_duelo ?? ''}
                  onChange={set('p7_duelo')}
                >
                  <option value="">Selecciona...</option>
                  <option value={config.p7.driverA}>{config.p7.nameA} ({config.p7.teamA})</option>
                  <option value={config.p7.driverB}>{config.p7.nameB} ({config.p7.teamB})</option>
                </select>
              ) : (
                <select
                  className={`select ${anuladas.includes('p7_duelo') ? 'opacity-40' : ''}`}
                  value={form.p7_duelo ?? ''}
                  onChange={set('p7_duelo')}
                >
                  <option value="">Selecciona...</option>
                  {PILOTOS_2026.map(p => (
                    <option key={p.codigo} value={p.codigo}>{p.nome}</option>
                  ))}
                </select>
              )}
              <AnuladaCheck field="p7_duelo" />
            </div>
          </div>
        </div>

        {/* P8 — Margem vitória */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P8 · Margem de vitória <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Qual foi a margem entre 1º e 2º?</p>
          <select
            className={`select ${anuladas.includes('p8_margem') ? 'opacity-40' : ''}`}
            value={form.p8_margem ?? ''}
            onChange={set('p8_margem')}
          >
            <option value="">Selecciona...</option>
            {P8_MARGENS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <AnuladaCheck field="p8_margem" />
        </div>

        {/* P9 — First to Retire */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P9 · Primeiro a abandonar <span className="text-gray-400 font-normal text-sm">(3 pts)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Qual piloto vai abandonar primeiro? (Nenhum se todos terminarem)</p>
          <PilotoSel field="p9_retire" label="Piloto" />
        </div>

        {/* P10 — DOTD */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P10 · Driver of the Day <span className="text-gray-400 font-normal text-sm">(2 pts)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Quem vai ganhar o DOTD (votação dos fãs)?</p>
          <PilotoSel field="p10_dotd" label="Piloto" />
        </div>

        {/* P11 — Fastest Lap */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P11 · Volta mais rápida <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Quem vai fazer a volta mais rápida?</p>
          <PilotoSel field="p11_fl" label="Piloto" />
        </div>

        {/* P12 — Nº classificados */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P12 · Nº de classificados <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Quantos pilotos vão ser classificados?</p>
          <select
            className={`select ${anuladas.includes('p12_classif') ? 'opacity-40' : ''}`}
            value={form.p12_classif ?? ''}
            onChange={set('p12_classif')}
          >
            <option value="">Selecciona...</option>
            {P12_OPTIONS.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <AnuladaCheck field="p12_classif" />
        </div>

        {/* P13 — Especial */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P13 · Pergunta especial <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">
            {config?.p13Label ?? "Pergunta especial da corrida"}
          </p>
          <select
            className={`select ${anuladas.includes('p13_especial') ? 'opacity-40' : ''}`}
            value={form.p13_especial ?? ''}
            onChange={set('p13_especial')}
          >
            <option value="">Selecciona...</option>
            {config
              ? config.p13Options.map(d => (
                  <option key={d.codigo} value={d.codigo}>{d.nome} ({d.equipa})</option>
                ))
              : PILOTOS_2026.map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.nome} ({p.equipa})</option>
                ))
            }
          </select>
          <AnuladaCheck field="p13_especial" />
        </div>

        {/* P14 — Safety Car */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P14 · Safety Car <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">Houve Safety Car na corrida?</p>
          <select
            className={`select ${anuladas.includes('p14_sc') ? 'opacity-40' : ''}`}
            value={form.p14_sc ?? ''}
            onChange={set('p14_sc')}
          >
            <option value="">Selecciona...</option>
            <option value="Sim">Sim</option>
            <option value="Não">Não</option>
          </select>
          <AnuladaCheck field="p14_sc" />
        </div>

        {/* P15 — Outsider */}
        <div className="card">
          <h3 className="font-bold text-f1red mb-1">P15 · Outsider <span className="text-gray-400 font-normal text-sm">(1 pt)</span></h3>
          <p className="text-xs text-gray-500 mb-3">
            {config?.p15Label ?? "Qual piloto outsider vai terminar na posição mais alta?"}
          </p>
          <select
            className={`select ${anuladas.includes('p15_outsider') ? 'opacity-40' : ''}`}
            value={form.p15_outsider ?? ''}
            onChange={set('p15_outsider')}
          >
            <option value="">Selecciona...</option>
            {config
              ? config.p15Options.map(d => (
                  <option key={d.codigo} value={d.codigo}>{d.nome} ({d.equipa})</option>
                ))
              : PILOTOS_2026.map(p => (
                  <option key={p.codigo} value={p.codigo}>{p.nome} ({p.equipa})</option>
                ))
            }
          </select>
          <AnuladaCheck field="p15_outsider" />
        </div>

        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'A guardar...' : '💾 Guardar respostas'}
        </button>
      </form>
    </div>
  )
}
