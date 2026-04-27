'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PILOTOS_2026, EQUIPAS_2026 } from '@/lib/supabase/types'
import {
  P8_MARGENS, P3_OPTIONS, P12_OPTIONS,
  getGpQuestions, getDriverPhoto,
  type DuelConfig, type DriverOption,
} from '@/lib/gp-questions'
import type { GpCalendar, GpAnswers } from '@/lib/supabase/types'

type FormData = Omit<GpAnswers, 'gp_id' | 'inserido_por' | 'inserido_em'>

// ─── Driver Photo Card ─────────────────────────────────────────────────────────
function DriverCard({
  codigo, name, team, color, selected, onClick,
}: {
  codigo: string; name: string; team: string; color: string
  selected: boolean; onClick: () => void
}) {
  const [imgErr, setImgErr] = useState(false)
  const photoUrl = getDriverPhoto(codigo)
  const lastName = name.split(' ').slice(-1)[0]

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col items-center rounded-xl border-2 overflow-hidden transition-all duration-200 w-full"
      style={{
        borderColor: selected ? color : 'rgba(255,255,255,0.1)',
        backgroundColor: selected ? color + '22' : 'rgba(255,255,255,0.03)',
        transform: selected ? 'scale(1.04)' : 'scale(1)',
        boxShadow: selected ? `0 0 16px ${color}55` : 'none',
      }}
    >
      <div className="w-full h-1.5" style={{ backgroundColor: color }} />
      {selected && (
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center z-10 text-white text-[10px] font-black"
          style={{ backgroundColor: color }}
        >✓</div>
      )}
      <div className="w-full aspect-[4/5] overflow-hidden" style={{ backgroundColor: color + '18' }}>
        {photoUrl && !imgErr ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover object-top" onError={() => setImgErr(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ color }}>
            <span className="text-2xl font-black">{codigo}</span>
          </div>
        )}
      </div>
      <div className="px-1.5 py-2 text-center w-full">
        <div className="font-black text-xs text-white leading-tight truncate">{lastName}</div>
        <div className="text-[9px] font-medium mt-0.5 truncate" style={{ color }}>{team}</div>
      </div>
    </button>
  )
}

function DuelSelector({ cfg, value, onChange }: {
  cfg: DuelConfig; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-[1fr_28px_1fr] items-center gap-2">
      <DriverCard
        codigo={cfg.driverA} name={cfg.nameA} team={cfg.teamA} color={cfg.colorA}
        selected={value === cfg.driverA} onClick={() => onChange(cfg.driverA)}
      />
      <div className="text-gray-500 font-black text-sm text-center">VS</div>
      <DriverCard
        codigo={cfg.driverB} name={cfg.nameB} team={cfg.teamB} color={cfg.colorB}
        selected={value === cfg.driverB} onClick={() => onChange(cfg.driverB)}
      />
    </div>
  )
}

function DriverGrid({ options, value, onChange }: {
  options: DriverOption[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {options.map(d => (
        <DriverCard
          key={d.codigo}
          codigo={d.codigo} name={d.nome} team={d.equipa} color={d.color}
          selected={value === d.codigo} onClick={() => onChange(d.codigo)}
        />
      ))}
    </div>
  )
}

// ─── Main Form ─────────────────────────────────────────────────────────────────
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
  const gpNameFull = config ? `Grande Prémio ${config.gpPrep} ${config.gpName}` : gp.nome

  const [form, setForm] = useState<FormData>({
    p1_primeiro:     existing?.p1_primeiro     ?? null,
    p1_segundo:      existing?.p1_segundo      ?? null,
    p1_terceiro:     existing?.p1_terceiro     ?? null,
    p2_equipa:       existing?.p2_equipa       ?? null,
    p3_lap:          existing?.p3_lap          ?? null,
    p4_quarto:       existing?.p4_quarto       ?? null,
    p4_quinto:       existing?.p4_quinto       ?? null,
    p4_sexto:        existing?.p4_sexto        ?? null,
    p5_duelo:        existing?.p5_duelo        ?? null,
    p6_duelo:        existing?.p6_duelo        ?? null,
    p7_duelo:        existing?.p7_duelo        ?? null,
    p8_margem:       existing?.p8_margem       ?? null,
    p9_retire:       existing?.p9_retire       ?? null,
    p10_dotd:        existing?.p10_dotd        ?? null,
    p11_fl:          existing?.p11_fl          ?? null,
    p12_classif:     existing?.p12_classif     ?? null,
    p13_especial:    existing?.p13_especial    ?? null,
    p14_sc:          existing?.p14_sc          ?? null,
    p15_outsider:    existing?.p15_outsider    ?? null,
    perguntas_anuladas: existing?.perguntas_anuladas ?? [],
  })

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value || null }))

  function toggleAnulada(field: string) {
    setForm(f => {
      const cur = f.perguntas_anuladas ?? []
      return { ...f, perguntas_anuladas: cur.includes(field) ? cur.filter(x => x !== field) : [...cur, field] }
    })
  }

  function AnuladaCheck({ field }: { field: string }) {
    return (
      <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer mt-2">
        <input type="checkbox" checked={(form.perguntas_anuladas ?? []).includes(field)} onChange={() => toggleAnulada(field)} className="rounded" />
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
          {PILOTOS_2026.map(p => <option key={p.codigo} value={p.codigo}>{p.nome} ({p.equipa})</option>)}
        </select>
      </div>
    )
  }

  function QHeader({ code, title, pts }: { code: string; title: string; pts: string }) {
    return (
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-bold text-f1red">{code} · {title}</h3>
        <span className="text-gray-400 font-normal text-sm">{pts}</span>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    const payload = { gp_id: gp.id, ...form, inserido_por: adminEmail, inserido_em: new Date().toISOString() }
    const { error: upsertErr } = await (supabase as any).from('gp_answers').upsert(payload)

    if (upsertErr) { setError(upsertErr.message); setLoading(false); return }

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
        <h1 className="text-2xl font-bold mt-2">{gp.emoji_bandeira} Respostas — {gp.nome}</h1>
        <p className="text-gray-400 text-sm mt-1">Insere os resultados oficiais após a corrida.</p>
        {!config && (
          <p className="text-yellow-400 text-xs mt-2 bg-yellow-900/20 px-3 py-2 rounded">
            Sem config para o round {gp.round} — a usar seletores genéricos para P5/P6/P7/P13/P15.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* P1 — Pódio */}
        <div className="card">
          <QHeader code="P1" title="Pódio" pts="3 pts" />
          <p className="text-xs text-gray-500 mb-3">
            Qual é a previsão de pódio para o {gpNameFull}?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <PilotoSel field="p1_primeiro" label="1º lugar" />
            <PilotoSel field="p1_segundo"  label="2º lugar" />
            <PilotoSel field="p1_terceiro" label="3º lugar" />
          </div>
          <AnuladaCheck field="p1_primeiro" />
        </div>

        {/* P2 — Equipa */}
        <div className="card">
          <QHeader code="P2" title="Equipa" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            {config?.p2Label ?? `Qual será a segunda equipa, que vai pontuar mais no ${gpNameFull}?`}
          </p>
          <select
            className={`select ${anuladas.includes('p2_equipa') ? 'opacity-40' : ''}`}
            value={form.p2_equipa ?? ''} onChange={set('p2_equipa')}
          >
            <option value="">Selecciona...</option>
            {EQUIPAS_2026.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <AnuladaCheck field="p2_equipa" />
        </div>

        {/* P3 — Volta de Avanço */}
        <div className="card">
          <QHeader code="P3" title="Volta de Avanço" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Quantos pilotos levaram a volta de avanço (LAP) no {gpNameFull}?
          </p>
          <select
            className={`select ${anuladas.includes('p3_lap') ? 'opacity-40' : ''}`}
            value={form.p3_lap ?? ''} onChange={set('p3_lap')}
          >
            <option value="">Selecciona...</option>
            {(config?.p3Options ?? P3_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <AnuladaCheck field="p3_lap" />
        </div>

        {/* P4 — Posições 4-6 */}
        <div className="card">
          <QHeader code="P4" title="Posições 4-6" pts="3 pts" />
          <p className="text-xs text-gray-500 mb-3">
            Classificados segundo a ordem, no {gpNameFull}.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <PilotoSel field="p4_quarto" label="4º lugar" />
            <PilotoSel field="p4_quinto" label="5º lugar" />
            <PilotoSel field="p4_sexto"  label="6º lugar" />
          </div>
          <AnuladaCheck field="p4_quarto" />
        </div>

        {/* P5 — Duelo 1 */}
        <div className="card">
          <QHeader code="P5" title="Duelo 1" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Qual piloto terminou na frente do outro no {gpNameFull}?
          </p>
          {config
            ? <>
                <DuelSelector cfg={config.p5} value={form.p5_duelo ?? ''} onChange={v => setForm(f => ({ ...f, p5_duelo: v }))} />
                <AnuladaCheck field="p5_duelo" />
              </>
            : <>
                <PilotoSel field="p5_duelo" label="Vencedor" />
                <AnuladaCheck field="p5_duelo" />
              </>
          }
        </div>

        {/* P6 — Duelo 2 */}
        <div className="card">
          <QHeader code="P6" title="Duelo 2" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Qual piloto terminou na frente do outro no {gpNameFull}?
          </p>
          {config
            ? <>
                <DuelSelector cfg={config.p6} value={form.p6_duelo ?? ''} onChange={v => setForm(f => ({ ...f, p6_duelo: v }))} />
                <AnuladaCheck field="p6_duelo" />
              </>
            : <>
                <PilotoSel field="p6_duelo" label="Vencedor" />
                <AnuladaCheck field="p6_duelo" />
              </>
          }
        </div>

        {/* P7 — Duelo 3 */}
        <div className="card">
          <QHeader code="P7" title="Duelo 3" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Qual piloto terminou na frente do outro no {gpNameFull}?
          </p>
          {config
            ? <>
                <DuelSelector cfg={config.p7} value={form.p7_duelo ?? ''} onChange={v => setForm(f => ({ ...f, p7_duelo: v }))} />
                <AnuladaCheck field="p7_duelo" />
              </>
            : <>
                <PilotoSel field="p7_duelo" label="Vencedor" />
                <AnuladaCheck field="p7_duelo" />
              </>
          }
        </div>

        {/* P8 — Margem de vitória */}
        <div className="card">
          <QHeader code="P8" title="Margem de Vitória" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Qual foi a margem de victória, do prímeiro a cruzar a linha de chegada?
          </p>
          <select
            className={`select ${anuladas.includes('p8_margem') ? 'opacity-40' : ''}`}
            value={form.p8_margem ?? ''} onChange={set('p8_margem')}
          >
            <option value="">Selecciona...</option>
            {P8_MARGENS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <AnuladaCheck field="p8_margem" />
        </div>

        {/* P9 — First to Retire */}
        <div className="card">
          <QHeader code="P9" title="First to Retire" pts="3 pts" />
          <p className="text-xs text-gray-500 mb-3">
            Quem foi o primeiro piloto, First to Retire no {gpNameFull}?
          </p>
          <PilotoSel field="p9_retire" label="Piloto (ou NONE se nenhum abandonou)" />
          <AnuladaCheck field="p9_retire" />
        </div>

        {/* P10 — Driver of the Day */}
        <div className="card">
          <QHeader code="P10" title="Driver of the Day" pts="2 pts" />
          <p className="text-xs text-gray-500 mb-3">
            Quem foi o piloto eleito 'Driver of the Day' no {gpNameFull}?
          </p>
          <PilotoSel field="p10_dotd" label="Piloto" />
          <AnuladaCheck field="p10_dotd" />
        </div>

        {/* P11 — Volta mais rápida */}
        <div className="card">
          <QHeader code="P11" title="Volta Mais Rápida" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Qual piloto fez a volta mais rápida no {gpNameFull}?
          </p>
          <PilotoSel field="p11_fl" label="Piloto" />
          <AnuladaCheck field="p11_fl" />
        </div>

        {/* P12 — Nº classificados */}
        <div className="card">
          <QHeader code="P12" title="Nº de Classificados" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Quantos pilotos classificados terminaram a corrida no {gpNameFull}?
          </p>
          <select
            className={`select ${anuladas.includes('p12_classif') ? 'opacity-40' : ''}`}
            value={form.p12_classif ?? ''} onChange={set('p12_classif')}
          >
            <option value="">Selecciona...</option>
            {P12_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <AnuladaCheck field="p12_classif" />
        </div>

        {/* P13 — Pergunta Especial */}
        <div className="card">
          <QHeader code="P13" title="Pergunta Especial" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            {config?.p13Label ?? "Qual piloto terminou na posição mais alta?"}
          </p>
          {config
            ? <>
                <DriverGrid options={config.p13Options} value={form.p13_especial ?? ''} onChange={v => setForm(f => ({ ...f, p13_especial: v }))} />
                <AnuladaCheck field="p13_especial" />
              </>
            : <>
                <PilotoSel field="p13_especial" label="Piloto" />
                <AnuladaCheck field="p13_especial" />
              </>
          }
        </div>

        {/* P14 — Safety Car */}
        <div className="card">
          <QHeader code="P14" title="Safety Car" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            Houve Safety Car na pista durante o {gpNameFull}?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {['Sim','Não'].map(opt => (
              <button
                key={opt} type="button"
                onClick={() => setForm(f => ({ ...f, p14_sc: opt }))}
                className="py-4 rounded-xl border-2 font-bold text-lg transition-all duration-200"
                style={{
                  borderColor: form.p14_sc === opt ? '#e10600' : 'rgba(255,255,255,0.1)',
                  backgroundColor: form.p14_sc === opt ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.03)',
                  color: form.p14_sc === opt ? '#fff' : '#9ca3af',
                }}
              >
                {opt === 'Sim' ? '🟡 Sim' : '🟢 Não'}
              </button>
            ))}
          </div>
          <AnuladaCheck field="p14_sc" />
        </div>

        {/* P15 — Outsider */}
        <div className="card">
          <QHeader code="P15" title="Outsider" pts="1 pt" />
          <p className="text-xs text-gray-500 mb-3">
            {config?.p15Label ?? "Qual piloto terminou na posição mais alta?"}
          </p>
          {config
            ? <>
                <DriverGrid options={config.p15Options} value={form.p15_outsider ?? ''} onChange={v => setForm(f => ({ ...f, p15_outsider: v }))} />
                <AnuladaCheck field="p15_outsider" />
              </>
            : <>
                <PilotoSel field="p15_outsider" label="Piloto" />
                <AnuladaCheck field="p15_outsider" />
              </>
          }
        </div>

        {error && <p className="text-red-400 bg-red-900/20 rounded-lg px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'A guardar...' : '💾 Guardar respostas'}
        </button>
      </form>
    </div>
  )
}
