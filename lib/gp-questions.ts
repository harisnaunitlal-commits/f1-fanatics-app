export interface DuelConfig {
  driverA: string
  nameA: string
  teamA: string
  colorA: string
  driverB: string
  nameB: string
  teamB: string
  colorB: string
}

export interface DriverOption {
  codigo: string
  nome: string
  equipa: string
  color: string
}

export interface GpQuestions {
  gpName: string          // e.g. "Austrália", "China", "Japão"
  gpPrep: string          // preposition: "da" | "do" | "de"
  p2Label: string
  p3Options: readonly string[]
  p5: DuelConfig
  p6: DuelConfig
  p7: DuelConfig
  p13Label: string
  p13Options: DriverOption[]
  p15Label: string
  p15Options: DriverOption[]
}

export const P8_MARGENS = [
  "0-2s","2-3.5s","3.5-5s","5-6.5s","6.5-8s",
  "8-10s","10-12s","12-15s","15-22s","+22s"
] as const

export const P3_OPTIONS = ["Nenhum","1","2","3","4","5","Mais de 5"] as const

export const P12_OPTIONS = ["22","21","20","19","18","17","16","15","14","13 ou menos"] as const

export const TEAM_COLORS: Record<string, string> = {
  'Red Bull Racing': '#3671C6',
  'McLaren':         '#FF8000',
  'Ferrari':         '#E8002D',
  'Mercedes':        '#27F4D2',
  'Aston Martin':    '#229971',
  'Alpine':          '#FF87BC',
  'Williams':        '#64C4FF',
  'RB':              '#6692FF',
  'Racing Bulls':    '#6692FF',
  'Haas':            '#B6BABD',
  'Audi':            '#52E252',
  'Cadillac':        '#CC1230',
}

// Local pilot photos — files in /public/pilots/*.jpg
// Filenames match exactly what the user saved (case-sensitive on Linux/Vercel)
const PHOTO_FILES: Record<string, string> = {
  ALB: 'Albon',
  ALO: 'Alonso',
  ANT: 'Antonelli',
  BEA: 'Bearmen',
  BOR: 'Bortoleto',
  BOT: 'Bottas',
  COL: 'Colapinto',
  GAS: 'Gasley',
  HAD: 'Hadjar',
  HAM: 'Hamilton',
  HUL: 'Hulkenberg',
  LAW: 'Lawson',
  LEC: 'Lecrec',
  LIN: 'Lindblad',
  NOR: 'Norris',
  OCO: 'Ocon',
  PER: 'Perez',
  PIA: 'Piastri',
  RUS: 'Russel',
  SAI: 'Sainz',
  STR: 'Stroll',
  VER: 'Verstappen',
}

export function getDriverPhoto(codigo: string): string {
  const file = PHOTO_FILES[codigo]
  if (!file) return ''
  return `/Pilotos/${file}.jpeg`
}

const GP_QUESTIONS: Record<number, GpQuestions> = {
  1: { // R01 — Austrália
    gpName: 'Austrália',
    gpPrep: 'da',
    p2Label: "Qual será a SEGUNDA equipa, que vai pontuar mais no Grande Prémio da Austrália?",
    p3Options: P3_OPTIONS,
    p5: {
      driverA: 'HAD', nameA: 'Isack Hadjar',    teamA: 'Red Bull Racing', colorA: TEAM_COLORS['Red Bull Racing'],
      driverB: 'PIA', nameB: 'Oscar Piastri',   teamB: 'McLaren',         colorB: TEAM_COLORS['McLaren'],
    },
    p6: {
      driverA: 'RUS', nameA: 'George Russell',  teamA: 'Mercedes', colorA: TEAM_COLORS['Mercedes'],
      driverB: 'ANT', nameB: 'Kimi Antonelli',  teamB: 'Mercedes', colorB: TEAM_COLORS['Mercedes'],
    },
    p7: {
      driverA: 'HUL', nameA: 'Nico Hülkenberg', teamA: 'Audi', colorA: TEAM_COLORS['Audi'],
      driverB: 'BEA', nameB: 'Oliver Bearman',  teamB: 'Haas', colorB: TEAM_COLORS['Haas'],
    },
    p13Label: "Qual piloto terminará a corrida na posição mais alta?",
    p13Options: [
      { codigo: 'BEA', nome: 'Oliver Bearman',  equipa: 'Haas',         color: TEAM_COLORS['Haas'] },
      { codigo: 'LAW', nome: 'Liam Lawson',      equipa: 'Racing Bulls', color: TEAM_COLORS['Racing Bulls'] },
      { codigo: 'LIN', nome: 'Arvid Lindblad',  equipa: 'Racing Bulls', color: TEAM_COLORS['Racing Bulls'] },
      { codigo: 'OCO', nome: 'Esteban Ocon',    equipa: 'Haas',         color: TEAM_COLORS['Haas'] },
      { codigo: 'BOR', nome: 'Gabriel Bortoleto',equipa: 'Audi',        color: TEAM_COLORS['Audi'] },
    ],
    p15Label: "Qual piloto terminará a corrida na posição mais alta?",
    p15Options: [
      { codigo: 'ALO', nome: 'Fernando Alonso', equipa: 'Aston Martin', color: TEAM_COLORS['Aston Martin'] },
      { codigo: 'COL', nome: 'Franco Colapinto',equipa: 'Alpine',       color: TEAM_COLORS['Alpine'] },
      { codigo: 'ALB', nome: 'Alexander Albon', equipa: 'Williams',     color: TEAM_COLORS['Williams'] },
      { codigo: 'PER', nome: 'Sergio Perez',    equipa: 'Cadillac',     color: TEAM_COLORS['Cadillac'] },
      { codigo: 'BOT', nome: 'Valtteri Bottas', equipa: 'Cadillac',     color: TEAM_COLORS['Cadillac'] },
    ],
  },

  2: { // R02 — China
    gpName: 'China',
    gpPrep: 'da',
    p2Label: "Qual será a SEGUNDA equipa, que vai pontuar mais no Grande Prémio da China?",
    p3Options: P3_OPTIONS,
    p5: {
      driverA: 'NOR', nameA: 'Lando Norris',   teamA: 'McLaren', colorA: TEAM_COLORS['McLaren'],
      driverB: 'PIA', nameB: 'Oscar Piastri',  teamB: 'McLaren', colorB: TEAM_COLORS['McLaren'],
    },
    p6: {
      driverA: 'ANT', nameA: 'Kimi Antonelli', teamA: 'Mercedes', colorA: TEAM_COLORS['Mercedes'],
      driverB: 'RUS', nameB: 'George Russell', teamB: 'Mercedes', colorB: TEAM_COLORS['Mercedes'],
    },
    p7: {
      driverA: 'HAD', nameA: 'Isack Hadjar',    teamA: 'Red Bull Racing', colorA: TEAM_COLORS['Red Bull Racing'],
      driverB: 'HUL', nameB: 'Nico Hülkenberg', teamB: 'Audi',            colorB: TEAM_COLORS['Audi'],
    },
    p13Label: "Qual piloto terminará a corrida na posição mais alta?",
    p13Options: [
      { codigo: 'HUL', nome: 'Nico Hülkenberg', equipa: 'Audi',         color: TEAM_COLORS['Audi'] },
      { codigo: 'LAW', nome: 'Liam Lawson',      equipa: 'Racing Bulls', color: TEAM_COLORS['Racing Bulls'] },
      { codigo: 'GAS', nome: 'Pierre Gasly',     equipa: 'Alpine',       color: TEAM_COLORS['Alpine'] },
      { codigo: 'OCO', nome: 'Esteban Ocon',     equipa: 'Haas',         color: TEAM_COLORS['Haas'] },
      { codigo: 'BEA', nome: 'Oliver Bearman',   equipa: 'Haas',         color: TEAM_COLORS['Haas'] },
    ],
    p15Label: "Qual piloto terminará a corrida na posição mais alta?",
    p15Options: [
      { codigo: 'ALB', nome: 'Alexander Albon', equipa: 'Williams',     color: TEAM_COLORS['Williams'] },
      { codigo: 'ALO', nome: 'Fernando Alonso', equipa: 'Aston Martin', color: TEAM_COLORS['Aston Martin'] },
      { codigo: 'SAI', nome: 'Carlos Sainz',    equipa: 'Williams',     color: TEAM_COLORS['Williams'] },
      { codigo: 'COL', nome: 'Franco Colapinto',equipa: 'Alpine',       color: TEAM_COLORS['Alpine'] },
      { codigo: 'PER', nome: 'Sergio Perez',    equipa: 'Cadillac',     color: TEAM_COLORS['Cadillac'] },
    ],
  },

  3: { // R03 — Japão
    gpName: 'Japão',
    gpPrep: 'do',
    p2Label: "Qual será a TERCEIRA equipa, que vai pontuar mais no Grande Prémio do Japão?",
    p3Options: P3_OPTIONS,
    p5: {
      driverA: 'HAM', nameA: 'Lewis Hamilton', teamA: 'Ferrari', colorA: TEAM_COLORS['Ferrari'],
      driverB: 'LEC', nameB: 'Charles Leclerc',teamB: 'Ferrari', colorB: TEAM_COLORS['Ferrari'],
    },
    p6: {
      driverA: 'ANT', nameA: 'Kimi Antonelli', teamA: 'Mercedes', colorA: TEAM_COLORS['Mercedes'],
      driverB: 'RUS', nameB: 'George Russell', teamB: 'Mercedes', colorB: TEAM_COLORS['Mercedes'],
    },
    p7: {
      driverA: 'BEA', nameA: 'Oliver Bearman', teamA: 'Haas',            colorA: TEAM_COLORS['Haas'],
      driverB: 'HAD', nameB: 'Isack Hadjar',   teamB: 'Red Bull Racing', colorB: TEAM_COLORS['Red Bull Racing'],
    },
    p13Label: "Qual piloto terminará a corrida na posição mais alta?",
    p13Options: [
      { codigo: 'LAW', nome: 'Liam Lawson',    equipa: 'Racing Bulls',   color: TEAM_COLORS['Racing Bulls'] },
      { codigo: 'HAD', nome: 'Isack Hadjar',   equipa: 'Red Bull Racing',color: TEAM_COLORS['Red Bull Racing'] },
      { codigo: 'OCO', nome: 'Esteban Ocon',   equipa: 'Haas',           color: TEAM_COLORS['Haas'] },
      { codigo: 'BEA', nome: 'Oliver Bearman', equipa: 'Haas',           color: TEAM_COLORS['Haas'] },
      { codigo: 'GAS', nome: 'Pierre Gasly',   equipa: 'Alpine',         color: TEAM_COLORS['Alpine'] },
    ],
    p15Label: "Qual piloto terminará a corrida na posição mais alta?",
    p15Options: [
      { codigo: 'ALO', nome: 'Fernando Alonso', equipa: 'Aston Martin', color: TEAM_COLORS['Aston Martin'] },
      { codigo: 'ALB', nome: 'Alexander Albon', equipa: 'Williams',     color: TEAM_COLORS['Williams'] },
      { codigo: 'BOR', nome: 'Gabriel Bortoleto',equipa: 'Audi',        color: TEAM_COLORS['Audi'] },
      { codigo: 'PER', nome: 'Sergio Perez',    equipa: 'Cadillac',     color: TEAM_COLORS['Cadillac'] },
      { codigo: 'COL', nome: 'Franco Colapinto',equipa: 'Alpine',       color: TEAM_COLORS['Alpine'] },
    ],
  },

  4: { // R04 — Miami
    gpName: 'Miami',
    gpPrep: 'de',
    p2Label: "Qual será a TERCEIRA equipa, que vai pontuar mais no Grande Prémio de Miami?",
    p3Options: P3_OPTIONS,
    p5: {
      driverA: 'HAM', nameA: 'Lewis Hamilton', teamA: 'Ferrari', colorA: TEAM_COLORS['Ferrari'],
      driverB: 'LEC', nameB: 'Charles Leclerc',teamB: 'Ferrari', colorB: TEAM_COLORS['Ferrari'],
    },
    p6: {
      driverA: 'ANT', nameA: 'Kimi Antonelli', teamA: 'Mercedes', colorA: TEAM_COLORS['Mercedes'],
      driverB: 'RUS', nameB: 'George Russell', teamB: 'Mercedes', colorB: TEAM_COLORS['Mercedes'],
    },
    p7: {
      driverA: 'BEA', nameA: 'Oliver Bearman', teamA: 'Haas',            colorA: TEAM_COLORS['Haas'],
      driverB: 'HAD', nameB: 'Isack Hadjar',   teamB: 'Red Bull Racing', colorB: TEAM_COLORS['Red Bull Racing'],
    },
    p13Label: "Qual piloto terminará a corrida na posição mais alta?",
    p13Options: [
      { codigo: 'LAW', nome: 'Liam Lawson',    equipa: 'Racing Bulls',   color: TEAM_COLORS['Racing Bulls'] },
      { codigo: 'HAD', nome: 'Isack Hadjar',   equipa: 'Red Bull Racing',color: TEAM_COLORS['Red Bull Racing'] },
      { codigo: 'OCO', nome: 'Esteban Ocon',   equipa: 'Haas',           color: TEAM_COLORS['Haas'] },
      { codigo: 'BEA', nome: 'Oliver Bearman', equipa: 'Haas',           color: TEAM_COLORS['Haas'] },
      { codigo: 'GAS', nome: 'Pierre Gasly',   equipa: 'Alpine',         color: TEAM_COLORS['Alpine'] },
    ],
    p15Label: "Qual piloto terminará a corrida na posição mais alta?",
    p15Options: [
      { codigo: 'ALO', nome: 'Fernando Alonso', equipa: 'Aston Martin', color: TEAM_COLORS['Aston Martin'] },
      { codigo: 'ALB', nome: 'Alexander Albon', equipa: 'Williams',     color: TEAM_COLORS['Williams'] },
      { codigo: 'BOR', nome: 'Gabriel Bortoleto',equipa: 'Audi',        color: TEAM_COLORS['Audi'] },
      { codigo: 'PER', nome: 'Sergio Perez',    equipa: 'Cadillac',     color: TEAM_COLORS['Cadillac'] },
      { codigo: 'COL', nome: 'Franco Colapinto',equipa: 'Alpine',       color: TEAM_COLORS['Alpine'] },
    ],
  },
}

export function getGpQuestions(round: number): GpQuestions | undefined {
  return GP_QUESTIONS[round]
}
