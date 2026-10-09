-- =====================================================
-- PATCH: Push Notifications — tabelas necessárias
-- Executar no Supabase SQL Editor
-- Data: 2026-10-10
-- =====================================================

-- Subscrições push por utilizador
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own subscriptions"
  ON push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Log de notificações enviadas (deduplicação)
CREATE TABLE IF NOT EXISTS notification_log (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  gp_id             int NOT NULL REFERENCES gp_calendar(id) ON DELETE CASCADE,
  notification_type text NOT NULL, -- 'fantasy_1h', 'play_opens', 'play_closes_1h'
  recipients        int DEFAULT 0,
  sent_ok           int DEFAULT 0,
  sent_at           timestamptz DEFAULT now(),
  UNIQUE(gp_id, notification_type)
);

-- Só admins/service role podem ver o log
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- Verificar estrutura
SELECT 'push_subscriptions' AS tabela, count(*) AS linhas FROM push_subscriptions
UNION ALL
SELECT 'notification_log', count(*) FROM notification_log;
