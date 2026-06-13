export const metadata = { title: 'Como Jogar · Beira F1 Fanatics' }

export default function InstrucoesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Como Jogar</h1>
        <p className="text-gray-400">Guia completo para aderires à liga Beira F1 Fanatics</p>
      </div>

      {/* ── 1. Registar ─────────────────────────────────────── */}
      <section className="bg-f1dark border-l-4 border-f1red rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-f1red flex items-center gap-2">
          <span className="bg-f1red text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-black shrink-0">1</span>
          Registar na plataforma
        </h2>
        <ol className="space-y-3 text-gray-300 text-sm">
          <li className="flex gap-3 items-start">
            <span className="bg-red-500/20 text-f1red rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">①</span>
            <span>Clica em <strong className="text-white">Entrar</strong> no menu e regista-te com o teu email Google ou cria uma conta com email e senha.</span>
          </li>
          <li className="flex gap-3 items-start">
            <span className="bg-red-500/20 text-f1red rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">②</span>
            Após o registo, o administrador activa a tua conta. Receberás um email de boas-vindas quando estiveres activo.
          </li>
          <li className="flex gap-3 items-start">
            <span className="bg-red-500/20 text-f1red rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">③</span>
            Depois de activado, já podes submeter previsões e ver o ranking global.
          </li>
        </ol>
      </section>

      {/* ── 2. As 3 Ligas ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-gray-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-black shrink-0">2</span>
          <h2 className="text-xl font-bold text-white">As 3 Ligas</h2>
        </div>
        <p className="text-gray-400 text-sm pl-10">
          A Beira F1 Fanatics tem três ligas independentes. Para disputar o{' '}
          <strong className="text-yellow-400">Triatlo Ranking</strong>, deves participar nas três.
        </p>

        {/* F1 Play */}
        <div className="bg-f1dark border border-gray-600 border-l-4 border-l-gray-400 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <img src="/logos/f1-play.png" alt="F1 Play" className="h-12 w-12 object-contain rounded-xl bg-black p-1" />
            <div>
              <h3 className="font-bold text-white text-lg">F1 Play Fanatics</h3>
              <span className="text-xs text-gray-400">Jogado aqui nesta plataforma</span>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-300 border-t border-gray-700 pt-3">
            <p className="flex gap-2"><span className="text-green-400 shrink-0">✓</span> 15 perguntas sobre o GP: pódio, duelos entre pilotos, Safety Car, DOTD, e mais.</p>
            <p className="flex gap-2"><span className="text-green-400 shrink-0">✓</span> Máximo de 20 pontos por GP.</p>
            <p className="flex gap-2 font-semibold"><span className="text-orange-400 shrink-0">⏰</span> <span><strong className="text-orange-300">Prazo: fecha ao início da corrida</strong> — domingo, hora da largada.</span></p>
            <p className="flex gap-2"><span className="text-gray-400 shrink-0">→</span> Vai a <strong className="text-white mx-1">Previsões</strong> neste site e submete as tuas respostas antes do prazo.</p>
          </div>
        </div>

        {/* F1 Fantasy */}
        <div className="bg-f1dark border border-red-900/50 border-l-4 border-l-red-500 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <img src="/logos/f1-fantasy.jpg" alt="F1 Fantasy" className="h-12 w-12 object-contain rounded-xl" />
            <div>
              <h3 className="font-bold text-white text-lg">F1 Fantasy</h3>
              <span className="text-xs text-red-400">fantasy.formula1.com</span>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-300 border-t border-red-900/30 pt-3">
            <p className="flex gap-2"><span className="text-green-400 shrink-0">✓</span> Escolhe pilotos e construtores com um orçamento limitado e ganha pontos com os resultados reais.</p>
            <p className="flex gap-2"><span className="text-green-400 shrink-0">✓</span> Podes fazer transferências antes de cada GP.</p>
            <p className="flex gap-2 font-semibold"><span className="text-orange-400 shrink-0">⏰</span> <span><strong className="text-orange-300">Prazo: fecha ao início do Qualifying</strong> — normalmente sábado.</span></p>
            <p className="flex gap-2"><span className="text-red-400 shrink-0">→</span> Regista-te em <strong className="text-white mx-1">fantasy.formula1.com</strong> e junta-te à liga com o código:</p>
          </div>
          <div className="bg-black/50 border border-red-900/40 rounded-xl px-5 py-3 text-center">
            <span className="text-xs text-gray-400 block mb-1">Código da Liga</span>
            <span className="text-2xl font-black text-yellow-400 tracking-widest">C57XPPKP703</span>
          </div>
        </div>

        {/* F1 Predict */}
        <div className="bg-f1dark border border-green-900/50 border-l-4 border-l-green-500 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <img src="/logos/f1-predict.jpg" alt="F1 Predict" className="h-12 w-12 object-contain rounded-xl" />
            <div>
              <h3 className="font-bold text-white text-lg">F1 Predict</h3>
              <span className="text-xs text-green-400">f1predict.formula1.com</span>
            </div>
          </div>
          <div className="space-y-2 text-sm text-gray-300 border-t border-green-900/30 pt-3">
            <p className="flex gap-2"><span className="text-green-400 shrink-0">✓</span> Prevê os resultados da corrida: top 10, volta rápida, DOTD, e outros.</p>
            <p className="flex gap-2"><span className="text-green-400 shrink-0">✓</span> Disponível na app oficial da F1 ou em f1predict.formula1.com.</p>
            <p className="flex gap-2 font-semibold"><span className="text-orange-400 shrink-0">⏰</span> <span><strong className="text-orange-300">Prazo: fecha ao início do Qualifying</strong> — normalmente sábado.</span></p>
            <p className="flex gap-2"><span className="text-green-400 shrink-0">→</span> Regista-te e junta-te à liga com o código:</p>
          </div>
          <div className="bg-black/50 border border-green-900/40 rounded-xl px-5 py-3 text-center">
            <span className="text-xs text-gray-400 block mb-1">Código da Liga</span>
            <span className="text-2xl font-black text-yellow-400 tracking-widest">C4MIFTXAH05</span>
          </div>
        </div>
      </section>

      {/* ── 3. Triatlo Ranking ──────────────────────────────── */}
      <section className="bg-gradient-to-br from-yellow-900/30 to-f1dark border border-yellow-500/40 border-l-4 border-l-yellow-400 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-yellow-500 text-black rounded-full w-7 h-7 flex items-center justify-center text-sm font-black shrink-0">3</span>
          <h2 className="text-xl font-bold text-yellow-400">Triatlo Ranking</h2>
        </div>
        <p className="text-gray-300 text-sm">
          O <strong className="text-yellow-400">Triatlo</strong> é o ranking geral que combina as três ligas numa única classificação.
          Para pontuar basta participar em pelo menos uma liga — mas quanto mais ligas jogares, maior a tua pontuação.
        </p>
        <div className="space-y-2 border-t border-yellow-800/40 pt-3">
          <h3 className="text-white font-semibold text-sm mb-3">Como é calculado:</h3>
          {[
            { n: '1', text: 'Os pontos acumulados de cada liga são normalizados — o líder de cada liga vale 100 pontos Triatlo.' },
            { n: '2', text: 'A tua pontuação Triatlo é a média dos teus pontos normalizados nas ligas em que participas.' },
            { n: '3', text: 'Quem joga as 3 ligas tem mais peso na classificação — por isso vale a pena ser competitivo em todas!' },
          ].map(({ n, text }) => (
            <div key={n} className="flex items-start gap-3 bg-black/30 rounded-xl p-3 text-sm text-gray-300">
              <span className="bg-yellow-500 text-black font-black rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs">{n}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-200">
          💡 <strong>Dica:</strong> Participar nas 3 ligas não te penaliza se fores fraco numa — só te penaliza se deixares de jogar e ficares com 0 pontos nessa liga.
        </div>
      </section>

      {/* ── Resumo dos Prazos ───────────────────────────────── */}
      <section className="bg-f1dark border border-f1gray rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Resumo dos Prazos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-center">
          <div className="bg-gray-800/60 border border-gray-600 rounded-xl p-4 space-y-1">
            <img src="/logos/f1-play.png" alt="" className="h-8 w-8 object-contain mx-auto rounded bg-black p-0.5" />
            <div className="font-bold text-white text-sm mt-2">F1 Play</div>
            <div className="text-orange-300 font-semibold text-xs">Início da Corrida</div>
            <div className="text-gray-400 text-xs">Domingo · hora da largada</div>
          </div>
          <div className="bg-red-900/20 border border-red-900/40 rounded-xl p-4 space-y-1">
            <img src="/logos/f1-fantasy.jpg" alt="" className="h-8 w-8 object-contain mx-auto rounded" />
            <div className="font-bold text-white text-sm mt-2">F1 Fantasy</div>
            <div className="text-orange-300 font-semibold text-xs">Início do Qualifying</div>
            <div className="text-gray-400 text-xs">Normalmente sábado</div>
          </div>
          <div className="bg-green-900/20 border border-green-900/40 rounded-xl p-4 space-y-1">
            <img src="/logos/f1-predict.jpg" alt="" className="h-8 w-8 object-contain mx-auto rounded" />
            <div className="font-bold text-white text-sm mt-2">F1 Predict</div>
            <div className="text-orange-300 font-semibold text-xs">Início do Qualifying</div>
            <div className="text-gray-400 text-xs">Normalmente sábado</div>
          </div>
        </div>
      </section>

      {/* ── Contacto ────────────────────────────────────────── */}
      <section className="bg-f1dark border border-f1gray rounded-2xl p-6 space-y-4 text-center">
        <h2 className="text-lg font-bold text-white">Dúvidas ou Sugestões?</h2>
        <p className="text-gray-400 text-sm">
          Fala connosco para qualquer questão sobre a liga, as apostas ou para sugerir melhorias à plataforma.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href="mailto:info@beiraf1fanatics.com"
            className="flex items-center gap-2 bg-f1gray hover:bg-gray-600 transition-colors text-white rounded-xl px-5 py-3 text-sm font-medium"
          >
            <span className="text-lg">✉️</span>
            info@beiraf1fanatics.com
          </a>
          <a
            href="https://wa.me/258825029170"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 transition-colors text-white rounded-xl px-5 py-3 text-sm font-medium"
          >
            <span className="text-lg">💬</span>
            WhatsApp · +258 82 502 9170
          </a>
        </div>
      </section>

    </main>
  )
}
