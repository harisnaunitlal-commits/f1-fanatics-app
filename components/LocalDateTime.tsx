'use client'

import { useEffect, useState } from 'react'

/**
 * Displays a UTC date/time in the user's local browser timezone.
 * Falls back to Mozambique (Africa/Maputo) on server-side render.
 */
export default function LocalDateTime({
  isoDate,
  options,
}: {
  isoDate: string
  options?: Intl.DateTimeFormatOptions
}) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }

  // SSR: render with Maputo timezone to avoid hydration mismatch
  const [formatted, setFormatted] = useState(() =>
    new Date(isoDate).toLocaleString('pt', {
      ...defaultOptions,
      timeZone: 'Africa/Maputo',
      timeZoneName: 'short',
    })
  )

  useEffect(() => {
    // Client: re-render with user's actual local timezone
    const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setFormatted(
      new Date(isoDate).toLocaleString('pt', {
        ...defaultOptions,
        timeZone: userTz,
        timeZoneName: 'short',
      })
    )
  }, [isoDate])

  return <span suppressHydrationWarning>{formatted}</span>
}
