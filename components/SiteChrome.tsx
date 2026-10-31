'use client'

import { usePathname } from 'next/navigation'

// The normal site frame (menu, footer). The admin's chromeless telemetry windows (/janela/…) get none of it.
export default function SiteChrome({ navbar, footer, children }: { navbar: React.ReactNode; footer: React.ReactNode; children: React.ReactNode }) {
  if (usePathname()?.startsWith('/janela')) return <>{children}</>
  return (
    <>
      {navbar}
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      {footer}
    </>
  )
}
