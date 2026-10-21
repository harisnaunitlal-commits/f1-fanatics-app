// Types and constants shared by the telemetry API routes and the UI (no server-only imports).

export const PANEL_KEYS = ['tower', 'strategy', 'control', 'ours', 'map', 'compare', 'positions', 'laps', 'championship'] as const
export type PanelKey = typeof PANEL_KEYS[number]
export type Panels = Partial<Record<PanelKey, boolean>>
export const panelOn = (p: Panels | null | undefined, k: PanelKey): boolean => p?.[k] !== false

export interface Scene {
  id: number
  session_key: number | null
  gp_id: number | null
  mode: 'replay' | 'live'
  replay_anchor_session: string | null
  replay_anchor_real: string | null
  replay_speed: number
  replay_playing: boolean
  total_laps: number | null
  panels: Panels
  compare_mode: 'best' | 'last'
  featured: string[]
  banner: string | null
  members_enabled: boolean
  updated_at: string
}

export const QUANTUM_MS = 5000

// Instant of the session that everyone is looking at. Replay is driven by an anchor stored in the
// scene, so it keeps running without any admin tab open and all members see the same moment.
export function sceneTime(scene: Pick<Scene, 'mode' | 'replay_anchor_session' | 'replay_anchor_real' | 'replay_speed' | 'replay_playing'>, nowMs: number, sessionEndMs?: number): number {
  if (scene.mode === 'live') return nowMs
  const base = scene.replay_anchor_session ? Date.parse(scene.replay_anchor_session) : nowMs
  let t = base
  if (scene.replay_playing && scene.replay_anchor_real) t = base + (nowMs - Date.parse(scene.replay_anchor_real)) * Number(scene.replay_speed || 1)
  return sessionEndMs ? Math.min(t, sessionEndMs) : t
}

// Every answer of the F1 Play form, with its label and the scoring column it maps to.
export const PLAY_FIELDS: { field: string; pts: string; label: string; weight: number }[] = [
  { field: 'p1_primeiro', pts: 'pts_p1a', label: '1º lugar', weight: 1 },
  { field: 'p1_segundo', pts: 'pts_p1b', label: '2º lugar', weight: 1 },
  { field: 'p1_terceiro', pts: 'pts_p1c', label: '3º lugar', weight: 1 },
  { field: 'p2_equipa', pts: 'pts_p2', label: 'Equipa (P2)', weight: 1 },
  { field: 'p3_lap', pts: 'pts_p3', label: 'Pilotos dobrados', weight: 1 },
  { field: 'p4_quarto', pts: 'pts_p4a', label: '4º lugar', weight: 1 },
  { field: 'p4_quinto', pts: 'pts_p4b', label: '5º lugar', weight: 1 },
  { field: 'p4_sexto', pts: 'pts_p4c', label: '6º lugar', weight: 1 },
  { field: 'p5_duelo', pts: 'pts_p5', label: 'Duelo 1', weight: 1 },
  { field: 'p6_duelo', pts: 'pts_p6', label: 'Duelo 2', weight: 1 },
  { field: 'p7_duelo', pts: 'pts_p7', label: 'Duelo 3', weight: 1 },
  { field: 'p8_margem', pts: 'pts_p8', label: 'Margem de vitória', weight: 1 },
  { field: 'p9_retire', pts: 'pts_p9', label: '1º a desistir', weight: 3 },
  { field: 'p10_dotd', pts: 'pts_p10', label: 'Piloto do Dia', weight: 2 },
  { field: 'p11_fl', pts: 'pts_p11', label: 'Volta mais rápida', weight: 1 },
  { field: 'p12_classif', pts: 'pts_p12', label: 'Classificados', weight: 1 },
  { field: 'p13_especial', pts: 'pts_p13', label: 'Pergunta especial', weight: 1 },
  { field: 'p14_sc', pts: 'pts_p14', label: 'Safety Car', weight: 3 },
  { field: 'p15_outsider', pts: 'pts_p15', label: 'Outsider', weight: 1 },
]

export interface PlayLine { field: string; label: string; weight: number; mine: string | null; live: string | null; pts: number }
export interface LeaderRow { nickname: string; foto_url: string | null; total: number; rank: number; isMe: boolean }

// Flag emoji (🇦🇺) or ISO code (AU) → local flag image (emoji flags render as letters on Windows).
export function flagSrc(code: string | null | undefined): string | null {
  if (!code) return null
  const iso = Array.from(code).map(c => {
    const cp = c.codePointAt(0) ?? 0
    return cp >= 127462 && cp <= 127487 ? String.fromCharCode(cp - 127397) : c.toUpperCase()
  }).join('')
  return /^[A-Z]{2}$/.test(iso) ? `/flags/${iso}.png` : null
}

export interface StateResponse {
  ready: boolean
  disabled?: boolean
  message?: string
  isAdmin?: boolean
  scene?: Pick<Scene, 'mode' | 'banner' | 'featured' | 'panels' | 'members_enabled' | 'total_laps' | 'replay_playing' | 'replay_speed' | 'compare_mode'>
  session?: { name: string; country: string; date_start: string; date_end: string }
  gp?: { nome: string; emoji: string | null; round: number } | null
  drivers?: { code: string; name: string; team: string; colour: string }[]
  state?: import('./engine').TelemetryState
  outline?: { x: number; y: number }[] | null
  compare?: import('./compare').CompareData | null
  favCode?: string | null
  play?: { closed: boolean; answers: Record<string, string | null>; leaderboard: LeaderRow[]; participants: number; me: { total: number; rank: number | null; lines: PlayLine[] } | null }
}
