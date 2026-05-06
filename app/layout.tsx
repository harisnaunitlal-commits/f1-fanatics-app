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
  icons: {
    icon: [
      { url: '/logos/beira-f1.png', type: 'image/png' },
    ],
    apple: '/logos/beira-f1.png',
    shortcut: '/logos/beira-f1.png',
  },
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
        <link rel="icon" href="/logos/beira-f1.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logos/beira-f1.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-f1dark text-white antialiased">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="text-center text-gray-500 text-sm py-8 mt-12 space-y-1.5">
          <p>🏎️ Beira F1 Fanatics · Fundada 27 Mar 2021 · Beira, Moçambique</p>
          <p>
            Site desenvolvido por <span className="text-gray-400">Harishkumar Naunitlal</span>
            {' · '}
            <a
              href="mailto:haris.naunitlal@gmail.com"
              className="text-gray-400 hover:text-white transition-colors underline underline-offset-2"
            >
              haris.naunitlal@gmail.com
            </a>
          </p>
        </footer>
      </body>
    </html>
  )
}
