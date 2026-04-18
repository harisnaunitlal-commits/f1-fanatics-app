'use client'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'

export function ClickableRow({
  href,
  className = '',
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  const router = useRouter()
  return (
    <tr
      onClick={() => router.push(href)}
      className={`cursor-pointer ${className}`}
    >
      {children}
    </tr>
  )
}
