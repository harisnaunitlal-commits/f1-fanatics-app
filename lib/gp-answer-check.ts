import type { GpQuestions, DuelConfig, DriverOption } from './gp-questions'

// Answers that depend on the per-GP question config (duels and the two 5-driver questions).
// When the admin changes those questions, answers given for the old ones must not survive:
// "VER" meant "VER beats NOR" before and means something else (or nothing) afterwards.
export const CONFIG_FIELDS = ['p5_duelo', 'p6_duelo', 'p7_duelo', 'p13_especial', 'p15_outsider'] as const
export type ConfigField = typeof CONFIG_FIELDS[number]

export const CONFIG_FIELD_LABEL: Record<ConfigField, string> = {
  p5_duelo: 'P5 — Duelo 1', p6_duelo: 'P6 — Duelo 2', p7_duelo: 'P7 — Duelo 3',
  p13_especial: 'P13 — Pergunta Especial', p15_outsider: 'P15 — Outsider',
}

const duelCodes = (d: DuelConfig): string[] => [d.driverA, d.driverB]
const optionCodes = (o: DriverOption[]): string[] => o.map(x => x.codigo)

export function optionsFor(cfg: GpQuestions, f: ConfigField): string[] {
  switch (f) {
    case 'p5_duelo': return duelCodes(cfg.p5)
    case 'p6_duelo': return duelCodes(cfg.p6)
    case 'p7_duelo': return duelCodes(cfg.p7)
    case 'p13_especial': return optionCodes(cfg.p13Options)
    case 'p15_outsider': return optionCodes(cfg.p15Options)
  }
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|')

// Questions whose set of options differs between two configs.
export function changedFields(before: GpQuestions | undefined, after: GpQuestions): ConfigField[] {
  if (!before) return [...CONFIG_FIELDS]
  return CONFIG_FIELDS.filter(f => !sameSet(optionsFor(before, f), optionsFor(after, f)))
}

// Fields of a prediction whose answer is not one of the options of the current config.
export function invalidAnswers(cfg: GpQuestions, pred: Partial<Record<ConfigField, string | null>>): ConfigField[] {
  return CONFIG_FIELDS.filter(f => {
    const v = pred[f]
    return !!v && !optionsFor(cfg, f).some(c => c.toUpperCase() === v.toUpperCase())
  })
}
