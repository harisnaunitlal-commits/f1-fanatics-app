import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Beira F1 Fanatics <noreply@beiraf1fanatics.com>'

// ─── Prediction field labels for email ────────────────────────────────────────
const FIELD_LABELS: Record<string, string> = {
  p1_primeiro:  '🥇 1º Lugar',
  p1_segundo:   '🥈 2º Lugar',
  p1_terceiro:  '🥉 3º Lugar',
  p4_quarto:    '4º Lugar',
  p4_quinto:    '5º Lugar',
  p4_sexto:     '6º Lugar',
  p2_equipa:    'P2 · Equipa',
  p3_lap:       'P3 · Volta de Avanço',
  p5_duelo:     'P5 · Duelo 1',
  p6_duelo:     'P6 · Duelo 2',
  p7_duelo:     'P7 · Duelo 3',
  p8_margem:    'P8 · Margem de Vitória',
  p9_retire:    'P9 · First to Retire',
  p10_dotd:     'P10 · Driver of the Day',
  p11_fl:       'P11 · Volta Mais Rápida',
  p12_classif:  'P12 · Nº Classificados',
  p13_especial: 'P13 · Pergunta Especial',
  p14_sc:       'P14 · Safety Car',
  p15_outsider: 'P15 · Outsider',
}

// ─── Base HTML wrapper ─────────────────────────────────────────────────────────
function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beira F1 Fanatics</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#111;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;border-bottom:3px solid #e10600;">
            <div style="font-size:32px;margin-bottom:8px;">🏎️</div>
            <div style="color:#e10600;font-size:22px;font-weight:900;letter-spacing:1px;">BEIRA F1 FANATICS</div>
            <div style="color:#6b7280;font-size:12px;margin-top:4px;">Beira, Moçambique · Temporada 2026</div>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="background:#111827;padding:32px;border-radius:0 0 16px 16px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;text-align:center;">
            <div style="color:#4b5563;font-size:12px;">
              Beira F1 Fanatics · Fundada 27 Mar 2021<br>
              <a href="https://app.beiraf1fanatics.com" style="color:#e10600;text-decoration:none;">app.beiraf1fanatics.com</a>
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Email 1: Prediction Confirmation ─────────────────────────────────────────
export async function sendPredictionConfirmation({
  toEmail,
  toName,
  gpNome,
  gpEmoji,
  prediction,
  isEdit,
}: {
  toEmail: string
  toName: string
  gpNome: string
  gpEmoji: string
  prediction: Record<string, string | null>
  isEdit: boolean
}) {
  const fields = Object.entries(FIELD_LABELS)
    .map(([key, label]) => {
      const val = prediction[key]
      if (!val) return ''
      return `
        <tr>
          <td style="padding:8px 12px;color:#9ca3af;font-size:13px;border-bottom:1px solid #1f2937;">${label}</td>
          <td style="padding:8px 12px;color:#f9fafb;font-size:13px;font-weight:700;border-bottom:1px solid #1f2937;">${val}</td>
        </tr>`
    })
    .filter(Boolean)
    .join('')

  const action = isEdit ? 'Previsão Editada' : 'Previsão Submetida'
  const actionColor = isEdit ? '#f59e0b' : '#10b981'
  const now = new Date().toLocaleString('pt-MZ', {
    timeZone: 'Africa/Maputo',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const html = baseHtml(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:${actionColor}22;color:${actionColor};font-size:13px;font-weight:700;padding:6px 18px;border-radius:999px;border:1px solid ${actionColor}44;margin-bottom:16px;">
        ✅ ${action}
      </div>
      <div style="font-size:28px;margin-bottom:6px;">${gpEmoji}</div>
      <h1 style="margin:0;color:#f9fafb;font-size:22px;font-weight:900;">Grande Prémio ${gpNome}</h1>
      <p style="color:#6b7280;font-size:13px;margin-top:8px;">Olá <strong style="color:#f9fafb;">${toName}</strong> — as tuas previsões foram guardadas com sucesso!</p>
      <p style="color:#4b5563;font-size:12px;margin-top:4px;">${now} · Hora de Moçambique</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#1e293b;">
        <td style="padding:10px 12px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Pergunta</td>
        <td style="padding:10px 12px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">A tua resposta</td>
      </tr>
      ${fields}
    </table>

    <div style="background:#1e293b;border-radius:12px;padding:16px 20px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        Podes editar as tuas previsões até ao início da corrida.<br>
        <a href="https://app.beiraf1fanatics.com/predict" style="color:#e10600;font-weight:700;text-decoration:none;">Editar previsões →</a>
      </p>
    </div>
  `)

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${isEdit ? '✏️ Editado' : '✅ Confirmado'} — F1 Play · GP ${gpNome}`,
    html,
  })
}

// ─── Email 2: GP Results ───────────────────────────────────────────────────────
export async function sendGpResults({
  toEmail,
  toName,
  gpNome,
  gpEmoji,
  position,
  totalParticipants,
  points,
  maxPoints,
  breakdown,
  podium,
}: {
  toEmail: string
  toName: string
  gpNome: string
  gpEmoji: string
  position: number
  totalParticipants: number
  points: number
  maxPoints: number
  breakdown: { label: string; acertou: boolean; pts: number }[]
  podium: { pos: number; nome: string; pts: number }[]
}) {
  const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`
  const pct = maxPoints > 0 ? Math.round((points / maxPoints) * 100) : 0

  const breakdownRows = breakdown.map(b => `
    <tr>
      <td style="padding:7px 12px;color:#9ca3af;font-size:12px;border-bottom:1px solid #1f2937;">${b.label}</td>
      <td style="padding:7px 12px;text-align:center;font-size:14px;border-bottom:1px solid #1f2937;">${b.acertou ? '✅' : '❌'}</td>
      <td style="padding:7px 12px;text-align:right;color:${b.acertou ? '#10b981' : '#6b7280'};font-weight:700;font-size:12px;border-bottom:1px solid #1f2937;">+${b.pts}</td>
    </tr>`).join('')

  const podiumRows = podium.map(p => `
    <tr>
      <td style="padding:8px 12px;color:#f9fafb;font-size:13px;border-bottom:1px solid #1f2937;">
        ${p.pos === 1 ? '🥇' : p.pos === 2 ? '🥈' : '🥉'} ${p.nome}
      </td>
      <td style="padding:8px 12px;text-align:right;color:#fbbf24;font-weight:900;font-size:14px;border-bottom:1px solid #1f2937;">${p.pts} pts</td>
    </tr>`).join('')

  const html = baseHtml(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="font-size:36px;margin-bottom:8px;">${gpEmoji}</div>
      <h1 style="margin:0;color:#f9fafb;font-size:22px;font-weight:900;">Resultados — GP ${gpNome}</h1>
      <p style="color:#6b7280;font-size:13px;margin-top:8px;">Olá <strong style="color:#f9fafb;">${toName}</strong>, aqui estão os teus resultados!</p>
    </div>

    <!-- Score card -->
    <div style="background:linear-gradient(135deg,#1e293b,#0f172a);border:1px solid #e10600;border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;font-weight:900;color:#fbbf24;">${medal}</div>
      <div style="color:#6b7280;font-size:13px;margin-top:4px;">${position}º de ${totalParticipants} jogadores</div>
      <div style="font-size:42px;font-weight:900;color:#f9fafb;margin:12px 0;">${points} <span style="font-size:18px;color:#6b7280;">pts</span></div>
      <div style="background:#1e293b;border-radius:999px;height:8px;overflow:hidden;max-width:300px;margin:0 auto;">
        <div style="background:#e10600;height:8px;width:${pct}%;border-radius:999px;"></div>
      </div>
      <div style="color:#6b7280;font-size:12px;margin-top:8px;">${pct}% do máximo (${maxPoints} pts)</div>
    </div>

    <!-- Podium -->
    <h3 style="color:#fbbf24;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">🏆 Pódio F1 Play</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      ${podiumRows}
    </table>

    <!-- Breakdown -->
    <h3 style="color:#9ca3af;font-size:14px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">📊 Detalhe das Respostas</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr style="background:#1e293b;">
        <td style="padding:8px 12px;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;">Pergunta</td>
        <td style="padding:8px 12px;text-align:center;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;">Resultado</td>
        <td style="padding:8px 12px;text-align:right;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;">Pts</td>
      </tr>
      ${breakdownRows}
    </table>

    <div style="text-align:center;">
      <a href="https://app.beiraf1fanatics.com/ranking" style="display:inline-block;background:#e10600;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Ver Ranking Global →
      </a>
    </div>
  `)

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `${medal} ${points} pts — F1 Play Resultados · GP ${gpNome}`,
    html,
  })
}
