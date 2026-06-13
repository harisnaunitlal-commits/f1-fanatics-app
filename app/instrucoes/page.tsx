export const metadata = { title: 'Como Jogar · Beira F1 Fanatics' }

export default function InstrucoesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-white">Como Jogar</h1>
        <p className="text-gray-400">Guia completo para aderires à liga Beira F1 Fanatics</p>
      </div>

      {/* 1. Registar */}
      <section className="bg-f1dark border border-f1gray rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-f1red flex items-center gap-2">
          <span>1.</span> Registar na plataforma
        </h2>
        <ol className="space-y-3 text-gray-300 text-sm list-none">
          <li className="flex gap-3">
            <span className="text-f1red font-bold shrink-0">①</span>
            Clica em <strong className="text-white">Entrar</strong> no menu e regista-te com o teu email Google ou cria uma conta com email e senha.
          </li>
          <li className="flex gap-3">
            <span className="text-f1red font-bold shrink-0">②</span>
            Após o registo, o administrador activa a tua conta. Receberás um email de boas-vindas quando estiveres activo.
          </li>
          <li className="flex gap-3">
            <span className="text-f1red font-bold shrink-0">③</span>
            Depois de activado, já podes submeter previsões e ver o ranking global.
          </li>
        </ol>
      </section>

      {/* 2. As 3 Ligas */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. As 3 Ligas</h2>
        <p className="text-gray-400 text-sm">
          A Beira F1 Fanatics tem três ligas independentes. Para disputar o <strong className="text-yellow-400">Triatlo Ranking</strong>, deves participar nas três.
        </p>

        {/* F1 Play */}
        <div className="bg-f1dark border border-f1gray rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-700 rounded-lg flex items-center justify-center text-white font-black text-xs">F1P</div>
            <div>
              <h3 className="font-bold text-white text-lg">F1 Play Fanatics</h3>
              <span className="text-xs text-gray-400">Jogado aqui nesta plataforma</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2"><span className="text-green-400">✓</span> 15 perguntas sobre o GP: pódio, duelos entre pilotos, Safety Car, DOTD, e mais.</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Máximo de 20 pontos por GP.</li>
            <li className="flex gap-2"><span className="text-yellow-400">⏰</span> <strong className="text-white">Prazo: fecha ao início da corrida</strong> (domingo, hora da largada).</li>
            <li className="flex gap-2"><span className="text-blue-400">→</span> Vai a <strong className="text-white">Previsões</strong> neste site e submete as tuas respostas antes do prazo.</li>
          </ul>
        </div>

        {/* F1 Fantasy */}
        <div className="bg-f1dark border border-f1gray rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xs">F1</div>
            <div>
              <h3 className="font-bold text-white text-lg">F1 Fantasy</h3>
              <span className="text-xs text-gray-400">fantasy.formula1.com</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2"><span className="text-green-400">✓</span> Escolhe pilotos e construtores com um orçamento limitado e ganha pontos com os resultados reais.</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Podes fazer transferências antes de cada GP.</li>
            <li className="flex gap-2"><span className="text-yellow-400">⏰</span> <strong className="text-white">Prazo: fecha ao início do Qualifying</strong> (normalmente sábado).</li>
            <li className="flex gap-2"><span className="text-blue-400">→</span> Regista-te em <strong className="text-white">fantasy.formula1.com</strong> e junta-te à liga com o código:</li>
          </ul>
          <div className="bg-black/40 rounded-xl px-5 py-3 text-center">
            <span className="text-xs text-gray-400 block mb-1">Código da Liga</span>
            <span className="text-2xl font-black text-yellow-400 tracking-widest">C57XPPKP703</span>
          </div>
        </div>

        {/* F1 Predict */}
        <div className="bg-f1dark border border-f1gray rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-black text-xs">F1</div>
            <div>
              <h3 className="font-bold text-white text-lg">F1 Predict</h3>
              <span className="text-xs text-gray-400">f1predict.formula1.com</span>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li className="flex gap-2"><span className="text-green-400">✓</span> Prevê os resultados da corrida: top 10, volta rápida, DOTD, e outros.</li>
            <li className="flex gap-2"><span className="text-green-400">✓</span> Disponível na app oficial da F1 ou em f1predict.formula1.com.</li>
            <li className="flex gap-2"><span className="text-yellow-400">⏰</span> <strong className="text-white">Prazo: fecha ao início do Qualifying</strong> (normalmente sábado).</li>
            <li className="flex gap-2"><span className="text-blue-400">→</span> Regista-te e junta-te à liga com o código:</li>
          </ul>
          <div className="bg-black/40 rounded-xl px-5 py-3 text-center">
            <span className="text-xs text-gray-400 block mb-1">Código da Liga</span>
            <span className="text-2xl font-black text-yellow-400 tracking-widest">C4MIFTXAH05</span>
          </div>
        </div>
      </section>

      {/* 3. Triatlo Ranking */}
      <section className="bg-gradient-to-br from-yellow-900/30 to-f1dark border border-yellow-500/30 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
          🏆 3. Triatlo Ranking
        </h2>
        <p className="text-gray-300 text-sm">
          O <strong className="text-yellow-400">Triatlo</strong> é o ranking geral que combina as três ligas numa única classificação.
          Para pontuar no Triatlo, basta participar em pelo menos uma liga — mas quanto mais ligas jogares, maior a tua pontuação.
        </p>

        <div className="space-y-3">
          <h3 className="text-white font-semibold text-sm">Como é calculado:</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3 bg-black/30 rounded-xl p-3">
              <span className="text-yellow-400 font-bold text-lg shrink-0">1.</span>
              <span className="text-gray-300">Os pontos acumulados de cada liga são <strong className="text-white">normalizados</strong> — o líder de cada liga vale 100 pontos Triatlo.</span>
            </div>
            <div className="flex items-start gap-3 bg-black/30 rounded-xl p-3">
              <span className="text-yellow-400 font-bold text-lg shrink-0">2.</span>
              <span className="text-gray-300">A tua pontuação Triatlo é a <strong className="text-white">média dos teus pontos normalizados</strong> nas ligas em que participas.</span>
            </div>
            <div className="flex items-start gap-3 bg-black/30 rounded-xl p-3">
              <span className="text-yellow-400 font-bold text-lg shrink-0">3.</span>
              <span className="text-gray-300">Quem joga as <strong className="text-white">3 ligas</strong> tem a pontuação média dividida por 3 — por isso vale a pena ser competitivo em todas!</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-200">
          💡 <strong>Dica:</strong> Participar nas 3 ligas não te penaliza se fores fraco numa — só te penaliza se deixares de jogar e ficares com 0 pontos nessa liga.
        </div>
      </section>

      {/* Prazos resumo */}
      <section className="bg-f1dark border border-f1gray rounded-2xl p-6 space-y-3">
        <h2 className="text-xl font-bold text-white">Resumo dos Prazos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-center">
          <div className="bg-black/40 rounded-xl p-4 space-y-1">
            <div className="text-2xl">🏎️</div>
            <div className="font-bold text-white">F1 Play</div>
            <div className="text-yellow-400 font-semibold">Início da Corrida</div>
            <div className="text-gray-400 text-xs">Domingo · hora da largada</div>
          </div>
          <div className="bg-black/40 rounded-xl p-4 space-y-1">
            <div className="text-2xl">⚙️</div>
            <div className="font-bold text-white">F1 Fantasy</div>
            <div className="text-yellow-400 font-semibold">Início do Qualifying</div>
            <div className="text-gray-400 text-xs">Normalmente sábado</div>
          </div>
          <div className="bg-black/40 rounded-xl p-4 space-y-1">
            <div className="text-2xl">🔮</div>
            <div className="font-bold text-white">F1 Predict</div>
            <div className="text-yellow-400 font-semibold">Início do Qualifying</div>
            <div className="text-gray-400 text-xs">Normalmente sábado</div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center space-y-3 pb-4">
        <p className="text-gray-400 text-sm">Dúvidas? Fala com o administrador da liga.</p>
        <a href="/" className="inline-block bg-f1red text-white font-bold px-8 py-3 rounded-xl hover:bg-red-700 transition-colors">
          Ir para o Início
        </a>
      </div>

    </main>
  )
}
