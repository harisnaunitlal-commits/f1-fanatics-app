import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const viewport: Viewport = {
  themeColor: '#E10600',
}

export const metadata: Metadata = {
  title: 'Beira F1',
  description: 'A liga de previsões F1 da Beira, Moçambique. Fundada em 2021.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Beira F1',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="apple-touch-icon" href="/logos/beira-f1.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-f1dark text-white antialiased">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="text-center text-gray-500 text-sm py-8 mt-12">
          <p>🏎️ Beira F1 Fanatics · Fundada 27 Mar 2021 · Beira, Moçambique</p>
        </footer>
      </body>
    </html>
  )
}
