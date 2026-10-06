-- =====================================================
-- PATCH: GP Singapura R17 — Sprint Weekend
-- Executar no Supabase SQL Editor
-- Data: 2026-10-06
-- =====================================================
-- Horários em hora de Moçambique (CAT = UTC+2):
--   Practice 1:        Sex 9 Out  10:30 MZ = 08:30 UTC
--   Sprint Qualifying: Sex 9 Out  14:30 MZ = 12:30 UTC
--   Sprint:            Sáb 10 Out 11:00 MZ = 09:00 UTC
--   Qualifying:        Sáb 10 Out 15:00 MZ = 13:00 UTC
--   Race:              Dom 11 Out 14:00 MZ = 12:00 UTC
-- deadline_fantasy = início do Sprint (Sáb 09:00 UTC = 11:00 MZ)
-- deadline_play fecha = início da corrida (Dom 12:00 UTC = 14:00 MZ)
-- deadline_play abre = qualifying_start + 2h = 15:00 UTC = 17:00 MZ
-- Singapura é corrida nocturna: Race 20:00 SGT = 14:00 MZ
-- =====================================================

UPDATE gp_calendar
SET
  fp1_start        = '2026-10-09 08:30:00+00',
  fp2_start        = '2026-10-09 12:30:00+00',
  fp3_start        = '2026-10-10 09:00:00+00',
  qualifying_start = '2026-10-10 13:00:00+00',
  data_corrida     = '2026-10-11 12:00:00+00',
  deadline_play    = '2026-10-11 12:00:00+00',
  deadline_fantasy = '2026-10-10 09:00:00+00',
  deadline_predict = '2026-10-10 09:00:00+00',
  is_sprint        = true,
  status           = 'upcoming'
WHERE nome = 'Singapura'
  AND temporada = 2026;

-- Verificar resultado em hora de Moçambique
SELECT
  nome, round, is_sprint,
  fp1_start        AT TIME ZONE 'Africa/Maputo' AS practice1_mz,
  fp2_start        AT TIME ZONE 'Africa/Maputo' AS sprint_qual_mz,
  fp3_start        AT TIME ZONE 'Africa/Maputo' AS sprint_mz,
  qualifying_start AT TIME ZONE 'Africa/Maputo' AS qualifying_mz,
  data_corrida     AT TIME ZONE 'Africa/Maputo' AS race_mz,
  deadline_fantasy AT TIME ZONE 'Africa/Maputo' AS fantasy_deadline_mz,
  deadline_play    AT TIME ZONE 'Africa/Maputo' AS play_closes_mz
FROM gp_calendar
WHERE nome = 'Singapura' AND temporada = 2026;
