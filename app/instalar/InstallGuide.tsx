'use client'

import { useEffect, useState } from 'react'

type Platform = 'ios' | 'android' | 'desktop'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const URL_APP = 'app.beiraf1fanatics.com'

const IOS_STEPS = [
  { t: 'Abre este link no Safari', d: 'Tem de ser o Safari (a bússola azul). Chrome, WhatsApp e Instagram não deixam instalar.' },
  { t: 'Toca em Partilhar', d: 'O quadrado com a seta para cima, na barra de baixo (ou em cima, no iPad).' },
  { t: '"Adicionar ao Ecrã de Início"', d: 'Desliza o menu para cima até encontrar. Pode aparecer como "Adicionar ao ecrã principal" ou "Add to Home Screen".' },
  { t: 'Toca em "Adicionar"', d: 'Canto superior direito. O ícone Beira F1 fica no teu ecrã — abre como uma app.' },
]

const ANDROID_STEPS = [
  { t: 'Abre este link no Chrome', d: 'Google Chrome, no teu Android.' },
  { t: 'Menu ⋮ (três pontos)', d: 'Canto superior direito do Chrome.' },
  { t: '"Instalar app"', d: 'Ou "Adicionar ao ecrã principal". Confirma em "Instalar".' },
]

function ShareIcon() {
  return (
    <svg className="inline-block w-5 h-5 align-text-bottom text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15V3M8 7l4-4 4 4" /><path d="M6 11H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1" />
    </svg>
  )
}

function Steps({ steps, tone }: { steps: { t: string; d: string }[]; tone: 'green' | 'blue' }) {
  const c = tone === 'green' ? 'bg-green-900/40 border-green-700/30 text-green-400' : 'bg-blue-900/40 border-blue-700/30 text-blue-400'
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="card flex items-start gap-4">
          <div className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center text-sm font-black ${c}`}>{i + 1}</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm">{s.t}{i === 1 && tone === 'blue' && <> <ShareIcon /></>}</div>
            <div className="text-gray-400 text-sm mt-0.5 leading-relaxed">{s.d}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function InstallGuide() {
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [installed, setInstalled] = useState(false)
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [copied, setCopied] = useState(false)
  const [showOther, setShowOther] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
    setPlatform(/iPhone|iPad|iPod/.test(ua) || iPadOS ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop')
    setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true)
    const onPrompt = (e: Event) => { e.preventDefault(); setPrompt(e as BeforeInstallPromptEvent) }
    const onInstalled = () => { setInstalled(true); setPrompt(null) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
  }

  async function copyLink() {
    const link = `https://${URL_APP}/instalar`
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500) } catch { window.prompt('Copia o link:', link) }
  }

  const ios = platform === 'ios', android = platform === 'android', desktop = platform === 'desktop'

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/beira-f1.png" alt="Beira F1" width={84} height={84} className="rounded-2xl shadow-lg shadow-f1red/20" />
        </div>
        <h1 className="text-3xl font-black">Instalar a App</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          Funciona como uma app no teu telemóvel — sem Play Store nem App Store. Demora 10 segundos.
        </p>
      </div>

      {installed && (
        <div className="card text-center border-green-600/40 bg-green-900/10 space-y-2">
          <div className="text-3xl">✅</div>
          <p className="font-bold text-white">A app já está instalada neste telemóvel!</p>
          <a href="/" className="btn-primary inline-block px-6 py-2.5">Ir para o início</a>
        </div>
      )}

      {!installed && platform && (
        <>
          {android && prompt && (
            <button onClick={install} className="btn-primary w-full py-4 text-lg font-black">📲 Instalar agora</button>
          )}

          {desktop && (
            <div className="card text-center space-y-3">
              <p className="font-bold text-white">📱 Abre este link no teu telemóvel</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/qr-instalar.svg" alt="QR code" className="w-44 h-44 mx-auto rounded-xl bg-white p-2" />
              <p className="text-gray-400 text-sm">Aponta a câmara ao código, ou escreve <strong className="text-white">{URL_APP}/instalar</strong></p>
            </div>
          )}

          {(ios || android || desktop) && (
            <section className="space-y-3">
              <h2 className="text-xl font-black">{ios ? '🍎 iPhone / iPad' : android ? '🤖 Android' : '🍎 iPhone / iPad'}</h2>
              <Steps steps={ios || desktop ? IOS_STEPS : ANDROID_STEPS} tone={ios || desktop ? 'blue' : 'green'} />
            </section>
          )}

          {ios && (
            <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-xl p-4 space-y-3">
              <p className="text-sm text-yellow-300 font-bold">💡 Abriste este link pelo WhatsApp ou Instagram?</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                Se não vês "Adicionar ao Ecrã de Início", estás fora do Safari. Copia o link, abre o <strong className="text-white">Safari</strong> e cola na barra de endereços.
              </p>
              <button onClick={copyLink} className="btn-primary w-full py-2.5">{copied ? '✅ Link copiado — cola no Safari' : '📋 Copiar link'}</button>
            </div>
          )}

          {android && !prompt && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3">
              <p className="text-xs text-yellow-400 font-bold mb-1">⚠️ Samsung — Ecrã inicial bloqueado</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Se aparecer "Home screen layout locked", mantém o dedo num espaço vazio do ecrã inicial → <strong className="text-white">Settings</strong> → desactiva <strong className="text-white">"Lock Home screen layout"</strong>.
              </p>
            </div>
          )}

          {!desktop && (
            <div>
              <button onClick={() => setShowOther(v => !v)} className="text-sm text-gray-400 underline">
                {showOther ? 'Esconder' : ios ? 'Ver passos para Android' : 'Ver passos para iPhone'}
              </button>
              {showOther && (
                <div className="mt-4 space-y-3">
                  <h2 className="text-xl font-black">{ios ? '🤖 Android' : '🍎 iPhone / iPad'}</h2>
                  <Steps steps={ios ? ANDROID_STEPS : IOS_STEPS} tone={ios ? 'green' : 'blue'} />
                </div>
              )}
            </div>
          )}

          <div className="card space-y-2">
            <p className="text-sm font-bold text-white">🔔 Depois de instalar</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Abre a app, faz login e toca no sino 🔔 ao lado do teu nome para receber avisos antes de fechar as previsões. No iPhone as notificações só funcionam com a app instalada.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
