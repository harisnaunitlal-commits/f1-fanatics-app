'use client'

import { useState, useEffect } from 'react'
import { getDeadlineCountdown, isDeadlinePassed } from '@/lib/scoring'

export function MiniCountdown({ deadline }: { deadline: string }) {
  const [cd, setCd] = useState(getDeadlineCountdown(deadline))

  useEffect(() => {
    const t = setInterval(() => {
      setCd(getDeadlineCountdown(deadline))
    }, 1000)
    return () => clearInterval(t)
  }, [deadline])

  if (cd.closed) return null

  return (
    <div className="mt-3 flex items-center justify-end gap-1.5">
      {[
        { value: cd.days,    label: 'DIAS' },
        { value: cd.hours,   label: 'HRS'  },
        { value: cd.minutes, label: 'MIN'  },
        { value: cd.seconds, label: 'SEG'  },
      ].map((unit, idx) => (
        <div key={unit.label} className="flex items-center gap-1.5">
          {idx > 0 && (
            <span className="text-base font-black text-gray-600 leading-none pb-3">:</span>
          )}
          <div className="flex flex-col items-center">
            <div className="bg-black/50 border border-white/10 rounded-lg px-2 py-1 min-w-[36px] text-center">
              <span className="text-lg font-black tabular-nums text-white leading-none">
                {String(unit.value).padStart(2, '0')}
              </span>
            </div>
            <span className="text-[9px] text-gray-500 font-bold tracking-widest mt-1">
              {unit.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
