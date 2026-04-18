-- =========================================
-- PREVIEW: Global Ranking após R03 — READ-ONLY
-- scores_play → lido ao vivo da DB
-- scores_fantasy / scores_predict → VALUES hardcoded (tabelas ainda não existem)
-- Não escreve nada na base de dados.
-- =========================================
--
-- FÓRMULA DETALHADA:
--
--   Passo 1 — Normalização por liga (escala 0–100):
--     play_gpts    = (play_pts    ÷ play_max)    × 100
--     fantasy_gpts = (fantasy_pts ÷ fantasy_max) × 100
--     predict_gpts = (predict_pts ÷ predict_max) × 100
--
--   Passo 2 — Média global (divide SEMPRE por 3, nunca pelo nº de ligas):
--     global_score = (play_gpts + fantasy_gpts + predict_gpts) ÷ 3
--
--   Regra de ausência:
--     Membro que não joga numa liga recebe 0 nessa liga.
--     Isso penaliza jogadores de liga única — intencional.
--
--   Máximos usados neste preview (após R03):
--     play_max    = calculado ao vivo (maior soma de scores_play.total)
--     fantasy_max = 994  (Haris · PCA Team)
--     predict_max = 352  (Haris · PCA Team)
-- =========================================

WITH

-- ── 1. PLAY — ao vivo da DB ──────────────────────────────────────────────────
play_agg AS (
  SELECT member_email, SUM(total) AS play_pts
  FROM scores_play
  GROUP BY member_email
),

-- ── 2. FANTASY — hardcoded (Overall após R03) ────────────────────────────────
fantasy_data (member_email, fantasy_pts) AS (
  VALUES
  ('haris.naunitlal@gmail.com',        994),
  ('derciopita1990@gmail.com',          806),
  ('hcoelho.tco@gmail.com',             791),
  ('pedrowjorge@gmail.com',             716),
  ('abilioantunes789@gmail.com',        700),
  ('lino.carlos76@gmail.com',           676),
  ('allencosta230@gmail.com',           648),
  ('salehjabry7@gmail.com',             649),
  ('amamudo@gmail.com',                 732),
  ('marco.antunes@live.com',            636),
  ('anuargoncalves@gmail.com',          636),
  ('alexandreferreira0208@gmail.com',   591),
  ('miguel.nhaia@gmail.com',            599),
  ('ravi.prehlad@gmail.com',            561),
  ('amarildomomola@gmail.com',          569),
  ('ericson.kun@gmail.com',             506),
  ('Atumane.Momade@icloud.com',         469),
  ('bzzz.bummm@gmail.com',              463),
  ('jtingane@gmail.com',                420),
  ('nkajaria02@gmail.com',              453),
  ('sacur.luismiguel78@gmail.com',      165)
),

-- ── 3. PREDICT — hardcoded (Overall após R03) ────────────────────────────────
predict_data (member_email, predict_pts) AS (
  VALUES
  ('haris.naunitlal@gmail.com',        352),
  ('miguel.nhaia@gmail.com',           321),
  ('rishilsubash@gmail.com',           291),
  ('lino.carlos76@gmail.com',          262),
  ('ravi.prehlad@gmail.com',           254),
  ('amarildomomola@gmail.com',         239),
  ('amamudo@gmail.com',                230),
  ('mauro.demelo2014@gmail.com',       211),
  ('derciopita1990@gmail.com',         332),
  ('anuargoncalves@gmail.com',         194),
  ('marco.antunes@live.com',           191),
  ('ericson.kun@gmail.com',            182),
  ('sacur.luismiguel78@gmail.com',     164),
  ('abilioantunes789@gmail.com',       214),
  ('nkajaria02@gmail.com',             123),
  ('consorridente@gmail.com',          110),
  ('alexandreferreira0208@gmail.com',  107),
  ('hcoelho.tco@gmail.com',            100),
  ('jtingane@gmail.com',                67),
  ('bzzz.bummm@gmail.com',              61)
  -- pedrowjorge@gmail.com = 0, sem linha (COALESCE trata como 0)
),

-- ── 4. União de todos os membros ─────────────────────────────────────────────
all_members AS (
  SELECT member_email FROM play_agg
  UNION SELECT member_email FROM fantasy_data
  UNION SELECT member_email FROM predict_data
),

-- ── 5. Máximos ───────────────────────────────────────────────────────────────
maxes AS (
  SELECT
    MAX(COALESCE(p.play_pts, 0))  AS play_max,
    994                            AS fantasy_max,
    352                            AS predict_max
  FROM all_members m
  LEFT JOIN play_agg p ON p.member_email = m.member_email
),

-- ── 6. Cálculo por membro ────────────────────────────────────────────────────
combined AS (
  SELECT
    m.member_email,
    COALESCE(mb.nickname, SPLIT_PART(m.member_email, '@', 1))  AS nome,
    COALESCE(p.play_pts,    0)  AS play_pts,
    COALESCE(f.fantasy_pts, 0)  AS fantasy_pts,
    COALESCE(pr.predict_pts,0)  AS predict_pts,
    mx.play_max,
    mx.fantasy_max,
    mx.predict_max,
    ROUND(COALESCE(p.play_pts,    0)::NUMERIC / NULLIF(mx.play_max,    0) * 100, 1) AS play_gpts,
    ROUND(COALESCE(f.fantasy_pts, 0)::NUMERIC / NULLIF(mx.fantasy_max, 0) * 100, 1) AS fantasy_gpts,
    ROUND(COALESCE(pr.predict_pts,0)::NUMERIC / NULLIF(mx.predict_max, 0) * 100, 1) AS predict_gpts,
    -- ligas em falta tratadas como zero
    TRIM(
      CASE WHEN p.play_pts     IS NULL THEN 'Play '     ELSE '' END ||
      CASE WHEN f.fantasy_pts  IS NULL THEN 'Fantasy '  ELSE '' END ||
      CASE WHEN pr.predict_pts IS NULL THEN 'Predict'   ELSE '' END
    ) AS ligas_zero
  FROM all_members m
  CROSS JOIN maxes mx
  LEFT JOIN members        mb ON mb.email        = m.member_email
  LEFT JOIN play_agg        p ON p.member_email  = m.member_email
  LEFT JOIN fantasy_data    f ON f.member_email  = m.member_email
  LEFT JOIN predict_data   pr ON pr.member_email = m.member_email
)

-- ── 7. Resultado final ───────────────────────────────────────────────────────
SELECT
  RANK() OVER (ORDER BY global_score DESC)  AS pos,
  nome,
  member_email,
  play_pts,
  fantasy_pts,
  predict_pts,
  play_gpts,
  fantasy_gpts,
  predict_gpts,
  global_score,
  play_max,
  fantasy_max,
  predict_max,
  NULLIF(ligas_zero, '') AS ligas_zero
FROM (
  SELECT *,
    ROUND((play_gpts + fantasy_gpts + predict_gpts) / 3.0, 1) AS global_score
  FROM combined
) ranked
ORDER BY global_score DESC, nome ASC;
