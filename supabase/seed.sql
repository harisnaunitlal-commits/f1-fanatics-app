-- =========================================
-- SEED DATA — CALENDÁRIO 2026 + MEMBROS + SCORES R01-R03
-- Executar APÓS o schema.sql
-- =========================================

-- CALENDÁRIO 2026 (22 GPs — Bahrain e Saudi Arabia cancelados)
INSERT INTO gp_calendar (temporada, round, nome, circuito, pais, emoji_bandeira, data_corrida, deadline_play, deadline_predict, status) VALUES
(2026, 1,  'Austrália',      'Albert Park Circuit',          'Austrália',      '🇦🇺', '2026-03-08 05:00:00+00', '2026-03-08 04:59:59+00', '2026-03-07 15:00:00+00', 'scored'),
(2026, 2,  'China',          'Shanghai International Circuit','China',          '🇨🇳', '2026-03-15 07:00:00+00', '2026-03-15 06:59:59+00', '2026-03-14 09:00:00+00', 'scored'),
(2026, 3,  'Japão',          'Suzuka Circuit',               'Japão',          '🇯🇵', '2026-03-29 05:00:00+00', '2026-03-29 04:59:59+00', '2026-03-28 06:00:00+00', 'scored'),
(2026, 4,  'Miami',          'Miami International Autodrome', 'EUA',            '🇺🇸', '2026-05-01 19:00:00+00', '2026-05-01 18:59:59+00', '2026-04-30 19:00:00+00', 'upcoming'),
(2026, 5,  'Canadá',         'Circuit Gilles Villeneuve',    'Canadá',         '🇨🇦', '2026-05-24 18:00:00+00', '2026-05-24 17:59:59+00', '2026-05-23 18:00:00+00', 'upcoming'),
(2026, 6,  'Mónaco',         'Circuit de Monaco',            'Mónaco',         '🇲🇨', '2026-06-07 13:00:00+00', '2026-06-07 12:59:59+00', '2026-06-06 12:00:00+00', 'upcoming'),
(2026, 7,  'Espanha',        'Circuit de Barcelona-Catalunya','Espanha',        '🇪🇸', '2026-06-14 13:00:00+00', '2026-06-14 12:59:59+00', '2026-06-13 12:00:00+00', 'upcoming'),
(2026, 8,  'Áustria',        'Red Bull Ring',                'Áustria',        '🇦🇹', '2026-06-28 13:00:00+00', '2026-06-28 12:59:59+00', '2026-06-27 12:00:00+00', 'upcoming'),
(2026, 9,  'Grã-Bretanha',   'Silverstone Circuit',          'Reino Unido',    '🇬🇧', '2026-07-05 14:00:00+00', '2026-07-05 13:59:59+00', '2026-07-04 13:00:00+00', 'upcoming'),
(2026, 10, 'Bélgica',        'Circuit de Spa-Francorchamps', 'Bélgica',        '🇧🇪', '2026-07-26 13:00:00+00', '2026-07-26 12:59:59+00', '2026-07-25 12:00:00+00', 'upcoming'),
(2026, 11, 'Hungria',        'Hungaroring',                  'Hungria',        '🇭🇺', '2026-08-02 13:00:00+00', '2026-08-02 12:59:59+00', '2026-08-01 12:00:00+00', 'upcoming'),
(2026, 12, 'Países Baixos',  'Circuit Zandvoort',            'Países Baixos',  '🇳🇱', '2026-08-30 13:00:00+00', '2026-08-30 12:59:59+00', '2026-08-29 12:00:00+00', 'upcoming'),
(2026, 13, 'Itália',         'Autodromo Nazionale Monza',    'Itália',         '🇮🇹', '2026-09-06 13:00:00+00', '2026-09-06 12:59:59+00', '2026-09-05 12:00:00+00', 'upcoming'),
(2026, 14, 'Azerbaijão',     'Baku City Circuit',            'Azerbaijão',     '🇦🇿', '2026-09-20 11:00:00+00', '2026-09-20 10:59:59+00', '2026-09-19 10:00:00+00', 'upcoming'),
(2026, 15, 'Singapura',      'Marina Bay Street Circuit',    'Singapura',      '🇸🇬', '2026-10-04 12:00:00+00', '2026-10-04 11:59:59+00', '2026-10-03 11:00:00+00', 'upcoming'),
(2026, 16, 'EUA',            'Circuit of the Americas',      'EUA',            '🇺🇸', '2026-10-18 19:00:00+00', '2026-10-18 18:59:59+00', '2026-10-17 18:00:00+00', 'upcoming'),
(2026, 17, 'México',         'Autodromo Hermanos Rodriguez',  'México',         '🇲🇽', '2026-10-25 20:00:00+00', '2026-10-25 19:59:59+00', '2026-10-24 19:00:00+00', 'upcoming'),
(2026, 18, 'Brasil',         'Autodromo Jose Carlos Pace',   'Brasil',         '🇧🇷', '2026-11-08 17:00:00+00', '2026-11-08 16:59:59+00', '2026-11-07 16:00:00+00', 'upcoming'),
(2026, 19, 'Las Vegas',      'Las Vegas Strip Circuit',      'EUA',            '🇺🇸', '2026-11-21 06:00:00+00', '2026-11-21 05:59:59+00', '2026-11-20 05:00:00+00', 'upcoming'),
(2026, 20, 'Qatar',          'Lusail International Circuit', 'Qatar',          '🇶🇦', '2026-11-29 13:00:00+00', '2026-11-29 12:59:59+00', '2026-11-28 12:00:00+00', 'upcoming'),
(2026, 21, 'Abu Dhabi',      'Yas Marina Circuit',           'Emirados Árabes','🇦🇪', '2026-12-06 13:00:00+00', '2026-12-06 12:59:59+00', '2026-12-05 12:00:00+00', 'upcoming');

-- MEMBROS (27 membros F1 Play + membros só Fantasy/Predict)
INSERT INTO members (email, nome_completo, nickname, fantasy_nick, predict_nick, pais, is_admin, activo) VALUES
('haris.naunitlal@gmail.com',       'Harishkumar Naunitlal', 'Haris',        'PCA Team',             'PCA Team',            'Moçambique', true,  true),
('amamudo@gmail.com',               'Amade Mamudo',          'Amade',        'Virgo F1',             'VirgoF1',             'Moçambique', false, true),
('miguel.nhaia@gmail.com',          'Isolino Nhaia',         'Isolino',      'IsoF1 Team',           'Isolino Nhaia',       'Moçambique', false, true),
('marco.antunes@live.com',          'Marco Antunes',         'Marco',        'Maranello Kings',      'Maranello Kings',     'Moçambique', false, true),
('amarildomomola@gmail.com',        'Amarildo Momola',       'Amarildo',     'RtF1Team1',            'Mr Momola - F1',      'Moçambique', false, true),
('nkajaria02@gmail.com',            'Nilesh Dilip',          'Nilesh',       'nileshmz',             'nileshmz',            'Moçambique', false, true),
('anuargoncalves@gmail.com',        'Anuar Gonçalves',       'Anuar',        'ANUA super max 2026',  'ANUA SUPER MAX1',     'Moçambique', false, true),
('sacur.luismiguel78@gmail.com',    'Lloyd',                 'Lloyd',        'Lloyd 26',             'Luís Miguel Sacur',   'Moçambique', false, true),
('mauro.demelo2014@gmail.com',      'Mauro De Melo',         'Mauro',        NULL,                   'MauroMV1',            'Moçambique', false, true),
('tenorio.mbatsana@gmail.com',      'Tenório Mbatsana',      'Tenório',      NULL,                   NULL,                  'Moçambique', false, true),
('sauro.acub.alves@gmail.com',      'Sauro Alves',           'Sauro',        NULL,                   NULL,                  'Moçambique', false, true),
('smotichande@gmail.com',           'Sanjay Motichande',     'Sanjay',       NULL,                   NULL,                  'Moçambique', false, true),
('ravi.prehlad@gmail.com',          'Ravi Harish',           'Ravi',         'Vettel''s DRS',        'RAVI_HP',             'Moçambique', false, true),
('transalves020@gmail.com',         'Antonio Alves',         'AntAlves',     NULL,                   NULL,                  'Moçambique', false, true),
('jtingane@gmail.com',              'ZemaTingane',           'Zema',         'DonodaBolaF1',         'DonodaBolaF1',        'Moçambique', false, true),
('rishilsubash@gmail.com',          'Rishil Subash',         'Rishil',       NULL,                   'Rix_23',              'Moçambique', false, true),
('consorridente@gmail.com',         'Antonio Pinho',         'AntPinho',     NULL,                   'António Pinho',       'Moçambique', false, true),
('hamiltontitinho@gmail.com',       'Hamilton Oliveira',     'Hamilton',     NULL,                   NULL,                  'Moçambique', false, true),
('allencosta230@gmail.com',         'Allen Costa',           'Allen',        'ABx Racing',           NULL,                  'Moçambique', false, true),
('alexandreferreira0208@gmail.com', 'Alexandre Ferreira',    'Alexandre',    'AlexFer#1',            'Alexandre28',         'Moçambique', false, true),
('proencas10@gmail.com',            'Ayrton Proença',        'Ayrton',       NULL,                   NULL,                  'Moçambique', false, true),
('ericson.kun@gmail.com',           'Ericson Kun',           'Ericson',      'ALPIST44',             'Alpist44',            'Moçambique', false, true),
('ryanbulha12@gmail.com',           'Ryanbulha',             'Ryan',         NULL,                   NULL,                  'Moçambique', false, true),
('chimuzu@gmail.com',               'Antonio Chimuzu',       'AntChimuzu',   NULL,                   NULL,                  'Moçambique', false, true),
('lino.carlos76@gmail.com',         'Carlos Lino',           'Carlos',       'Cape_AMG Mercedes',    'Cape_AMG Mercedes',   'Moçambique', false, true),
('kingdercio@gmail.com',            'Dercio',                'Dercio',       NULL,                   NULL,                  'Moçambique', false, true),
('graciano.mahumane@gmail.com',     'Graciano Mahumane',     'Graciano',     NULL,                   NULL,                  'Moçambique', false, true);

-- SCORES F1 PLAY — R01 Austrália
INSERT INTO scores_play (member_email, gp_id, total, participou) VALUES
('amamudo@gmail.com',               1, 11, true),
('haris.naunitlal@gmail.com',       1, 10, true),
('miguel.nhaia@gmail.com',          1,  9, true),
('marco.antunes@live.com',          1,  9, true),
('amarildomomola@gmail.com',        1,  8, true),
('anuargoncalves@gmail.com',        1,  8, true),
('mauro.demelo2014@gmail.com',      1,  9, true),
('sauro.acub.alves@gmail.com',      1,  9, true),
('smotichande@gmail.com',           1,  6, true),
('ravi.prehlad@gmail.com',          1,  6, true),
('jtingane@gmail.com',              1,  5, true),
('sacur.luismiguel78@gmail.com',    1,  5, true),
('nkajaria02@gmail.com',            1,  5, true),
('tenorio.mbatsana@gmail.com',      1,  5, true),
('consorridente@gmail.com',         1, 12, true),
('hamiltontitinho@gmail.com',       1,  4, true),
('alexandreferreira0208@gmail.com', 1,  7, true),
('proencas10@gmail.com',            1,  3, true);

-- SCORES F1 PLAY — R02 China
INSERT INTO scores_play (member_email, gp_id, total, participou) VALUES
('haris.naunitlal@gmail.com',       2,  7, true),
('amamudo@gmail.com',               2,  7, true),
('amarildomomola@gmail.com',        2,  7, true),
('nkajaria02@gmail.com',            2, 12, true),
('anuargoncalves@gmail.com',        2,  6, true),
('sacur.luismiguel78@gmail.com',    2,  7, true),
('tenorio.mbatsana@gmail.com',      2, 12, true),
('sauro.acub.alves@gmail.com',      2,  8, true),
('smotichande@gmail.com',           2,  4, true),
('ravi.prehlad@gmail.com',          2,  9, true),
('miguel.nhaia@gmail.com',          2,  5, true),
('marco.antunes@live.com',          2,  5, true),
('hamiltontitinho@gmail.com',       2,  7, true),
('allencosta230@gmail.com',         2, 11, true),
('rishilsubash@gmail.com',          2,  7, true),
('ericson.kun@gmail.com',           2,  7, true),
('lino.carlos76@gmail.com',         2,  6, true),
('transalves020@gmail.com',         2,  6, true),
('proencas10@gmail.com',            2,  4, true);

-- SCORES F1 PLAY — R03 Japão
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
('graciano.mahumane@gmail.com',     3,  4, true);

-- SCORES F1 FANTASY — R01/R02/R03 (pontos acumulados)
-- Usando gp_id=1,2,3 e calculando pontos_gp por delta
INSERT INTO scores_fantasy (member_email, gp_id, equipa_nome, pontos_acum, pontos_gp) VALUES
('haris.naunitlal@gmail.com',       1, 'PCA Team',            225,  225),
('amamudo@gmail.com',               1, 'Virgo F1',            251,  251),
('marco.antunes@live.com',          1, 'Maranello Kings',     158,  158),
('anuargoncalves@gmail.com',        1, 'ANUA super max 2026', 163,  163),
('miguel.nhaia@gmail.com',          1, 'IsoF1 Team',          133,  133),
('allencosta230@gmail.com',         1, 'ABx Racing',          183,  183),
('lino.carlos76@gmail.com',         1, 'Cape_AMG Mercedes',   233,  233),
('amarildomomola@gmail.com',        1, 'RtF1Team1',           162,  162),
('alexandreferreira0208@gmail.com', 1, 'AlexFer#1',           209,  209),
('nkajaria02@gmail.com',            1, 'nileshmz',             75,   75),
('ravi.prehlad@gmail.com',          1, 'Vettel''s DRS',       196,  196),
('ericson.kun@gmail.com',           1, 'ALPIST44',            177,  177),
('jtingane@gmail.com',              1, 'DonodaBolaF1',        176,  176),
('sacur.luismiguel78@gmail.com',    1, 'Lloyd 26',             14,   14);

INSERT INTO scores_fantasy (member_email, gp_id, equipa_nome, pontos_acum, pontos_gp) VALUES
('haris.naunitlal@gmail.com',       2, 'PCA Team',            256,  31),
('amamudo@gmail.com',               2, 'Virgo F1',             88, -163),
('marco.antunes@live.com',          2, 'Maranello Kings',     179,   21),
('anuargoncalves@gmail.com',        2, 'ANUA super max 2026', 128,  -35),
('miguel.nhaia@gmail.com',          2, 'IsoF1 Team',          190,   57),
('allencosta230@gmail.com',         2, 'ABx Racing',          115,  -68),
('lino.carlos76@gmail.com',         2, 'Cape_AMG Mercedes',    64, -169),
('amarildomomola@gmail.com',        2, 'RtF1Team1',            83,  -79),
('alexandreferreira0208@gmail.com', 2, 'AlexFer#1',            63, -146),
('nkajaria02@gmail.com',            2, 'nileshmz',            156,   81),
('ravi.prehlad@gmail.com',          2, 'Vettel''s DRS',        -9, -205),
('ericson.kun@gmail.com',           2, 'ALPIST44',             61, -116),
('jtingane@gmail.com',              2, 'DonodaBolaF1',        -20, -196),
('sacur.luismiguel78@gmail.com',    2, 'Lloyd 26',             16,    2);

INSERT INTO scores_fantasy (member_email, gp_id, equipa_nome, pontos_acum, pontos_gp) VALUES
('haris.naunitlal@gmail.com',       3, 'PCA Team',            288,   32),
('amamudo@gmail.com',               3, 'Virgo F1',            142,   54),
('marco.antunes@live.com',          3, 'Maranello Kings',     141,  -38),
('anuargoncalves@gmail.com',        3, 'ANUA super max 2026', 182,   54),
('miguel.nhaia@gmail.com',          3, 'IsoF1 Team',          143,  -47),
('allencosta230@gmail.com',         3, 'ABx Racing',          167,   52),
('lino.carlos76@gmail.com',         3, 'Cape_AMG Mercedes',   146,   82),
('amarildomomola@gmail.com',        3, 'RtF1Team1',           162,   79),
('alexandreferreira0208@gmail.com', 3, 'AlexFer#1',           110,   47),
('nkajaria02@gmail.com',            3, 'nileshmz',            147,  -9),
('ravi.prehlad@gmail.com',          3, 'Vettel''s DRS',       178,  187),
('ericson.kun@gmail.com',           3, 'ALPIST44',             91,   30),
('jtingane@gmail.com',              3, 'DonodaBolaF1',         88,  108),
('sacur.luismiguel78@gmail.com',    3, 'Lloyd 26',            121,  105);

-- SCORES F1 PREDICT — valores ACUMULADOS reais do site
INSERT INTO scores_predict (member_email, gp_id, nick_predict, pontos_acum) VALUES
('anuargoncalves@gmail.com',        1, 'ANUA SUPER MAX1',      0),
('haris.naunitlal@gmail.com',       1, 'PCA Team',            89),
('ravi.prehlad@gmail.com',          1, 'RAVI_HP',             86),
('lino.carlos76@gmail.com',         1, 'Cape_AMG Mercedes',   45),
('rishilsubash@gmail.com',          1, 'Rix_23',              73),
('mauro.demelo2014@gmail.com',      1, 'MauroMV1',            56),
('amarildomomola@gmail.com',        1, 'Mr Momola - F1',      45),
('sacur.luismiguel78@gmail.com',    1, 'Luís Miguel Sacur',   24),
('alexandreferreira0208@gmail.com', 1, 'Alexandre28',         30),
('miguel.nhaia@gmail.com',          1, 'Isolino Nhaia',       93),
('ericson.kun@gmail.com',           1, 'Alpist44',            42),
('amamudo@gmail.com',               1, 'VirgoF1',             40),
('consorridente@gmail.com',         1, 'António Pinho',       66),
('marco.antunes@live.com',          1, 'Maranello Kings',     49),
('nkajaria02@gmail.com',            1, 'nileshmz',            56),
('jtingane@gmail.com',              1, 'DonodaBolaF1',         0);

INSERT INTO scores_predict (member_email, gp_id, nick_predict, pontos_acum) VALUES
('anuargoncalves@gmail.com',        2, 'ANUA SUPER MAX1',     66),
('haris.naunitlal@gmail.com',       2, 'PCA Team',           136),
('ravi.prehlad@gmail.com',          2, 'RAVI_HP',             51),
('lino.carlos76@gmail.com',         2, 'Cape_AMG Mercedes',  109),
('rishilsubash@gmail.com',          2, 'Rix_23',             123),
('mauro.demelo2014@gmail.com',      2, 'MauroMV1',            61),
('amarildomomola@gmail.com',        2, 'Mr Momola - F1',     102),
('sacur.luismiguel78@gmail.com',    2, 'Luís Miguel Sacur',   55),
('alexandreferreira0208@gmail.com', 2, 'Alexandre28',          0),
('miguel.nhaia@gmail.com',          2, 'Isolino Nhaia',      154),
('ericson.kun@gmail.com',           2, 'Alpist44',            84),
('amamudo@gmail.com',               2, 'VirgoF1',            139),
('consorridente@gmail.com',         2, 'António Pinho',        0),
('marco.antunes@live.com',          2, 'Maranello Kings',    100),
('nkajaria02@gmail.com',            2, 'nileshmz',            67),
('jtingane@gmail.com',              2, 'DonodaBolaF1',        67);

INSERT INTO scores_predict (member_email, gp_id, nick_predict, pontos_acum) VALUES
('anuargoncalves@gmail.com',        3, 'ANUA SUPER MAX1',    128),
('haris.naunitlal@gmail.com',       3, 'PCA Team',           127),
('ravi.prehlad@gmail.com',          3, 'RAVI_HP',            117),
('lino.carlos76@gmail.com',         3, 'Cape_AMG Mercedes',  108),
('rishilsubash@gmail.com',          3, 'Rix_23',              95),
('mauro.demelo2014@gmail.com',      3, 'MauroMV1',            94),
('amarildomomola@gmail.com',        3, 'Mr Momola - F1',      92),
('sacur.luismiguel78@gmail.com',    3, 'Luís Miguel Sacur',   85),
('alexandreferreira0208@gmail.com', 3, 'Alexandre28',         77),
('miguel.nhaia@gmail.com',          3, 'Isolino Nhaia',       74),
('ericson.kun@gmail.com',           3, 'Alpist44',            56),
('amamudo@gmail.com',               3, 'VirgoF1',             51),
('consorridente@gmail.com',         3, 'António Pinho',       44),
('marco.antunes@live.com',          3, 'Maranello Kings',     42),
('nkajaria02@gmail.com',            3, 'nileshmz',             0),
('jtingane@gmail.com',              3, 'DonodaBolaF1',         0);

-- GLOBAL RANKING após R03 (snapshot validado)
-- Máximos: Play=27 | Fantasy=288 (acum JPN haris) | Predict=128
-- Nota: fantasy_max usa acumulado real do último GP, predict_max=128
INSERT INTO global_ranking (member_email, gp_id, play_pts, fantasy_pts, predict_pts, play_max, fantasy_max, predict_max, play_gpts, fantasy_gpts, predict_gpts, global_score, n_ligas) VALUES
('haris.naunitlal@gmail.com',       3, 25, 288, 127, 27, 288, 128,  92.6, 100.0,  99.2, 97.3, 3),
('anuargoncalves@gmail.com',        3, 21, 182, 128, 27, 288, 128,  77.8,  63.2, 100.0, 80.3, 3),
('miguel.nhaia@gmail.com',          3, 23, 143,  74, 27, 288, 128,  85.2,  49.7,  57.8, 64.2, 3),
('amarildomomola@gmail.com',        3, 21, 162,  92, 27, 288, 128,  77.8,  56.3,  71.9, 68.6, 3),
('amamudo@gmail.com',               3, 27, 142,  51, 27, 288, 128, 100.0,  49.3,  39.8, 63.0, 3),
('ravi.prehlad@gmail.com',          3, 15, 178, 117, 27, 288, 128,  55.6,  61.8,  91.4, 69.6, 3),
('marco.antunes@live.com',          3, 22, 141,  42, 27, 288, 128,  81.5,  49.0,  32.8, 54.4, 3),
('lino.carlos76@gmail.com',         3,  6, 146, 108, 27, 288, 128,  22.2,  50.7,  84.4, 52.4, 3),
('sacur.luismiguel78@gmail.com',    3, 18, 121,  85, 27, 288, 128,  66.7,  42.0,  66.4, 58.4, 3),
('mauro.demelo2014@gmail.com',      3, 18,   0,  94, 27, 288, 128,  66.7,   0.0,  73.4, 46.7, 2),
('allencosta230@gmail.com',         3, 11, 167,   0, 27, 288, 128,  40.7,  58.0,   0.0, 32.9, 2),
('rishilsubash@gmail.com',          3, 13,   0,  95, 27, 288, 128,  48.1,   0.0,  74.2, 40.8, 2),
('alexandreferreira0208@gmail.com', 3,  7, 110,  77, 27, 288, 128,  25.9,  38.2,  60.2, 41.4, 3),
('nkajaria02@gmail.com',            3, 21, 147,   0, 27, 288, 128,  77.8,  51.0,   0.0, 42.9, 2),
('ericson.kun@gmail.com',           3,  7,  91,  56, 27, 288, 128,  25.9,  31.6,  43.8, 33.8, 3),
('jtingane@gmail.com',              3, 14,  88,   0, 27, 288, 128,  51.9,  30.6,   0.0, 27.5, 2),
('tenorio.mbatsana@gmail.com',      3, 17,   0,   0, 27, 288, 128,  63.0,   0.0,   0.0, 21.0, 1),
('sauro.acub.alves@gmail.com',      3, 17,   0,   0, 27, 288, 128,  63.0,   0.0,   0.0, 21.0, 1),
('hamiltontitinho@gmail.com',       3, 11,   0,   0, 27, 288, 128,  40.7,   0.0,   0.0, 13.6, 1),
('consorridente@gmail.com',         3, 12,   0,  44, 27, 288, 128,  44.4,   0.0,  34.4, 26.3, 2),
('smotichande@gmail.com',           3, 16,   0,   0, 27, 288, 128,  59.3,   0.0,   0.0, 19.8, 1),
('transalves020@gmail.com',         3, 15,   0,   0, 27, 288, 128,  55.6,   0.0,   0.0, 18.5, 1),
('proencas10@gmail.com',            3,  7,   0,   0, 27, 288, 128,  25.9,   0.0,   0.0,  8.6, 1),
('ryanbulha12@gmail.com',           3,  7,   0,   0, 27, 288, 128,  25.9,   0.0,   0.0,  8.6, 1),
('chimuzu@gmail.com',               3,  7,   0,   0, 27, 288, 128,  25.9,   0.0,   0.0,  8.6, 1),
('kingdercio@gmail.com',            3,  6,   0,   0, 27, 288, 128,  22.2,   0.0,   0.0,  7.4, 1),
('graciano.mahumane@gmail.com',     3,  4,   0,   0, 27, 288, 128,  14.8,   0.0,   0.0,  4.9, 1);
