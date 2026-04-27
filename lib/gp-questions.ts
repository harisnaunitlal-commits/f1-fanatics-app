export interface DuelConfig {
  driverA: string
  nameA: string
  teamA: string
  driverB: string
  nameB: string
  teamB: string
}

export interface DriverOption {
  codigo: string
  nome: string
  equipa: string
}

export interface GpQuestions {
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

const GP_QUESTIONS: Record<number, GpQuestions> = {
  1: { // R01 - Australia
    p2Label: "Qual será a 2ª equipa que mais vai pontuar no GP da Austrália?",
    p3Options: P3_OPTIONS,
    p5: { driverA:"HAD", nameA:"Isack Hadjar", teamA:"Red Bull", driverB:"PIA", nameB:"Oscar Piastri", teamB:"McLaren" },
    p6: { driverA:"RUS", nameA:"George Russell", teamA:"Mercedes", driverB:"ANT", nameB:"Kimi Antonelli", teamB:"Mercedes" },
    p7: { driverA:"HUL", nameA:"Nico Hülkenberg", teamA:"Audi", driverB:"BEA", nameB:"Oliver Bearman", teamB:"Haas" },
    p13Label: "Qual piloto (novato) terminará na posição mais alta?",
    p13Options: [
      { codigo:"BEA", nome:"Oliver Bearman", equipa:"Haas" },
      { codigo:"LAW", nome:"Liam Lawson", equipa:"Racing Bulls" },
      { codigo:"LIN", nome:"Arvid Lindblad", equipa:"Racing Bulls" },
      { codigo:"OCO", nome:"Esteban Ocon", equipa:"Haas" },
      { codigo:"BOR", nome:"Gabriel Bortoleto", equipa:"Audi" },
    ],
    p15Label: "Qual piloto terminará na posição mais alta?",
    p15Options: [
      { codigo:"ALO", nome:"Fernando Alonso", equipa:"Aston Martin" },
      { codigo:"COL", nome:"Franco Colapinto", equipa:"Alpine" },
      { codigo:"ALB", nome:"Alexander Albon", equipa:"Williams" },
      { codigo:"PER", nome:"Sergio Perez", equipa:"Cadillac" },
      { codigo:"BOT", nome:"Valtteri Bottas", equipa:"Cadillac" },
    ],
  },
  2: { // R02 - China
    p2Label: "Qual será a 2ª equipa que mais vai pontuar no GP da China?",
    p3Options: P3_OPTIONS,
    p5: { driverA:"PIA", nameA:"Oscar Piastri", teamA:"McLaren", driverB:"NOR", nameB:"Lando Norris", teamB:"McLaren" },
    p6: { driverA:"ANT", nameA:"Kimi Antonelli", teamA:"Mercedes", driverB:"RUS", nameB:"George Russell", teamB:"Mercedes" },
    p7: { driverA:"HUL", nameA:"Nico Hülkenberg", teamA:"Audi", driverB:"HAD", nameB:"Isack Hadjar", teamB:"Red Bull" },
    p13Label: "Qual piloto terminará na posição mais alta?",
    p13Options: [
      { codigo:"LAW", nome:"Liam Lawson", equipa:"Racing Bulls" },
      { codigo:"OCO", nome:"Esteban Ocon", equipa:"Haas" },
      { codigo:"HUL", nome:"Nico Hülkenberg", equipa:"Audi" },
      { codigo:"BEA", nome:"Oliver Bearman", equipa:"Haas" },
      { codigo:"GAS", nome:"Pierre Gasly", equipa:"Alpine" },
    ],
    p15Label: "Qual piloto terminará na posição mais alta?",
    p15Options: [
      { codigo:"ALB", nome:"Alexander Albon", equipa:"Williams" },
      { codigo:"PER", nome:"Sergio Perez", equipa:"Cadillac" },
      { codigo:"COL", nome:"Franco Colapinto", equipa:"Alpine" },
      { codigo:"SAI", nome:"Carlos Sainz", equipa:"Williams" },
      { codigo:"ALO", nome:"Fernando Alonso", equipa:"Aston Martin" },
    ],
  },
  3: { // R03 - Japan
    p2Label: "Qual será a 3ª equipa que mais vai pontuar no GP do Japão?",
    p3Options: P3_OPTIONS,
    p5: { driverA:"HAM", nameA:"Lewis Hamilton", teamA:"Ferrari", driverB:"LEC", nameB:"Charles Leclerc", teamB:"Ferrari" },
    p6: { driverA:"ANT", nameA:"Kimi Antonelli", teamA:"Mercedes", driverB:"RUS", nameB:"George Russell", teamB:"Mercedes" },
    p7: { driverA:"BEA", nameA:"Oliver Bearman", teamA:"Haas", driverB:"HAD", nameB:"Isack Hadjar", teamB:"Red Bull" },
    p13Label: "Qual piloto terminará na posição mais alta?",
    p13Options: [
      { codigo:"BEA", nome:"Oliver Bearman", equipa:"Haas" },
      { codigo:"OCO", nome:"Esteban Ocon", equipa:"Haas" },
      { codigo:"GAS", nome:"Pierre Gasly", equipa:"Alpine" },
      { codigo:"LAW", nome:"Liam Lawson", equipa:"Racing Bulls" },
      { codigo:"HAD", nome:"Isack Hadjar", equipa:"Red Bull" },
    ],
    p15Label: "Qual piloto terminará na posição mais alta?",
    p15Options: [
      { codigo:"ALB", nome:"Alexander Albon", equipa:"Williams" },
      { codigo:"COL", nome:"Franco Colapinto", equipa:"Alpine" },
      { codigo:"BOR", nome:"Gabriel Bortoleto", equipa:"Audi" },
      { codigo:"ALO", nome:"Fernando Alonso", equipa:"Aston Martin" },
      { codigo:"PER", nome:"Sergio Perez", equipa:"Cadillac" },
    ],
  },
}

export function getGpQuestions(round: number): GpQuestions | undefined {
  return GP_QUESTIONS[round]
}
