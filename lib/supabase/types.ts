export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: Omit<Member, 'criado_em' | 'actualizado_em'>
        Update: Partial<Omit<Member, 'email'>>
      }
      gp_calendar: {
        Row: GpCalendar
        Insert: Omit<GpCalendar, 'id'>
        Update: Partial<GpCalendar>
      }
      predictions: {
        Row: Prediction
        Insert: Omit<Prediction, 'id' | 'submetido_em' | 'versao'> & {
          editado_em?: string
        }
        Update: Partial<Prediction>
      }
      gp_answers: {
        Row: GpAnswers
        Insert: GpAnswers
        Update: Partial<GpAnswers>
      }
      scores_play: {
        Row: ScorePlay
        Insert: ScorePlay
        Update: Partial<ScorePlay>
      }
      scores_fantasy: {
        Row: ScoreFantasy
        Insert: ScoreFantasy
        Update: Partial<ScoreFantasy>
      }
      scores_predict: {
        Row: ScorePredict
        Insert: ScorePredict
        Update: Partial<ScorePredict>
      }
      global_ranking: {
        Row: GlobalRanking
        Insert: GlobalRanking
        Update: Partial<GlobalRanking>
      }
      season_stats: {
        Row: SeasonStats
        Insert: SeasonStats
        Update: Partial<SeasonStats>
      }
      audit_log: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'criado_em'>
        Update: Partial<AuditLog>
      }
    }
  }
}

export interface Member {
  email: string
  nome_completo: string
  nickname: string
  foto_url: string | null
  whatsapp: string | null
  piloto_fav: string | null
  equipa_fav: string | null
  fantasy_nick: string | null
  predict_nick: string | null
  data_nasc: string | null
  sexo: 'M' | 'F' | 'outro' | 'prefiro_nao_dizer' | null
  cidade: string | null
  pais: string
  empresa: string | null
  area_profissional: string | null
  bio: string | null
  visibilidade: 'publico' | 'membros' | 'privado'
  is_admin: boolean
  activo: boolean
  criado_em: string
  actualizado_em: string
}

export interface GpCalendar {
  id: number
  temporada: number
  round: number
  nome: string
  circuito: string
  pais: string
  emoji_bandeira: string | null
  data_corrida: string
  deadline_play: string
  deadline_predict: string | null
  status: 'upcoming' | 'active' | 'closed' | 'scored'
}

export interface Prediction {
  id: string
  member_email: string
  gp_id: number
  p1_primeiro: string | null
  p1_segundo: string | null
  p1_terceiro: string | null
  p2_equipa: string | null
  p3_lap: string | null
  p4_quarto: string | null
  p4_quinto: string | null
  p4_sexto: string | null
  p5_duelo: string | null
  p6_duelo: string | null
  p7_duelo: string | null
  p8_margem: string | null
  p9_retire: string | null
  p10_dotd: string | null
  p11_fl: string | null
  p12_classif: string | null
  p13_especial: string | null
  p14_sc: string | null
  p15_outsider: string | null
  submetido_em: string
  editado_em: string
  versao: number
}

export interface GpAnswers {
  gp_id: number
  p1_primeiro: string | null
  p1_segundo: string | null
  p1_terceiro: string | null
  p2_equipa: string | null
  p3_lap: string | null
  p4_quarto: string | null
  p4_quinto: string | null
  p4_sexto: string | null
  p5_duelo: string | null
  p6_duelo: string | null
  p7_duelo: string | null
  p8_margem: string | null
  p9_retire: string | null
  p10_dotd: string | null
  p11_fl: string | null
  p12_classif: string | null
  p13_especial: string | null
  p14_sc: string | null
  p15_outsider: string | null
  perguntas_anuladas: string[] | null
  inserido_por: string | null
  inserido_em: string
}

export interface ScorePlay {
  member_email: string
  gp_id: number
  pts_p1a: number
  pts_p1b: number
  pts_p1c: number
  pts_p2: number
  pts_p3: number
  pts_p4a: number
  pts_p4b: number
  pts_p4c: number
  pts_p5: number
  pts_p6: number
  pts_p7: number
  pts_p8: number
  pts_p9: number
  pts_p10: number
  pts_p11: number
  pts_p12: number
  pts_p13: number
  pts_p14: number
  pts_p15: number
  total: number
  participou: boolean
  calculado_em: string
}

export interface ScoreFantasy {
  member_email: string
  gp_id: number
  equipa_nome: string
  pontos_acum: number
  pontos_gp: number | null
  importado_em: string
}

export interface ScorePredict {
  member_email: string
  gp_id: number
  nick_predict: string
  pontos_acum: number
  accuracy_pct: number | null
  importado_em: string
}

export interface GlobalRanking {
  member_email: string
  gp_id: number
  play_pts: number
  fantasy_pts: number
  predict_pts: number
  play_gpts: number | null
  fantasy_gpts: number | null
  predict_gpts: number | null
  global_score: number | null
  n_ligas: number | null
  calculado_em: string
}

export interface SeasonStats {
  gp_id: number
  play_max: number
  fantasy_max: number
  predict_max: number
  n_members_play: number | null
  n_members_fantasy: number | null
  n_members_predict: number | null
  calculado_em: string
}

export interface AuditLog {
  id: string
  admin_email: string
  accao: string
  tabela: string | null
  detalhe: Json | null
  criado_em: string
}

// Pilotos 2026
export const PILOTOS_2026 = [
  { codigo: 'VER', nome: 'Max Verstappen', equipa: 'Red Bull Racing' },
  { codigo: 'NOR', nome: 'Lando Norris', equipa: 'McLaren' },
  { codigo: 'LEC', nome: 'Charles Leclerc', equipa: 'Ferrari' },
  { codigo: 'HAM', nome: 'Lewis Hamilton', equipa: 'Ferrari' },
  { codigo: 'SAI', nome: 'Carlos Sainz', equipa: 'Williams' },
  { codigo: 'PIA', nome: 'Oscar Piastri', equipa: 'McLaren' },
  { codigo: 'RUS', nome: 'George Russell', equipa: 'Mercedes' },
  { codigo: 'ANT', nome: 'Kimi Antonelli', equipa: 'Mercedes' },
  { codigo: 'ALO', nome: 'Fernando Alonso', equipa: 'Aston Martin' },
  { codigo: 'STR', nome: 'Lance Stroll', equipa: 'Aston Martin' },
  { codigo: 'TSU', nome: 'Yuki Tsunoda', equipa: 'Red Bull Racing' },
  { codigo: 'LAW', nome: 'Liam Lawson', equipa: 'RB' },
  { codigo: 'HUL', nome: 'Nico Hülkenberg', equipa: 'Sauber' },
  { codigo: 'BOR', nome: 'Gabriel Bortoleto', equipa: 'Sauber' },
  { codigo: 'OCO', nome: 'Esteban Ocon', equipa: 'Haas' },
  { codigo: 'BEA', nome: 'Oliver Bearman', equipa: 'Haas' },
  { codigo: 'GAS', nome: 'Pierre Gasly', equipa: 'Alpine' },
  { codigo: 'DOO', nome: 'Jack Doohan', equipa: 'Alpine' },
  { codigo: 'ALB', nome: 'Alexander Albon', equipa: 'Williams' },
  { codigo: 'COL', nome: 'Franco Colapinto', equipa: 'Alpine' },
] as const

export const EQUIPAS_2026 = [
  'Red Bull Racing', 'McLaren', 'Ferrari', 'Mercedes',
  'Aston Martin', 'Alpine', 'Williams', 'RB', 'Haas', 'Sauber',
] as const

export const MARGENS_VITORIA = [
  "0-2s","2-3.5s","3.5-5s","5-6.5s","6.5-8s",
  "8-10s","10-12s","12-15s","15-22s","+22s"
] as const

export const OPCOES_CLASSIF = [
  "22","21","20","19","18","17","16","15","14","13 ou menos"
] as const