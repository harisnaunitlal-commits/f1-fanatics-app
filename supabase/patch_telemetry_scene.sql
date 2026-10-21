-- =====================================================
-- PATCH: Telemetria — "cena" montada pelo admin (1 linha)
-- Executar no Supabase SQL Editor
-- Data: 2026-10-21
-- =====================================================
-- O admin escolhe sessão, modo (replay/live), painéis, pilotos em destaque e mensagem.
-- Os membros só lêem: o servidor devolve-lhes sempre a mesma cena.
-- Escritas só pela API /api/admin/telemetria/scene (service role, verifica is_admin).

CREATE TABLE IF NOT EXISTS telemetry_scene (
  id                    int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  session_key           int,
  gp_id                 int REFERENCES gp_calendar(id) ON DELETE SET NULL,
  mode                  text NOT NULL DEFAULT 'replay' CHECK (mode IN ('replay', 'live')),
  replay_anchor_session timestamptz,
  replay_anchor_real    timestamptz,
  replay_speed          numeric NOT NULL DEFAULT 1,
  replay_playing        boolean NOT NULL DEFAULT false,
  total_laps            int,
  panels                jsonb NOT NULL DEFAULT '{"tower": true, "strategy": true, "control": true, "ours": true}',
  featured              text[] NOT NULL DEFAULT '{}',
  banner                text,
  members_enabled       boolean NOT NULL DEFAULT false,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE telemetry_scene ENABLE ROW LEVEL SECURITY;

INSERT INTO telemetry_scene (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

SELECT id, mode, members_enabled FROM telemetry_scene;
