import type { Metadata } from 'next'
import InstallGuide from './InstallGuide'

export const metadata: Metadata = {
  title: 'Instalar App — Beira F1',
  description: 'Instala a app Beira F1 no teu Android ou iPhone em 10 segundos.',
}

export default function InstalarPage() {
  return <InstallGuide />
}
