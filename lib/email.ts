import { Resend } from 'resend'

const getResend = () => new Resend(process.env.RESEND_API_KEY!)

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

  return getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: `${isEdit ? '✏️ Editado' : '✅ Confirmado'} — F1 Play · GP ${gpNome}`,
    html,
  })
}

// ─── Email 2: Triatlo Results (all 3 leagues) ─────────────────────────────────
export async function sendTriatloResults({
  toEmail,
  toName,
  gpNome,
  gpEmoji,
  // Global ranking
  globalPosition,
  totalMembers,
  globalScore,
  // F1 Play
  playGpPts,
  playTotalPts,
  playPosition,
  playBreakdown,
  // Fantasy
  fantasyGpPts,
  fantasyTotalPts,
  fantasyPosition,
  // Predict
  predictGpPts,
  predictTotalPts,
  predictPosition,
  // Podium (global)
  podium,
}: {
  toEmail: string
  toName: string
  gpNome: string
  gpEmoji: string
  globalPosition: number
  totalMembers: number
  globalScore: number
  playGpPts: number
  playTotalPts: number
  playPosition: number
  playBreakdown: { label: string; acertou: boolean; pts: number; playerAnswer?: string; correctAnswer?: string }[]
  fantasyGpPts: number
  fantasyTotalPts: number
  fantasyPosition: number
  predictGpPts: number
  predictTotalPts: number
  predictPosition: number
  podium: { pos: number; nome: string; score: number }[]
}) {
  const medal = globalPosition === 1 ? '🥇' : globalPosition === 2 ? '🥈' : globalPosition === 3 ? '🥉' : `#${globalPosition}`

  function leagueCard(icon: string, name: string, color: string, gpPts: number, totalPts: number, pos: number) {
    if (totalPts === 0 && gpPts === 0) return `
      <td width="33%" style="padding:0 4px;">
        <div style="background:#0f172a;border-radius:12px;padding:14px 10px;text-align:center;border:1px solid #1f2937;">
          <div style="font-size:20px;">${icon}</div>
          <div style="color:#374151;font-size:11px;font-weight:700;margin-top:4px;">${name}</div>
          <div style="color:#374151;font-size:12px;margin-top:8px;">—</div>
          <div style="color:#374151;font-size:10px;">Não participou</div>
        </div>
      </td>`
    return `
      <td width="33%" style="padding:0 4px;">
        <div style="background:#0f172a;border-radius:12px;padding:14px 10px;text-align:center;border:1px solid ${color}44;">
          <div style="font-size:20px;">${icon}</div>
          <div style="color:${color};font-size:11px;font-weight:700;margin-top:4px;">${name}</div>
          <div style="color:#f9fafb;font-size:20px;font-weight:900;margin-top:6px;">+${gpPts}</div>
          <div style="color:#6b7280;font-size:10px;">este GP</div>
          <div style="color:${color};font-size:12px;font-weight:700;margin-top:6px;">${totalPts} total</div>
          <div style="color:#6b7280;font-size:10px;">#${pos} no ranking</div>
        </div>
      </td>`
  }

  const breakdownRows = playBreakdown.filter(b => b.pts > 0 || true).map(b => `
    <tr>
      <td style="padding:6px 12px;color:#9ca3af;font-size:11px;border-bottom:1px solid #1f2937;">${b.label}</td>
      <td style="padding:6px 12px;text-align:center;font-size:13px;border-bottom:1px solid #1f2937;">${b.acertou ? '✅' : '❌'}</td>
      <td style="padding:6px 12px;text-align:right;color:${b.acertou ? '#10b981' : '#4b5563'};font-weight:700;font-size:11px;border-bottom:1px solid #1f2937;">+${b.pts}</td>
    </tr>`).join('')

  const podiumRows = podium.map(p => `
    <tr>
      <td style="padding:8px 12px;color:#f9fafb;font-size:13px;border-bottom:1px solid #1f2937;">
        ${p.pos === 1 ? '🥇' : p.pos === 2 ? '🥈' : '🥉'} ${p.nome}
      </td>
      <td style="padding:8px 12px;text-align:right;color:#fbbf24;font-weight:900;font-size:13px;border-bottom:1px solid #1f2937;">${p.score.toFixed(1)} gpts</td>
    </tr>`).join('')

  const html = baseHtml(`
    <!-- Header -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;margin-bottom:8px;">${gpEmoji}</div>
      <h1 style="margin:0;color:#f9fafb;font-size:22px;font-weight:900;">Resultados — GP ${gpNome}</h1>
      <p style="color:#6b7280;font-size:13px;margin-top:6px;">Olá <strong style="color:#f9fafb;">${toName}</strong>! Aqui estão os teus resultados completos.</p>
    </div>

    <!-- Global position card -->
    <div style="background:linear-gradient(135deg,#1e1a00,#0f172a);border:2px solid #fbbf24;border-radius:16px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="color:#fbbf24;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">🏆 Triatlo Ranking</div>
      <div style="font-size:52px;font-weight:900;color:#fbbf24;line-height:1;">${medal}</div>
      <div style="color:#9ca3af;font-size:13px;margin-top:6px;">${globalPosition}º de ${totalMembers} membros</div>
      <div style="color:#f9fafb;font-size:28px;font-weight:900;margin-top:8px;">${globalScore.toFixed(1)} <span style="font-size:14px;color:#6b7280;">gpts</span></div>
    </div>

    <!-- 3 Leagues -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        ${leagueCard('🎮', 'F1 PLAY', '#e10600', playGpPts, playTotalPts, playPosition)}
        ${leagueCard('💰', 'FANTASY', '#8b5cf6', fantasyGpPts, fantasyTotalPts, fantasyPosition)}
        ${leagueCard('🎯', 'PREDICT', '#0ea5e9', predictGpPts, predictTotalPts, predictPosition)}
      </tr>
    </table>

    <!-- Triatlo podium -->
    <h3 style="color:#fbbf24;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">🏆 Pódio Triatlo</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      ${podiumRows}
    </table>

    ${playBreakdown.length > 0 ? `
    <!-- F1 Play breakdown -->
    <h3 style="color:#e10600;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">🎮 F1 Play — Detalhe</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#1e293b;">
        <td style="padding:8px 12px;color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;">Pergunta</td>
        <td style="padding:8px 12px;text-align:center;color:#6b7280;font-size:10px;font-weight:700;">Resultado</td>
        <td style="padding:8px 12px;text-align:right;color:#6b7280;font-size:10px;font-weight:700;">Pts</td>
      </tr>
      ${breakdownRows}
    </table>` : ''}

    <div style="text-align:center;">
      <a href="https://app.beiraf1fanatics.com/ranking" style="display:inline-block;background:#e10600;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Ver Triatlo Ranking →
      </a>
    </div>
  `)

  return getResend().emails.send({
    from: FROM,
    to: toEmail,
    subject: `${medal} GP ${gpNome} — Os teus resultados Triatlo`,
    html,
  })
}

// ─── Build payload for batch sending ──────────────────────────────────────────
export function buildTriatloEmailPayload(params: Parameters<typeof sendTriatloResults>[0] & {
  playGpRanking: { pos: number; nome: string; pts: number; email: string }[]
  currentEmail: string
  isTest?: boolean
}) {
  const {
    toEmail, toName, gpNome, gpEmoji,
    globalPosition, totalMembers, globalScore,
    playGpPts, playTotalPts, playPosition, playBreakdown,
    fantasyGpPts, fantasyTotalPts, fantasyPosition,
    predictGpPts, predictTotalPts, predictPosition,
    podium, playGpRanking, currentEmail, isTest,
  } = params

  const medal = globalPosition === 1 ? '🥇' : globalPosition === 2 ? '🥈' : globalPosition === 3 ? '🥉' : `#${globalPosition}`

  const html = buildTriatloHtml({
    toName, gpNome, gpEmoji, medal,
    globalPosition, totalMembers, globalScore,
    playGpPts, playTotalPts, playPosition, playBreakdown,
    fantasyGpPts, fantasyTotalPts, fantasyPosition,
    predictGpPts, predictTotalPts, predictPosition,
    podium, playGpRanking, currentPlayerEmail: currentEmail,
  })

  const now = new Date().toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' })
  const subject = isTest
    ? `📧 [TESTE ${now}] ${medal} GP ${gpNome} — Os teus resultados Triatlo`
    : `${medal} GP ${gpNome} — Os teus resultados Triatlo`

  return {
    from: FROM,
    to: toEmail,
    subject,
    html,
  }
}

// ─── Shared HTML builder ───────────────────────────────────────────────────────
function buildTriatloHtml({
  toName, gpNome, gpEmoji, medal,
  globalPosition, totalMembers, globalScore,
  playGpPts, playTotalPts, playPosition, playBreakdown,
  fantasyGpPts, fantasyTotalPts, fantasyPosition,
  predictGpPts, predictTotalPts, predictPosition,
  podium, playGpRanking, currentPlayerEmail,
}: {
  toName: string; gpNome: string; gpEmoji: string; medal: string
  globalPosition: number; totalMembers: number; globalScore: number
  playGpPts: number; playTotalPts: number; playPosition: number
  playBreakdown: { label: string; acertou: boolean; pts: number; playerAnswer?: string; correctAnswer?: string }[]
  fantasyGpPts: number; fantasyTotalPts: number; fantasyPosition: number
  predictGpPts: number; predictTotalPts: number; predictPosition: number
  podium: { pos: number; nome: string; score: number }[]
  playGpRanking: { pos: number; nome: string; pts: number; email: string }[]
  currentPlayerEmail: string
}) {
  function leagueCard(icon: string, name: string, color: string, gpPts: number, totalPts: number, pos: number) {
    if (totalPts === 0 && gpPts === 0) return `
      <td width="33%" style="padding:0 4px;">
        <div style="background:#0f172a;border-radius:12px;padding:14px 10px;text-align:center;border:1px solid #1f2937;">
          <div style="font-size:20px;">${icon}</div>
          <div style="color:#374151;font-size:11px;font-weight:700;margin-top:4px;">${name}</div>
          <div style="color:#374151;font-size:12px;margin-top:8px;">—</div>
          <div style="color:#374151;font-size:10px;">Não participou</div>
        </div>
      </td>`
    return `
      <td width="33%" style="padding:0 4px;">
        <div style="background:#0f172a;border-radius:12px;padding:14px 10px;text-align:center;border:1px solid ${color}44;">
          <div style="font-size:20px;">${icon}</div>
          <div style="color:${color};font-size:11px;font-weight:700;margin-top:4px;">${name}</div>
          <div style="color:#f9fafb;font-size:20px;font-weight:900;margin-top:6px;">+${gpPts}</div>
          <div style="color:#6b7280;font-size:10px;">este GP</div>
          <div style="color:${color};font-size:12px;font-weight:700;margin-top:6px;">${totalPts} total</div>
          <div style="color:#6b7280;font-size:10px;">#${pos} no ranking</div>
        </div>
      </td>`
  }

  const breakdownRows = playBreakdown.map(b => {
    const pColor = b.acertou ? '#10b981' : '#f9fafb'
    return `
    <tr>
      <td style="padding:6px 10px;color:#9ca3af;font-size:11px;border-bottom:1px solid #1f2937;width:26%;">${b.label}</td>
      <td style="padding:6px 10px;color:${pColor};font-size:11px;font-weight:700;border-bottom:1px solid #1f2937;width:24%;">${b.playerAnswer || '—'}</td>
      <td style="padding:6px 10px;color:#fbbf24;font-size:11px;font-weight:700;border-bottom:1px solid #1f2937;width:24%;">${b.correctAnswer || '—'}</td>
      <td style="padding:6px 8px;text-align:center;font-size:12px;border-bottom:1px solid #1f2937;width:12%;">${b.acertou ? '✅' : '❌'}</td>
      <td style="padding:6px 8px;text-align:right;color:${b.acertou ? '#10b981' : '#4b5563'};font-weight:700;font-size:11px;border-bottom:1px solid #1f2937;width:14%;">+${b.pts}</td>
    </tr>`
  }).join('')

  const podiumRows = podium.map(p => `
    <tr>
      <td style="padding:8px 12px;color:#f9fafb;font-size:13px;border-bottom:1px solid #1f2937;">
        ${p.pos === 1 ? '🥇' : p.pos === 2 ? '🥈' : '🥉'} ${p.nome}
      </td>
      <td style="padding:8px 12px;text-align:right;color:#fbbf24;font-weight:900;font-size:13px;border-bottom:1px solid #1f2937;">${p.score.toFixed(1)} gpts</td>
    </tr>`).join('')

  return baseHtml(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="font-size:36px;margin-bottom:8px;">${gpEmoji}</div>
      <h1 style="margin:0;color:#f9fafb;font-size:22px;font-weight:900;">Resultados — GP ${gpNome}</h1>
      <p style="color:#6b7280;font-size:13px;margin-top:6px;">Olá <strong style="color:#f9fafb;">${toName}</strong>! Aqui estão os teus resultados completos.</p>
    </div>
    <div style="background:linear-gradient(135deg,#1e1a00,#0f172a);border:2px solid #fbbf24;border-radius:16px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="color:#fbbf24;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;">🏆 Triatlo Ranking</div>
      <div style="font-size:52px;font-weight:900;color:#fbbf24;line-height:1;">${medal}</div>
      <div style="color:#9ca3af;font-size:13px;margin-top:6px;">${globalPosition}º de ${totalMembers} membros</div>
      <div style="color:#f9fafb;font-size:28px;font-weight:900;margin-top:8px;">${globalScore.toFixed(1)} <span style="font-size:14px;color:#6b7280;">gpts</span></div>
    </div>
    <h3 style="color:#fbbf24;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">🏆 Pódio Triatlo</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      ${podiumRows}
    </table>
    <h3 style="color:#9ca3af;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">📊 Os teus pontos</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        ${leagueCard('🎮', 'F1 PLAY', '#e10600', playGpPts, playTotalPts, playPosition)}
        ${leagueCard('💰', 'FANTASY', '#8b5cf6', fantasyGpPts, fantasyTotalPts, fantasyPosition)}
        ${leagueCard('🎯', 'PREDICT', '#0ea5e9', predictGpPts, predictTotalPts, predictPosition)}
      </tr>
    </table>
    ${playBreakdown.length > 0 ? `
    <h3 style="color:#e10600;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">🎮 F1 Play — Detalhe</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1c1a08;border:2px solid #fbbf2455;border-radius:12px;margin-bottom:10px;">
      <tr>
        <td style="padding:14px 18px;color:#9ca3af;font-size:13px;">Os teus pontos neste GP</td>
        <td style="padding:14px 18px;text-align:right;color:#fbbf24;font-size:28px;font-weight:900;line-height:1;">+${playGpPts} <span style="font-size:13px;color:#6b7280;font-weight:400;">pts</span></td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#1e293b;">
        <td style="padding:8px 10px;color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;width:26%;">Pergunta</td>
        <td style="padding:8px 10px;color:#10b981;font-size:10px;font-weight:700;text-transform:uppercase;width:24%;">A tua resposta</td>
        <td style="padding:8px 10px;color:#fbbf24;font-size:10px;font-weight:700;text-transform:uppercase;width:24%;">Resposta correcta</td>
        <td style="padding:8px 8px;text-align:center;color:#6b7280;font-size:10px;width:12%;"></td>
        <td style="padding:8px 8px;text-align:right;color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;width:14%;">Pts</td>
      </tr>
      ${breakdownRows}
    </table>` : ''}

    ${playGpRanking.length > 0 ? `
    <h3 style="color:#e10600;font-size:13px;font-weight:700;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">🏁 F1 Play — Ranking do GP</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:12px;overflow:hidden;margin-bottom:20px;">
      <tr style="background:#1e293b;">
        <td style="padding:8px 12px;color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;width:36px;">#</td>
        <td style="padding:8px 12px;color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;">Piloto</td>
        <td style="padding:8px 12px;text-align:right;color:#6b7280;font-size:10px;font-weight:700;text-transform:uppercase;">Pts GP</td>
      </tr>
      ${playGpRanking.map(r => {
        const isMe = r.email === currentPlayerEmail
        const rowBg   = isMe ? 'background:#1c1a08;' : ''
        const posColor = isMe ? '#fbbf24' : '#6b7280'
        const nameColor = isMe ? '#fbbf24' : '#f9fafb'
        const nameBold  = isMe ? 'font-weight:900;' : ''
        const ptsColor  = isMe ? '#fbbf24' : '#e10600'
        const medal = r.pos === 1 ? '🥇 ' : r.pos === 2 ? '🥈 ' : r.pos === 3 ? '🥉 ' : ''
        return `<tr style="${rowBg}">
          <td style="padding:7px 12px;color:${posColor};font-size:12px;font-weight:700;border-bottom:1px solid #1f2937;">${r.pos}º</td>
          <td style="padding:7px 12px;color:${nameColor};font-size:12px;${nameBold}border-bottom:1px solid #1f2937;">${medal}${r.nome}${isMe ? ' &larr; Tu' : ''}</td>
          <td style="padding:7px 12px;text-align:right;color:${ptsColor};font-size:13px;font-weight:900;border-bottom:1px solid #1f2937;">${r.pts}</td>
        </tr>`
      }).join('')}
    </table>` : ''}

    <div style="text-align:center;">
      <a href="https://app.beiraf1fanatics.com/ranking" style="display:inline-block;background:#e10600;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:10px;text-decoration:none;">
        Ver Triatlo Ranking →
      </a>
    </div>
  `)
}
