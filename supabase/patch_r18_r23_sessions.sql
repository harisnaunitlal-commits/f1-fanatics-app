-- =====================================================
-- PATCH: Horários das sessões R18–R23 (fim de época 2026)
-- Aplicado via API em 2026-10-12. Guardado aqui para registo / re-execução.
-- Regra: deadline_fantasy = deadline_predict = qualifying_start (fim-de-semana normal)
--        deadline_play = data_corrida ; F1 Play abre em qualifying_start + 2h
-- Todas as horas em UTC. Moçambique = UTC+2 (sem hora de verão).
-- =====================================================

-- R18 EUA (Austin, CDT = UTC-5) — confirmado no site F1, "My time" Moçambique:
-- P1 Sex 23 Out 19:30 MZ · P2 23:00 MZ · P3 Sáb 24 Out 19:30 MZ · Q 23:00 MZ · Corrida Dom 25 Out 22:00 MZ
UPDATE gp_calendar SET
  fp1_start='2026-10-23 17:30+00', fp2_start='2026-10-23 21:00+00',
  fp3_start='2026-10-24 17:30+00', qualifying_start='2026-10-24 21:00+00',
  data_corrida='2026-10-25 20:00+00', deadline_play='2026-10-25 20:00+00',
  deadline_fantasy='2026-10-24 21:00+00', deadline_predict='2026-10-24 21:00+00', is_sprint=false
WHERE id=16;

-- R19 México (CST = UTC-6) — P1 Sex 30 Out 20:30 MZ · P2 Sáb 00:00 MZ · P3 Sáb 31 Out 19:30 MZ · Q 23:00 MZ · Corrida Dom 1 Nov 22:00 MZ
UPDATE gp_calendar SET
  fp1_start='2026-10-30 18:30+00', fp2_start='2026-10-30 22:00+00',
  fp3_start='2026-10-31 17:30+00', qualifying_start='2026-10-31 21:00+00',
  data_corrida='2026-11-01 20:00+00', deadline_play='2026-11-01 20:00+00',
  deadline_fantasy='2026-10-31 21:00+00', deadline_predict='2026-10-31 21:00+00', is_sprint=false
WHERE id=17;

-- R20 Brasil (BRT = UTC-3) — confirmado no site F1: P1 Sex 6 Nov 17:30 MZ · P2 21:00 MZ · P3 Sáb 7 Nov 16:30 MZ · Q 20:00 MZ · Corrida Dom 8 Nov 19:00 MZ
UPDATE gp_calendar SET
  fp1_start='2026-11-06 15:30+00', fp2_start='2026-11-06 19:00+00',
  fp3_start='2026-11-07 14:30+00', qualifying_start='2026-11-07 18:00+00',
  data_corrida='2026-11-08 17:00+00', deadline_play='2026-11-08 17:00+00',
  deadline_fantasy='2026-11-07 18:00+00', deadline_predict='2026-11-07 18:00+00', is_sprint=false
WHERE id=18;

-- R21 Las Vegas (PST = UTC-8) — CONFIRMAR NO SITE F1. Corrida Sáb 21 Nov 20:00 local = Dom 22 Nov 06:00 MZ
-- P1 Sex 20 Nov 02:30 MZ · P2 06:00 MZ · P3 Sáb 21 Nov 02:30 MZ · Q 06:00 MZ
UPDATE gp_calendar SET
  fp1_start='2026-11-20 00:30+00', fp2_start='2026-11-20 04:00+00',
  fp3_start='2026-11-21 00:30+00', qualifying_start='2026-11-21 04:00+00',
  data_corrida='2026-11-22 04:00+00', deadline_play='2026-11-22 04:00+00',
  deadline_fantasy='2026-11-21 04:00+00', deadline_predict='2026-11-21 04:00+00', is_sprint=false
WHERE id=19;

-- R22 Qatar (AST = UTC+3) — confirmado no site F1: P1 Sex 27 Nov 15:30 MZ · P2 19:00 MZ · P3 Sáb 28 Nov 16:30 MZ · Q 20:00 MZ · Corrida Dom 29 Nov 18:00 MZ
UPDATE gp_calendar SET
  fp1_start='2026-11-27 13:30+00', fp2_start='2026-11-27 17:00+00',
  fp3_start='2026-11-28 14:30+00', qualifying_start='2026-11-28 18:00+00',
  data_corrida='2026-11-29 16:00+00', deadline_play='2026-11-29 16:00+00',
  deadline_fantasy='2026-11-28 18:00+00', deadline_predict='2026-11-28 18:00+00', is_sprint=false
WHERE id=20;

-- R23 Abu Dhabi (GST = UTC+4) — P1 Sex 4 Dez 11:30 MZ · P2 15:00 MZ · P3 Sáb 5 Dez 12:30 MZ · Q 16:00 MZ · Corrida Dom 6 Dez 15:00 MZ
UPDATE gp_calendar SET
  fp1_start='2026-12-04 09:30+00', fp2_start='2026-12-04 13:00+00',
  fp3_start='2026-12-05 10:30+00', qualifying_start='2026-12-05 14:00+00',
  data_corrida='2026-12-06 13:00+00', deadline_play='2026-12-06 13:00+00',
  deadline_fantasy='2026-12-05 14:00+00', deadline_predict='2026-12-05 14:00+00', is_sprint=false
WHERE id=21;

SELECT round, nome,
  fp1_start AT TIME ZONE 'Africa/Maputo' AS p1_mz, qualifying_start AT TIME ZONE 'Africa/Maputo' AS q_mz,
  data_corrida AT TIME ZONE 'Africa/Maputo' AS corrida_mz,
  (qualifying_start + interval '2 hours') AT TIME ZONE 'Africa/Maputo' AS play_abre_mz
FROM gp_calendar WHERE id BETWEEN 16 AND 21 ORDER BY round;
