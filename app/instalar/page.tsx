import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Instalar App — Beira F1',
  description: 'Como instalar a app Beira F1 no teu Android ou iPhone.',
}

const steps = {
  android: [
    {
      step: 1,
      title: 'Abre o Chrome',
      desc: 'Abre o site af1fanatics.com no browser Google Chrome do teu Android.',
      icon: '🌐',
    },
    {
      step: 2,
      title: 'Menu do Chrome',
      desc: 'Toca nos três pontos (⋮) no canto superior direito do browser.',
      icon: '⋮',
    },
    {
      step: 3,
      title: '"Add to Home screen"',
      desc: 'No menu que aparece, toca em "Add to Home screen" (Adicionar ao ecrã inicial).',
      icon: '📲',
    },
    {
      step: 4,
      title: 'Confirma o nome',
      desc: 'Confirma o nome "Beira F1" e toca em "Add".',
      icon: '✅',
    },
    {
      step: 5,
      title: 'Pronto!',
      desc: 'O ícone da Beira F1 aparece no teu ecrã inicial. Abre como uma app nativa!',
      icon: '🏎️',
    },
  ],
  ios: [
    {
      step: 1,
      title: 'Abre o Safari',
      desc: 'Abre o site af1fanatics.com no Safari. Tem que ser o Safari — outros browsers no iOS não suportam instalação.',
      icon: '🧭',
    },
    {
      step: 2,
      title: 'Botão de Partilhar',
      desc: 'Toca no ícone de partilhar (□ com seta para cima) na barra inferior do Safari.',
      icon: '⬆️',
    },
    {
      step: 3,
      title: '"Adicionar ao Ecrã de Início"',
      desc: 'Desliza para baixo no menu e toca em "Adicionar ao Ecrã de Início" (Add to Home Screen).',
      icon: '📲',
    },
    {
      step: 4,
      title: 'Confirma o nome',
      desc: 'Confirma o nome "Beira F1" e toca em "Adicionar" no canto superior direito.',
      icon: '✅',
    },
    {
      step: 5,
      title: 'Pronto!',
      desc: 'O ícone aparece no teu ecrã inicial. Abre em ecrã completo como uma app!',
      icon: '🏎️',
    },
  ],
}

export default function InstalarPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <Image
            src="/logos/beira-f1.png"
            alt="Beira F1"
            width={80}
            height={80}
            className="rounded-2xl shadow-lg shadow-f1red/20"
          />
        </div>
        <h1 className="text-3xl font-black">Instalar a App</h1>
        <p className="text-gray-400 text-sm leading-relaxed">
          A Beira F1 funciona como uma app instalável no teu telemóvel —<br />
          sem precisar da Google Play Store nem da App Store.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: '⚡', label: 'Rápida', sub: 'Abre instantaneamente' },
          { icon: '📵', label: 'Sem browser', sub: 'Ecrã completo' },
          { icon: '🔔', label: 'Sempre actualizada', sub: 'Sem actualizações manuais' },
        ].map(b => (
          <div key={b.label} className="card py-4 text-center">
            <div className="text-2xl mb-1">{b.icon}</div>
            <div className="text-xs font-bold text-white">{b.label}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{b.sub}</div>
          </div>
        ))}
      </div>

      {/* Android */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-green-900/40 border border-green-700/30 flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h2 className="text-xl font-black">Android</h2>
            <p className="text-xs text-gray-500">Google Chrome</p>
          </div>
        </div>
        <div className="space-y-3">
          {steps.android.map(s => (
            <div key={s.step} className="card flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-green-900/40 border border-green-700/30 flex items-center justify-center text-sm font-black text-green-400">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm">{s.icon} {s.title}</div>
                <div className="text-gray-400 text-sm mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Note Samsung */}
        <div className="mt-3 bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3">
          <p className="text-xs text-yellow-400 font-bold mb-1">⚠️ Samsung — Ecrã inicial bloqueado</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            Se aparecer o erro "Home screen layout locked", mantém o dedo pressionado num espaço vazio
            do ecrã inicial → toca em <strong className="text-white">Settings</strong> →
            desactiva <strong className="text-white">"Lock Home screen layout"</strong>.
          </p>
        </div>
      </section>

      {/* iOS */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-700/30 flex items-center justify-center text-xl">
            🍎
          </div>
          <div>
            <h2 className="text-xl font-black">iPhone / iPad</h2>
            <p className="text-xs text-gray-500">Safari — obrigatório</p>
          </div>
        </div>
        <div className="space-y-3">
          {steps.ios.map(s => (
            <div key={s.step} className="card flex items-start gap-4">
              <div className="shrink-0 w-8 h-8 rounded-full bg-blue-900/40 border border-blue-700/30 flex items-center justify-center text-sm font-black text-blue-400">
                {s.step}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-sm">{s.icon} {s.title}</div>
                <div className="text-gray-400 text-sm mt-0.5 leading-relaxed">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Note iOS */}
        <div className="mt-3 bg-blue-900/20 border border-blue-700/30 rounded-xl p-3">
          <p className="text-xs text-blue-400 font-bold mb-1">ℹ️ Apenas funciona no Safari</p>
          <p className="text-xs text-gray-400 leading-relaxed">
            No iOS, outros browsers como Chrome ou Firefox não permitem instalar apps.
            Usa sempre o <strong className="text-white">Safari</strong> para este processo.
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="card text-center py-6 border-f1red/30">
        <div className="text-3xl mb-2">🏁</div>
        <p className="font-bold text-white mb-1">Já tens a app instalada?</p>
        <p className="text-gray-400 text-sm mb-4">Entra e faz as tuas previsões para o próximo GP!</p>
        <a href="/" className="btn-primary inline-block px-6 py-2.5">
          Ir para o início
        </a>
      </div>

    </div>
  )
}
