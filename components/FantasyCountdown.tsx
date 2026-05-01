'use client'

import { useState, useEffect } from 'react'
import { getDeadlineCountdown } from '@/lib/scoring'

export function FantasyCountdown({
  deadline,
  isSprint = false,
}: {
  deadline: string
  isSprint?: boolean
}) {
  const [cd, setCd] = useState(getDeadlineCountdown(deadline))

  useEffect(() => {
    const t = setInterval(() => setCd(getDeadlineCountdown(deadline)), 1000)
    return () => clearInterval(t)
  }, [deadline])

  if (cd.closed) return null

  return (
    <div className="mt-3 rounded-xl bg-gray-900/60 border border-gray-700/40 px-4 py-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-0.5">
            🏅 F1 Fantasy &amp; F1 Predict
          </p>
          <p className="text-[11px] text-gray-500">
            {isSprint
              ? 'Fecha antes da Sprint Race'
              : 'Fecha antes da Qualificação'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {[
            { value: cd.days,    label: 'DIAS' },
            { value: cd.hours,   label: 'HRS'  },
            { value: cd.minutes, label: 'MIN'  },
            { value: cd.seconds, label: 'SEG'  },
          ].map((unit, idx) => (
            <div key={unit.label} className="flex items-center gap-1">
              {idx > 0 && (
                <span className="text-sm font-black text-gray-600 leading-none pb-2.5">:</span>
              )}
              <div className="flex flex-col items-center">
                <div className="bg-black/60 border border-yellow-700/30 rounded-md px-1.5 py-0.5 min-w-[28px] text-center">
                  <span className="text-sm font-black tabular-nums text-yellow-400 leading-none">
                    {String(unit.value).padStart(2, '0')}
                  </span>
                </div>
                <span className="text-[8px] text-gray-600 font-bold tracking-widest mt-0.5">
                  {unit.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
