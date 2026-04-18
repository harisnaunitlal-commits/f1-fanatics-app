-- =========================================
-- PATCH: Tabelas em falta + dados corrigidos
-- Executar no Supabase SQL Editor
-- Última actualização: 2026-04-18
-- =========================================

-- 1. CRIAR TABELAS EM FALTA
-- =========================================

CREATE TABLE IF NOT EXISTS scores_fantasy (
  member_email    TEXT REFERENCES members(email),
  gp_id           INTEGER REFERENCES gp_calendar(id),
  equipa_nome     TEXT NOT NULL,
  pontos_acum     INTEGER NOT NULL,
  pontos_gp       INTEGER,
  importado_em    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(member_email, gp_id)
);

CREATE TABLE IF NOT EXISTS scores_predict (
  member_email    TEXT REFERENCES members(email),
  gp_id           INTEGER REFERENCES gp_calendar(id),
  nick_predict    TEXT NOT NULL,
  pontos_acum     INTEGER NOT NULL,
  accuracy_pct    INTEGER,
  importado_em    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(member_email, gp_id)
);

-- season_stats: maxes per scored GP (one row per GP, shared across all members)
CREATE TABLE IF NOT EXISTS season_stats (
  gp_id                INTEGER PRIMARY KEY REFERENCES gp_calendar(id),
  play_max             INTEGER NOT NULL,
  fantasy_max          INTEGER NOT NULL,
  predict_max          INTEGER NOT NULL,
  n_members_play       INTEGER NOT NULL DEFAULT 0,
  n_members_fantasy    INTEGER NOT NULL DEFAULT 0,
  n_members_predict    INTEGER NOT NULL DEFAULT 0,
  calculado_em         TIMESTAMPTZ DEFAULT now()
);

-- global_ranking: one row per (member × GP) — full season history, no max columns
CREATE TABLE IF NOT EXISTS global_ranking (
  member_email    TEXT    REFERENCES members(email),
  gp_id           INTEGER REFERENCES gp_calendar(id),
  play_pts        INTEGER     NOT NULL DEFAULT 0,
  fantasy_pts     INTEGER     NOT NULL DEFAULT 0,
  predict_pts     INTEGER     NOT NULL DEFAULT 0,
  play_gpts       NUMERIC(5,1) NOT NULL DEFAULT 0,
  fantasy_gpts    NUMERIC(5,1) NOT NULL DEFAULT 0,
  predict_gpts    NUMERIC(5,1) NOT NULL DEFAULT 0,
  global_score    NUMERIC(5,1) NOT NULL DEFAULT 0,
  n_ligas         INTEGER     NOT NULL DEFAULT 0,
  calculado_em    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (member_email, gp_id)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email     TEXT REFERENCES members(email),
  accao           TEXT NOT NULL,
  gp_id           INTEGER,
  detalhes        JSONB,
  criado_em       TIMESTAMPTZ DEFAULT now()
);

-- 2. ENABLE RLS + POLICIES
-- =========================================

ALTER TABLE scores_fantasy ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores_predict ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_stats   ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scores_fantasy_read" ON scores_fantasy FOR SELECT USING (true);
CREATE POLICY "scores_fantasy_admin" ON scores_fantasy FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

CREATE POLICY "scores_predict_read" ON scores_predict FOR SELECT USING (true);
CREATE POLICY "scores_predict_admin" ON scores_predict FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

CREATE POLICY "season_stats_read" ON season_stats FOR SELECT USING (true);
CREATE POLICY "season_stats_admin" ON season_stats FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

CREATE POLICY "global_ranking_read" ON global_ranking FOR SELECT USING (true);
CREATE POLICY "global_ranking_admin" ON global_ranking FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

CREATE POLICY "audit_admin" ON audit_log FOR ALL
  USING (EXISTS (SELECT 1 FROM members WHERE email = auth.jwt()->>'email' AND is_admin = true));

-- 3. NOVOS MEMBROS (7 — apenas Fantasy e/ou Predict, não jogam F1 Play)
-- =========================================

INSERT INTO members (email, nome_completo, nickname, fantasy_nick, predict_nick, pais, is_admin, activo) VALUES
('derciopita1990@gmail.com',  'Remane Pita',     'Remane',  'DP F1 Team',           'DPita - The Champion', 'Moçambique', false, true),
('hcoelho.tco@gmail.com',     'Henrique Coelho', 'Henrique','H[R]C Racing',          'H[R]C Racing',         'Moçambique', false, true),
('pedrowjorge@gmail.com',     'Pedro Antônio',   'Pedro',   'Focus Racing',          'Focus Racing',         'Moçambique', false, true),
('abilioantunes789@gmail.com','Nelo Antunes',     'Nelo',    'Nelo''s team',          'Nello 44',             'Moçambique', false, true),
('salehjabry7@gmail.com',     'Saleh Jabry',     'Saleh',   'TeamJabry',             NULL,                   'Moçambique', false, true),
('Atumane.Momade@icloud.com', 'Atumane Momade',  'Atumane', 'Momade F1',             NULL,                   'Moçambique', false, true),
('bzzz.bummm@gmail.com',      'Zuneid Gulamo',   'Zuneid',  'Zunas 1',               'Zunas_1',              'Moçambique', false, true)
ON CONFLICT (email) DO NOTHING;

-- 4. FIX SCORES_PLAY R02: transalves020 em falta
-- =========================================

INSERT INTO scores_play (member_email, gp_id, total, participou)
VALUES ('transalves020@gmail.com', 2, 6, true)
ON CONFLICT (member_email, gp_id) DO NOTHING;

-- 5. SCORES_PLAY R03 Japão (0 rows → inserir 18 rows)
-- =========================================

INSERT INTO scores_play (member_email, gp_id, total, participou) VALUES
('haris.naunitlal@gmail.com',       3,  8, true),
('amamudo@gmail.com',               3,  9, true),
('miguel.nhaia@gmail.com',          3,  9, true),
('marco.antunes@live.com',          3,  8, true),
('amarildomomola@gmail.com',        3,  6, true),
('nkajaria02@gmail.com',            3,  4, true),
('anuargoncalves@gmail.com',        3,  7, true),
('sacur.luismiguel78@gmail.com',    3,  6, true),
('mauro.demelo2014@gmail.com',      3,  9, true),
('smotichande@gmail.com',           3,  6, true),
('transalves020@gmail.com',         3,  9, true),
('jtingane@gmail.com',              3,  9, true),
('rishilsubash@gmail.com',          3,  6, true),
('ryanbulha12@gmail.com',           3,  7, true),
('chimuzu@gmail.com',               3,  7, true),
('lino.carlos76@gmail.com',         3,  0, false),
('kingdercio@gmail.com',            3,  6, true),
('graciano.mahumane@gmail.com',     3,  4, true)
ON CONFLICT (member_email, gp_id) DO NOTHING;

-- 6. SCORES_FANTASY R01 — 21 membros
-- pontos_acum = acumulado a correr | pontos_gp = score dessa corrida
-- R01: pontos_acum = pontos_gp (primeira corrida)
-- =========================================

INSERT INTO scores_fantasy (member_email, gp_id, equipa_nome, pontos_acum, pontos_gp) VALUES
('haris.naunitlal@gmail.com',       1, 'PCA Team',             225,  225),
('amamudo@gmail.com',               1, 'Virgo F1',             251,  251),
('marco.antunes@live.com',          1, 'Maranello Kings',      158,  158),
('anuargoncalves@gmail.com',        1, 'ANUA super max 2026',  163,  163),
('miguel.nhaia@gmail.com',          1, 'IsoF1 Team',           133,  133),
('allencosta230@gmail.com',         1, 'ABx Racing',           183,  183),
('lino.carlos76@gmail.com',         1, 'Cape_AMG Mercedes',    233,  233),
('amarildomomola@gmail.com',        1, 'RtF1Team1',            162,  162),
('alexandreferreira0208@gmail.com', 1, 'AlexFer#1',            209,  209),
('nkajaria02@gmail.com',            1, 'nileshmz',              75,   75),
('ravi.prehlad@gmail.com',          1, 'Vettel''s DRS',        196,  196),
('ericson.kun@gmail.com',           1, 'ALPIST44',             177,  177),
('jtingane@gmail.com',              1, 'DonodaBolaF1',         176,  176),
('sacur.luismiguel78@gmail.com',    1, 'Lloyd 26',              14,   14),
('derciopita1990@gmail.com',        1, 'DP F1 Team',           215,  215),
('hcoelho.tco@gmail.com',           1, 'H[R]C Racing',         227,  227),
('pedrowjorge@gmail.com',           1, 'Focus Racing',         224,  224),
('abilioantunes789@gmail.com',      1, 'Nelo''s team',         240,  240),
('salehjabry7@gmail.com',           1, 'TeamJabry',            197,  197),
('Atumane.Momade@icloud.com',       1, 'Momade F1',            210,  210)
-- Zuneid não participou na Austrália
ON CONFLICT (member_email, gp_id) DO UPDATE SET
  pontos_acum = EXCLUDED.pontos_acum,
  pontos_gp   = EXCLUDED.pontos_gp;

-- 7. SCORES_FANTASY R02 — 21 membros
-- pontos_acum = R01 + R02 | pontos_gp = score da China
-- =========================================

INSERT INTO scores_fantasy (member_email, gp_id, equipa_nome, pontos_acum, pontos_gp) VALUES
('haris.naunitlal@gmail.com',       2, 'PCA Team',             706,  481),
('amamudo@gmail.com',               2, 'Virgo F1',             590,  339),
('marco.antunes@live.com',          2, 'Maranello Kings',      495,  337),
('anuargoncalves@gmail.com',        2, 'ANUA super max 2026',  454,  291),
('miguel.nhaia@gmail.com',          2, 'IsoF1 Team',           456,  323),
('allencosta230@gmail.com',         2, 'ABx Racing',           481,  298),
('lino.carlos76@gmail.com',         2, 'Cape_AMG Mercedes',    530,  297),
('amarildomomola@gmail.com',        2, 'RtF1Team1',            407,  245),
('alexandreferreira0208@gmail.com', 2, 'AlexFer#1',            481,  272),
('nkajaria02@gmail.com',            2, 'nileshmz',             306,  231),
('ravi.prehlad@gmail.com',          2, 'Vettel''s DRS',        383,  187),
('ericson.kun@gmail.com',           2, 'ALPIST44',             415,  238),
('jtingane@gmail.com',              2, 'DonodaBolaF1',         332,  156),
('sacur.luismiguel78@gmail.com',    2, 'Lloyd 26',              44,   30),
('derciopita1990@gmail.com',        2, 'DP F1 Team',           595,  380),
('hcoelho.tco@gmail.com',           2, 'H[R]C Racing',         617,  390),
('pedrowjorge@gmail.com',           2, 'Focus Racing',         552,  328),
('abilioantunes789@gmail.com',      2, 'Nelo''s team',         540,  300),
('salehjabry7@gmail.com',           2, 'TeamJabry',            415,  218),
('Atumane.Momade@icloud.com',       2, 'Momade F1',            396,  186),
('bzzz.bummm@gmail.com',            2, 'Zunas 1',              317,  317)
ON CONFLICT (member_email, gp_id) DO UPDATE SET
  pontos_acum = EXCLUDED.pontos_acum,
  pontos_gp   = EXCLUDED.pontos_gp;

-- 8. SCORES_FANTASY R03 — 21 membros
-- pontos_acum = Overall (R01+R02+R03) | pontos_gp = score do Japão
-- =========================================

INSERT INTO scores_fantasy (member_email, gp_id, equipa_nome, pontos_acum, pontos_gp) VALUES
('haris.naunitlal@gmail.com',       3, 'PCA Team',             994,  288),
('amamudo@gmail.com',               3, 'Virgo F1',             732,  142),
('marco.antunes@live.com',          3, 'Maranello Kings',      636,  141),
('anuargoncalves@gmail.com',        3, 'ANUA super max 2026',  636,  182),
('miguel.nhaia@gmail.com',          3, 'IsoF1 Team',           599,  143),
('allencosta230@gmail.com',         3, 'ABx Racing',           648,  167),
('lino.carlos76@gmail.com',         3, 'Cape_AMG Mercedes',    676,  146),
('amarildomomola@gmail.com',        3, 'RtF1Team1',            569,  162),
('alexandreferreira0208@gmail.com', 3, 'AlexFer#1',            591,  110),
('nkajaria02@gmail.com',            3, 'nileshmz',             453,  147),
('ravi.prehlad@gmail.com',          3, 'Vettel''s DRS',        561,  178),
('ericson.kun@gmail.com',           3, 'ALPIST44',             506,   91),
('jtingane@gmail.com',              3, 'DonodaBolaF1',         420,   88),
('sacur.luismiguel78@gmail.com',    3, 'Lloyd 26',             165,  121),
('derciopita1990@gmail.com',        3, 'DP F1 Team',           806,  211),
('hcoelho.tco@gmail.com',           3, 'H[R]C Racing',         791,  174),
('pedrowjorge@gmail.com',           3, 'Focus Racing',         716,  164),
('abilioantunes789@gmail.com',      3, 'Nelo''s team',         700,  160),
('salehjabry7@gmail.com',           3, 'TeamJabry',            649,  234),
('Atumane.Momade@icloud.com',       3, 'Momade F1',            469,   73),
('bzzz.bummm@gmail.com',            3, 'Zunas 1',              463,  146)
ON CONFLICT (member_email, gp_id) DO UPDATE SET
  pontos_acum = EXCLUDED.pontos_acum,
  pontos_gp   = EXCLUDED.pontos_gp;

-- 9. SCORES_PREDICT R01 — 16 membros existentes
-- pontos_acum = score da Austrália (primeira corrida)
-- =========================================

INSERT INTO scores_predict (member_email, gp_id, nick_predict, pontos_acum) VALUES
('haris.naunitlal@gmail.com',       1, 'PCA Team',             89),
('miguel.nhaia@gmail.com',          1, 'Isolino Nhaia',        93),
('ravi.prehlad@gmail.com',          1, 'RAVI_HP',              86),
('consorridente@gmail.com',         1, 'António Pinho',        66),
('nkajaria02@gmail.com',            1, 'nileshmz',             56),
('mauro.demelo2014@gmail.com',      1, 'MauroMV1',             56),
('marco.antunes@live.com',          1, 'Maranello Kings',      49),
('amarildomomola@gmail.com',        1, 'Mr Momola - F1',       45),
('lino.carlos76@gmail.com',         1, 'Cape_AMG Mercedes',    45),
('ericson.kun@gmail.com',           1, 'Alpist44',             42),
('amamudo@gmail.com',               1, 'VirgoF1',              40),
('alexandreferreira0208@gmail.com', 1, 'Alexandre28',          30),
('sacur.luismiguel78@gmail.com',    1, 'Luís Miguel Sacur',    24),
('rishilsubash@gmail.com',          1, 'Rix_23',               73),
('anuargoncalves@gmail.com',        1, 'ANUA SUPER MAX1',       0),
('jtingane@gmail.com',              1, 'DonodaBolaF1',          0)
ON CONFLICT (member_email, gp_id) DO UPDATE SET
  pontos_acum = EXCLUDED.pontos_acum;

-- 10. SCORES_PREDICT R02 — 16 membros existentes
-- pontos_acum = R01 + R02 (acumulado a correr)
-- =========================================

INSERT INTO scores_predict (member_email, gp_id, nick_predict, pontos_acum) VALUES
('haris.naunitlal@gmail.com',       2, 'PCA Team',            225),
('miguel.nhaia@gmail.com',          2, 'Isolino Nhaia',       247),
('rishilsubash@gmail.com',          2, 'Rix_23',              196),
('lino.carlos76@gmail.com',         2, 'Cape_AMG Mercedes',   154),
('ravi.prehlad@gmail.com',          2, 'RAVI_HP',             137),
('amarildomomola@gmail.com',        2, 'Mr Momola - F1',      147),
('amamudo@gmail.com',               2, 'VirgoF1',             179),
('mauro.demelo2014@gmail.com',      2, 'MauroMV1',            117),
('anuargoncalves@gmail.com',        2, 'ANUA SUPER MAX1',      66),
('marco.antunes@live.com',          2, 'Maranello Kings',     149),
('ericson.kun@gmail.com',           2, 'Alpist44',            126),
('sacur.luismiguel78@gmail.com',    2, 'Luís Miguel Sacur',    79),
('nkajaria02@gmail.com',            2, 'nileshmz',            123),
('consorridente@gmail.com',         2, 'António Pinho',        66),
('alexandreferreira0208@gmail.com', 2, 'Alexandre28',          30),
('jtingane@gmail.com',              2, 'DonodaBolaF1',         67)
ON CONFLICT (member_email, gp_id) DO UPDATE SET
  pontos_acum = EXCLUDED.pontos_acum;

-- 11. SCORES_PREDICT R03 — 16 membros existentes
-- pontos_acum = Overall (R01+R02+R03) — confirmado contra site
-- =========================================

INSERT INTO scores_predict (member_email, gp_id, nick_predict, pontos_acum) VALUES
('haris.naunitlal@gmail.com',       3, 'PCA Team',            352),
('miguel.nhaia@gmail.com',          3, 'Isolino Nhaia',       321),
('rishilsubash@gmail.com',          3, 'Rix_23',              291),
('lino.carlos76@gmail.com',         3, 'Cape_AMG Mercedes',   262),
('ravi.prehlad@gmail.com',          3, 'RAVI_HP',             254),
('amarildomomola@gmail.com',        3, 'Mr Momola - F1',      239),
('amamudo@gmail.com',               3, 'VirgoF1',             230),
('mauro.demelo2014@gmail.com',      3, 'MauroMV1',            211),
('anuargoncalves@gmail.com',        3, 'ANUA SUPER MAX1',     194),
('marco.antunes@live.com',          3, 'Maranello Kings',     191),
('ericson.kun@gmail.com',           3, 'Alpist44',            182),
('sacur.luismiguel78@gmail.com',    3, 'Luís Miguel Sacur',   164),
('nkajaria02@gmail.com',            3, 'nileshmz',            123),
('consorridente@gmail.com',         3, 'António Pinho',       110),
('alexandreferreira0208@gmail.com', 3, 'Alexandre28',         107),
('jtingane@gmail.com',              3, 'DonodaBolaF1',         67)
ON CONFLICT (member_email, gp_id) DO UPDATE SET
  pontos_acum = EXCLUDED.pontos_acum;

-- 12. SCORES_PREDICT — 4 novos membros (R01/R02/R03)
-- pontos_acum = acumulado a correr por GP
-- Pedro (pedrowjorge@gmail.com) = 0 em todos os GPs, sem linhas
-- =========================================

INSERT INTO scores_predict (member_email, gp_id, nick_predict, pontos_acum) VALUES
-- Remane: 103 | 114 | 115 → acum: 103 | 217 | 332
('derciopita1990@gmail.com',   1, 'DPita - The Champion', 103),
('derciopita1990@gmail.com',   2, 'DPita - The Champion', 217),
('derciopita1990@gmail.com',   3, 'DPita - The Champion', 332),
-- Nelo: 84 | 46 | 84 → acum: 84 | 130 | 214
('abilioantunes789@gmail.com', 1, 'Nello 44',             84),
('abilioantunes789@gmail.com', 2, 'Nello 44',             130),
('abilioantunes789@gmail.com', 3, 'Nello 44',             214),
-- Henrique: 43 | 57 | 0 → acum: 43 | 100 | 100
('hcoelho.tco@gmail.com',      1, 'H[R]C Racing',          43),
('hcoelho.tco@gmail.com',      2, 'H[R]C Racing',         100),
('hcoelho.tco@gmail.com',      3, 'H[R]C Racing',         100),
-- Zuneid: 0 | 61 | 0 → acum: 0 | 61 | 61
('bzzz.bummm@gmail.com',       1, 'Zunas_1',                0),
('bzzz.bummm@gmail.com',       2, 'Zunas_1',               61),
('bzzz.bummm@gmail.com',       3, 'Zunas_1',               61)
ON CONFLICT (member_email, gp_id) DO UPDATE SET
  pontos_acum = EXCLUDED.pontos_acum;

-- 13. GLOBAL RANKING — R01/R02/R03
-- Após correr este patch, correr recalculate_ranking.sql com target_gp = 3
-- =========================================
-- Ver: supabase/recalculate_ranking.sql
