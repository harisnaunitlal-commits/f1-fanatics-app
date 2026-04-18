-- =========================================
-- RECALCULATE GLOBAL RANKING
-- Run in Supabase SQL Editor after each GP is fully scored.
-- Safe to re-run — all upserts are idempotent.
--
-- HOW TO USE:
--   1. Change target_gp below to the GP just scored (e.g. 4 for Miami)
--   2. Paste into Supabase SQL Editor and run
--   3. Check the summary row returned at the end
--
-- FORMULA:
--   play_gpts    = (play_pts    / play_max)    × 100
--   fantasy_gpts = (fantasy_pts / fantasy_max) × 100
--   predict_gpts = (predict_pts / predict_max) × 100
--   global_score = (play_gpts + fantasy_gpts + predict_gpts) / 3
--
-- CARRY-FORWARD (Fantasy & Predict):
--   If a member has no row for target_gp, their last known pontos_acum
--   is used. This preserves accumulated points across missed GPs.
--   Zero is used only if a member has never participated in that league.
--
-- HISTORY:
--   One row per (member × GP) is stored — full season history preserved.
-- =========================================

WITH

-- ── CHANGE THIS each race weekend ────────────────────────────────────────────
config AS (
  SELECT 3 AS target_gp   -- ← update to the GP just scored (e.g. 4 for Miami)
),

-- ── Play: cumulative SUM of all scored GPs up to and including target ─────────
play_cumulative AS (
  SELECT
    sp.member_email,
    SUM(sp.total) AS play_pts
  FROM scores_play sp, config
  WHERE sp.gp_id <= config.target_gp
  GROUP BY sp.member_email
),

-- ── Fantasy: carry-forward — last known pontos_acum up to target GP ───────────
fantasy_cumulative AS (
  SELECT DISTINCT ON (sf.member_email)
    sf.member_email,
    sf.pontos_acum AS fantasy_pts
  FROM scores_fantasy sf, config
  WHERE sf.gp_id <= config.target_gp
  ORDER BY sf.member_email, sf.gp_id DESC
),

-- ── Predict: carry-forward — last known pontos_acum up to target GP ──────────
predict_cumulative AS (
  SELECT DISTINCT ON (sp.member_email)
    sp.member_email,
    sp.pontos_acum AS predict_pts
  FROM scores_predict sp, config
  WHERE sp.gp_id <= config.target_gp
  ORDER BY sp.member_email, sp.gp_id DESC
),

-- ── Union of all members across all three leagues ────────────────────────────
all_members AS (
  SELECT member_email FROM play_cumulative
  UNION SELECT member_email FROM fantasy_cumulative
  UNION SELECT member_email FROM predict_cumulative
),

-- ── Combine — absent league = 0, n_ligas counts leagues with any score ───────
combined AS (
  SELECT
    m.member_email,
    COALESCE(p.play_pts,    0) AS play_pts,
    COALESCE(f.fantasy_pts, 0) AS fantasy_pts,
    COALESCE(pr.predict_pts,0) AS predict_pts,
    (CASE WHEN p.play_pts     IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN f.fantasy_pts  IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN pr.predict_pts IS NOT NULL THEN 1 ELSE 0 END) AS n_ligas
  FROM all_members m
  LEFT JOIN play_cumulative    p  ON p.member_email  = m.member_email
  LEFT JOIN fantasy_cumulative f  ON f.member_email  = m.member_email
  LEFT JOIN predict_cumulative pr ON pr.member_email = m.member_email
),

-- ── Season maxes for this GP snapshot ────────────────────────────────────────
maxes AS (
  SELECT
    GREATEST(MAX(play_pts),    1) AS play_max,
    GREATEST(MAX(fantasy_pts), 1) AS fantasy_max,
    GREATEST(MAX(predict_pts), 1) AS predict_max,
    COUNT(*) FILTER (WHERE play_pts    > 0) AS n_play,
    COUNT(*) FILTER (WHERE fantasy_pts > 0) AS n_fantasy,
    COUNT(*) FILTER (WHERE predict_pts > 0) AS n_predict
  FROM combined
),

-- ── Normalised scores ─────────────────────────────────────────────────────────
normalised AS (
  SELECT
    c.member_email,
    c.play_pts,
    c.fantasy_pts,
    c.predict_pts,
    c.n_ligas,
    ROUND(c.play_pts::NUMERIC    / mx.play_max    * 100, 1) AS play_gpts,
    ROUND(c.fantasy_pts::NUMERIC / mx.fantasy_max * 100, 1) AS fantasy_gpts,
    ROUND(c.predict_pts::NUMERIC / mx.predict_max * 100, 1) AS predict_gpts,
    mx.play_max,
    mx.fantasy_max,
    mx.predict_max,
    mx.n_play,
    mx.n_fantasy,
    mx.n_predict
  FROM combined c CROSS JOIN maxes mx
),

-- ── 1. Upsert season_stats (one row per GP) ───────────────────────────────────
upsert_stats AS (
  INSERT INTO season_stats (
    gp_id,
    play_max, fantasy_max, predict_max,
    n_members_play, n_members_fantasy, n_members_predict
  )
  SELECT
    (SELECT target_gp FROM config),
    play_max, fantasy_max, predict_max,
    n_play,   n_fantasy,   n_predict
  FROM maxes
  ON CONFLICT (gp_id) DO UPDATE SET
    play_max          = EXCLUDED.play_max,
    fantasy_max       = EXCLUDED.fantasy_max,
    predict_max       = EXCLUDED.predict_max,
    n_members_play    = EXCLUDED.n_members_play,
    n_members_fantasy = EXCLUDED.n_members_fantasy,
    n_members_predict = EXCLUDED.n_members_predict,
    calculado_em      = now()
  RETURNING gp_id, play_max, fantasy_max, predict_max
),

-- ── 2. Upsert global_ranking (one row per member × GP) ───────────────────────
upsert_ranking AS (
  INSERT INTO global_ranking (
    member_email, gp_id,
    play_pts, fantasy_pts, predict_pts,
    play_gpts, fantasy_gpts, predict_gpts,
    global_score, n_ligas
  )
  SELECT
    member_email,
    (SELECT target_gp FROM config),
    play_pts,
    fantasy_pts,
    predict_pts,
    play_gpts,
    fantasy_gpts,
    predict_gpts,
    ROUND((play_gpts + fantasy_gpts + predict_gpts) / 3.0, 1) AS global_score,
    n_ligas
  FROM normalised
  ON CONFLICT (member_email, gp_id) DO UPDATE SET
    play_pts     = EXCLUDED.play_pts,
    fantasy_pts  = EXCLUDED.fantasy_pts,
    predict_pts  = EXCLUDED.predict_pts,
    play_gpts    = EXCLUDED.play_gpts,
    fantasy_gpts = EXCLUDED.fantasy_gpts,
    predict_gpts = EXCLUDED.predict_gpts,
    global_score = EXCLUDED.global_score,
    n_ligas      = EXCLUDED.n_ligas,
    calculado_em = now()
  RETURNING member_email, global_score
)

-- ── Summary output ────────────────────────────────────────────────────────────
SELECT
  (SELECT gp_id    FROM upsert_stats)     AS gp_recalculado,
  (SELECT play_max FROM upsert_stats)     AS play_max,
  (SELECT fantasy_max FROM upsert_stats)  AS fantasy_max,
  (SELECT predict_max FROM upsert_stats)  AS predict_max,
  COUNT(*)                                AS membros_actualizados,
  ROUND(AVG(global_score), 1)             AS media_global_score,
  MAX(global_score)                       AS top_score
FROM upsert_ranking;
