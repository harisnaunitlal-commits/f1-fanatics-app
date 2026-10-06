-- =====================================================
-- PATCH: GP Singapura R17 — Sprint Weekend
-- Executar no Supabase SQL Editor
-- Data: 2026-10-06
-- =====================================================
-- Horários locais (SGT = UTC+8):
--   Practice 1:        Sex 9 Out  10:30 SGT = 02:30 UTC
--   Sprint Qualifying: Sex 9 Out  14:30 SGT = 06:30 UTC
--   Sprint:            Sáb 10 Out 11:00 SGT = 03:00 UTC
--   Qualifying:        Sáb 10 Out 15:00 SGT = 07:00 UTC
--   Race:              Dom 11 Out 14:00 SGT = 06:00 UTC
-- deadline_fantasy = início do Sprint (Sáb 03:00 UTC)
-- deadline_play fecha = início da corrida (Dom 06:00 UTC)
-- deadline_play abre = qualifying_start + 2h = 09:00 UTC = 17:00 SGT
-- =====================================================

UPDATE gp_calendar
SET
  fp1_start        = '2026-10-09 02:30:00+00',
  fp2_start        = '2026-10-09 06:30:00+00',
  fp3_start        = '2026-10-10 03:00:00+00',
  qualifying_start = '2026-10-10 07:00:00+00',
  data_corrida     = '2026-10-11 06:00:00+00',
  deadline_play    = '2026-10-11 06:00:00+00',
  deadline_fantasy = '2026-10-10 03:00:00+00',
  deadline_predict = '2026-10-10 03:00:00+00',
  is_sprint        = true,
  status           = 'upcoming'
WHERE nome = 'Singapura'
  AND temporada = 2026;

-- Verificar resultado
SELECT
  nome, round, is_sprint,
  fp1_start        AT TIME ZONE 'Asia/Singapore' AS practice1_sgt,
  fp2_start        AT TIME ZONE 'Asia/Singapore' AS sprint_qual_sgt,
  fp3_start        AT TIME ZONE 'Asia/Singapore' AS sprint_sgt,
  qualifying_start AT TIME ZONE 'Asia/Singapore' AS qualifying_sgt,
  data_corrida     AT TIME ZONE 'Asia/Singapore' AS race_sgt,
  deadline_fantasy AT TIME ZONE 'Asia/Singapore' AS fantasy_deadline_sgt,
  deadline_play    AT TIME ZONE 'Asia/Singapore' AS play_closes_sgt
FROM gp_calendar
WHERE nome = 'Singapura' AND temporada = 2026;
