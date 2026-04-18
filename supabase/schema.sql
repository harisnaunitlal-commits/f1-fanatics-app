-- =========================================
-- BEIRA F1 FANATICS 2026 — SCHEMA COMPLETO
-- Executar no Supabase SQL Editor
-- =========================================

-- MEMBROS
CREATE TABLE members (
  email              TEXT PRIMARY KEY,
  nome_completo      TEXT NOT NULL,
  nickname           TEXT NOT NULL UNIQUE,
  foto_url           TEXT,
  whatsapp           TEXT,
  piloto_fav         TEXT,
  equipa_fav         TEXT,
  fantasy_nick       TEXT,
  predict_nick       TEXT,
  data_nasc          DATE,
  sexo               TEXT CHECK (sexo IN ('M','F','outro','prefiro_nao_dizer')),
  cidade             TEXT,
  pais               TEXT DEFAULT 'Moçambique',
  empresa            TEXT,
  area_profissional  TEXT,
  bio                TEXT CHECK (char_length(bio) <= 100),
  visibilidade       TEXT DEFAULT 'publico' CHECK (visibilidade IN ('publico','membros','privado')),
  is_admin           BOOLEAN DEFAULT false,
  activo             BOOLEAN DEFAULT true,
  criado_em          TIMESTAMPTZ DEFAULT now(),
  actualizado_em     TIMESTAMPTZ DEFAULT now()
);

-- CALENDÁRIO DE GPs
CREATE TABLE gp_calendar (
  id                 SERIAL PRIMARY KEY,
  temporada          INTEGER DEFAULT 2026,
  round              INTEGER NOT NULL,
  nome               TEXT NOT NULL,
  circuito           TEXT NOT NULL,
  pais               TEXT NOT NULL,
  emoji_bandeira     TEXT,
  data_corrida       TIMESTAMPTZ NOT NULL,
  deadline_play      TIMESTAMPTZ NOT NULL,
  deadline_predict   TIMESTAMPTZ,
  status             TEXT DEFAULT 'upcoming'
                     CHECK (status IN ('upcoming','active','closed','scored')),
  UNIQUE(temporada, round)
);

-- PREVISÕES F1 PLAY
CREATE TABLE predictions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_email    TEXT REFERENCES members(email) ON DELETE CASCADE,
  gp_id           INTEGER REFERENCES gp_calendar(id),
  p1_primeiro     TEXT, p1_segundo TEXT, p1_terceiro TEXT,
  p2_equipa       TEXT,
  p3_lap          TEXT,
  p4_quarto       TEXT, p4_quinto TEXT, p4_sexto TEXT,
  p5_duelo        TEXT, p6_duelo TEXT, p7_duelo TEXT,
  p8_margem       TEXT,
  p9_retire       TEXT,
  p10_dotd        TEXT,
  p11_fl          TEXT,
  p12_classif     TEXT,
  p13_especial    TEXT, p14_sc TEXT, p15_outsider TEXT,
  submetido_em    TIMESTAMPTZ DEFAULT now(),
  editado_em      TIMESTAMPTZ DEFAULT now(),
  versao          INTEGER DEFAULT 1,
  UNIQUE(member_email, gp_id)
);

-- RESPOSTAS CORRECTAS (admin insere após corrida)
CREATE TABLE gp_answers (
  gp_id              INTEGER PRIMARY KEY REFERENCES gp_calendar(id),
  p1_primeiro        TEXT, p1_segundo TEXT, p1_terceiro TEXT,
  p2_equipa          TEXT, p3_lap TEXT,
  p4_quarto          TEXT, p4_quinto TEXT, p4_sexto TEXT,
  p5_duelo           TEXT, p6_duelo TEXT, p7_duelo TEXT,
  p8_margem          TEXT, p9_retire TEXT, p10_dotd TEXT,
  p11_fl             TEXT, p12_classif TEXT,
  p13_especial       TEXT, p14_sc TEXT, p15_outsider TEXT,
  perguntas_anuladas TEXT[],
  inserido_por       TEXT REFERENCES members(email),
  inserido_em        TIMESTAMPTZ DEFAULT now()
);

-- PONTUAÇÕES F1 PLAY
CREATE TABLE scores_play (
  member_email    TEXT REFERENCES members(email),
  gp_id           INTEGER REFERENCES gp_calendar(id),
  pts_p1a INTEGER DEFAULT 0, pts_p1b INTEGER DEFAULT 0, pts_p1c INTEGER DEFAULT 0,
  pts_p2  INTEGER DEFAULT 0, pts_p3  INTEGER DEFAULT 0,
  pts_p4a INTEGER DEFAULT 0, pts_p4b INTEGER DEFAULT 0, pts_p4c INTEGER DEFAULT 0,
  pts_p5  INTEGER DEFAULT 0, pts_p6  INTEGER DEFAULT 0, pts_p7  INTEGER DEFAULT 0,
  pts_p8  INTEGER DEFAULT 0, pts_p9  INTEGER DEFAULT 0, pts_p10 INTEGER DEFAULT 0,
  pts_p11 INTEGER DEFAULT 0, pts_p12 INTEGER DEFAULT 0,
  pts_p13 INTEGER DEFAULT 0, pts_p14 INTEGER DEFAULT 0, pts_p15 INTEGER DEFAULT 0,
  total           INTEGER DEFAULT 0,
  participou      BOOLEAN DEFAULT true,
  calculado_em    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(member_email, gp_id)
);

-- PONTUAÇÕES F1 FANTASY
CREATE TABLE scores_fantasy (
  member_email    TEXT REFERENCES members(email),
  gp_id           INTEGER REFERENCES gp_calendar(id),
  equipa_nome     TEXT NOT NULL,
  pontos_acum     INTEGER NOT NULL,
  pontos_gp       INTEGER,
  importado_em    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(member_email, gp_id)
);

-- PONTUAÇÕES F1 PREDICT
CREATE TABLE scores_predict (
  member_email    TEXT REFERENCES members(email),
  gp_id           INTEGER REFERENCES gp_calendar(id),
  nick_predict    TEXT NOT NULL,
  pontos_acum     INTEGER NOT NULL,
  accuracy_pct    INTEGER,
  importado_em    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(member_email, gp_id)
);

-- GLOBAL RANKING (snapshot após cada GP)
CREATE TABLE global_ranking (
  member_email       TEXT REFERENCES members(email),
  gp_id              INTEGER REFERENCES gp_calendar(id),
  play_pts           INTEGER DEFAULT 0,
  fantasy_pts        INTEGER DEFAULT 0,
  predict_pts        INTEGER DEFAULT 0,
  play_max           INTEGER,
  fantasy_max        INTEGER,
  predict_max        INTEGER,
  play_gpts          NUMERIC(5,1),
  fantasy_gpts       NUMERIC(5,1),
  predict_gpts       NUMERIC(5,1),
  global_score       NUMERIC(5,1),
  n_ligas            INTEGER,
  calculado_em       TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(member_email, gp_id)
);

-- AUDIT LOG
CREATE TABLE audit_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email     TEXT REFERENCES members(email),
  accao           TEXT NOT NULL,
  gp_id           INTEGER,
  detalhes        JSONB,
  criado_em       TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- ROW LEVEL SECURITY
-- =========================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_play ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_fantasy ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_predict ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE gp_calendar ENABLE ROW LEVEL SECURITY;

-- gp_calendar: todos podem ler
CREATE POLICY "gp_calendar_public_read" ON gp_calendar FOR SELECT USING (true);
CREATE POLICY "gp_calendar_admin_write" ON gp_calendar FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

-- members: leitura pública de perfis públicos, escrita própria
CREATE POLICY "members_public_read" ON members FOR SELECT
  USING (visibilidade = 'publico' OR auth.jwt()->>'email' = email);
CREATE POLICY "members_self_write" ON members FOR ALL
  USING (auth.jwt()->>'email' = email);
CREATE POLICY "members_admin_all" ON members FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

-- predictions: cada membro vê as suas
CREATE POLICY "predictions_self" ON predictions FOR ALL
  USING (auth.jwt()->>'email' = member_email);
CREATE POLICY "predictions_admin" ON predictions FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

-- scores: todos podem ler (ranking público)
CREATE POLICY "scores_play_read" ON scores_play FOR SELECT USING (true);
CREATE POLICY "scores_play_admin" ON scores_play FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

CREATE POLICY "scores_fantasy_read" ON scores_fantasy FOR SELECT USING (true);
CREATE POLICY "scores_fantasy_admin" ON scores_fantasy FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

CREATE POLICY "scores_predict_read" ON scores_predict FOR SELECT USING (true);
CREATE POLICY "scores_predict_admin" ON scores_predict FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

CREATE POLICY "global_ranking_read" ON global_ranking FOR SELECT USING (true);
CREATE POLICY "global_ranking_admin" ON global_ranking FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

-- gp_answers: todos podem ler após scored
CREATE POLICY "gp_answers_read" ON gp_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM gp_calendar WHERE id = gp_id AND status = 'scored')
);
CREATE POLICY "gp_answers_admin" ON gp_answers FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

-- audit_log: só admin
CREATE POLICY "audit_admin" ON audit_log FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

-- =========================================
-- TRIGGER: actualizado_em automático
-- =========================================
CREATE OR REPLACE FUNCTION update_actualizado_em()
RETURNS TRIGGER AS $$
BEGIN NEW.actualizado_em = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_actualizado_em
  BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_actualizado_em();
