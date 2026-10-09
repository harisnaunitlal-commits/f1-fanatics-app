-- =====================================================
-- PATCH: Agendamento das push notifications (pg_cron)
-- Executar no Supabase SQL Editor
-- Data: 2026-10-10
-- =====================================================
-- O plano Hobby do Vercel só permite crons diários, por isso
-- o Supabase chama o endpoint de 5 em 5 minutos.
-- =====================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('push-notifications')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'push-notifications');

SELECT cron.schedule(
  'push-notifications',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url     := 'https://app.beiraf1fanatics.com/api/cron/push-notifications',
    headers := '{"Authorization": "Bearer f1beira2026cron47291"}'::jsonb
  );
  $$
);

-- Verificar
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'push-notifications';
