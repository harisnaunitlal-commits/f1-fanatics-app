/**
 * Helpers for generating sample email HTML previews (no DB needed).
 * Used by /api/admin/preview-email
 */

// ── Import the base builder from email.ts ─────────────────────────────────────
// We re-export a function that builds the prediction confirmation HTML
// using realistic sample data for Monaco.

export function buildPredictionConfirmHtml({
  email,
  gpNome,
}: {
  email: string
  gpNome: string
}): string {
  const FROM_NAME = 'Harishkumar Naunitlal'
  const GP_EMOJI  = '🇲🇨'
  const IS_EDIT   = false

  const samplePrediction: Record<string, string> = {
    p1_primeiro:  'Max Verstappen',
    p1_segundo:   'Charles Leclerc',
    p1_terceiro:  'Lando Norris',
    p4_quarto:    'Oscar Piastri',
    p4_quinto:    'George Russell',
    p4_sexto:     'Carlos Sainz',
    p2_equipa:    'Ferrari',
    p3_lap:       'Kimi Antonelli',
    p5_duelo:     'Verstappen',
    p6_duelo:     'Leclerc',
    p7_duelo:     'Norris',
    p8_margem:    '1-3 seg',
    p9_retire:    'Logan Sargeant',
    p10_dotd:     'Charles Leclerc',
    p11_fl:       'Max Verstappen',
    p12_classif:  '15',
    p13_especial: 'Sim',
    p14_sc:       'Sim',
    p15_outsider: 'Nico Hülkenberg',
  }

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

  const fields = Object.entries(FIELD_LABELS)
    .map(([key, label]) => {
      const val = samplePrediction[key]
      if (!val) return ''
      return `
        <tr>
          <td style="padding:8px 12px;color:#9ca3af;font-size:13px;border-bottom:1px solid #1f2937;">${label}</td>
          <td style="padding:8px 12px;color:#f9fafb;font-size:13px;font-weight:700;border-bottom:1px solid #1f2937;">${val}</td>
        </tr>`
    })
    .filter(Boolean)
    .join('')

  const action = IS_EDIT ? 'Previsão Editada' : 'Previsão Submetida'
  const actionColor = IS_EDIT ? '#f59e0b' : '#10b981'
  const now = new Date().toLocaleString('pt-MZ', {
    timeZone: 'Africa/Maputo',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return baseHtml(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:${actionColor}22;color:${actionColor};font-size:13px;font-weight:700;padding:6px 18px;border-radius:999px;border:1px solid ${actionColor}44;margin-bottom:16px;">
        ✅ ${action}
      </div>
      <div style="font-size:28px;margin-bottom:6px;">${GP_EMOJI}</div>
      <h1 style="margin:0;color:#f9fafb;font-size:22px;font-weight:900;">Grande Prémio ${gpNome}</h1>
      <p style="color:#6b7280;font-size:13px;margin-top:8px;">Olá <strong style="color:#f9fafb;">${FROM_NAME}</strong> — as tuas previsões foram guardadas com sucesso!</p>
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

    <div style="margin-top:16px;background:#111;border:1px dashed #374151;border-radius:10px;padding:10px 14px;text-align:center;">
      <p style="margin:0;color:#6b7280;font-size:11px;">⚠️ Este é um email de pré-visualização com dados de exemplo para o GP de ${gpNome}.</p>
    </div>
  `)
}

function baseHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Beira F1 Fanatics — Preview</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;color:#e5e7eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr>
          <td style="background:#111;border-radius:16px 16px 0 0;padding:28px 32px;text-align:center;border-bottom:3px solid #e10600;">
            <div style="font-size:32px;margin-bottom:8px;">🏎️</div>
            <div style="color:#e10600;font-size:22px;font-weight:900;letter-spacing:1px;">BEIRA F1 FANATICS</div>
            <div style="color:#6b7280;font-size:12px;margin-top:4px;">Beira, Moçambique · Temporada 2026</div>
          </td>
        </tr>
        <tr>
          <td style="background:#111827;padding:32px;border-radius:0 0 16px 16px;">
            ${content}
          </td>
        </tr>
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
