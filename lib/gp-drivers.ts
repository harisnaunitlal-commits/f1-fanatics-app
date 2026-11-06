import { PILOTOS_2026 } from '@/lib/supabase/types'

export type GpDriver = { codigo: string; nome: string; equipa: string }

// Drivers offered in the F1 Play questions of one Grand Prix (by round) and the ones that are not racing there.
// Substitutes appear in the lists; the driver they replace stays visible but disabled ("não participa").
export function gpDrivers(round: number): { pilotos: GpDriver[]; disabled: string[] } {
  const base: GpDriver[] = PILOTOS_2026.map(p => ({ ...p }))
  // R12–R14: Lawson drives for Red Bull in place of Hadjar, Tsunoda for Racing Bulls
  if (round === 12 || round === 13 || round === 14) {
    return {
      pilotos: [
        { codigo: 'LAW', nome: 'Liam Lawson', equipa: 'Red Bull Racing' },
        ...base.map(p => (p.codigo === 'LAW' ? { codigo: 'TSU', nome: 'Yuki Tsunoda', equipa: 'Racing Bulls' } : p)),
      ],
      disabled: ['HAD'],
    }
  }
  // R19 México: Ryo Hirakawa drives the Haas in place of Esteban Ocon
  if (round === 19) {
    return {
      pilotos: base.flatMap(p => (p.codigo === 'OCO' ? [p, { codigo: 'HIR', nome: 'Ryo Hirakawa', equipa: 'Haas' }] : [p])),
      disabled: ['OCO'],
    }
  }
  // R20 Brasil onwards: Rafael Câmara takes the Haas seat of Esteban Ocon (Ocon is no longer on the grid)
  if (round >= 20) {
    return {
      pilotos: base.map(p => (p.codigo === 'OCO' ? { codigo: 'CAM', nome: 'Rafael Câmara', equipa: 'Haas' } : p)),
      disabled: [],
    }
  }
  return { pilotos: base, disabled: [] }
}

// Names for results screens: includes substitutes that are not in the season list
export const EXTRA_DRIVER_NAMES: Record<string, string> = { HIR: 'Ryo Hirakawa', TSU: 'Yuki Tsunoda', CAM: 'Rafael Câmara' }
