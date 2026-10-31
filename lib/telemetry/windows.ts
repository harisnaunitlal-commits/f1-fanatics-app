// Catalogue of the admin's chromeless telemetry windows (/janela/<id>). Shared by the launcher (/admin/janelas),
// the window page and the Windows launcher script, so there is one list of ids, titles and default sizes.

export type WindowGroup = 'sessao' | 'classificacao' | 'estrategia' | 'pista' | 'piloto'

export interface WindowDef {
  id: string
  group: WindowGroup
  icon: string
  title: string
  desc: string
  w: number          // default popup size (px)
  h: number
  needsDrivers?: 1 | 2   // uses the drivers picked in the launcher (?d=VER,LEC)
  race?: boolean     // only has data in race / sprint sessions
}

export const WINDOW_GROUPS: Record<WindowGroup, string> = {
  sessao: 'Sessão e direcção de corrida',
  classificacao: 'Classificação e campeonato',
  estrategia: 'Estratégia e pneus',
  pista: 'Pista e ultrapassagens',
  piloto: 'Piloto a piloto',
}

export const WINDOWS: WindowDef[] = [
  // ── Sessão ──
  { id: 'estado', group: 'sessao', icon: '🚦', title: 'Estado da pista', desc: 'Bandeira, SC/VSC, volta e relógio da sessão. Fica vermelho/laranja/amarelo quando há neutralização.', w: 760, h: 300 },
  { id: 'alerta', group: 'sessao', icon: '🚨', title: 'Alerta de bandeira (ecrã inteiro)', desc: 'O ecrã todo muda de cor: vermelho, Safety Car, VSC, amarelo ou xadrez. Verde discreto quando está tudo normal.', w: 520, h: 300 },
  { id: 'direccao', group: 'sessao', icon: '🏁', title: 'Direcção de corrida', desc: 'Todas as mensagens oficiais: bandeiras, SC, investigações, tempos anulados.', w: 620, h: 800 },
  { id: 'penalizacoes', group: 'sessao', icon: '⚖️', title: 'Penalizações e incidentes', desc: 'Só penalizações, investigações e avisos.', w: 560, h: 520 },
  { id: 'meteo', group: 'sessao', icon: '🌦️', title: 'Meteorologia', desc: 'Ar, pista (com tendência), humidade, vento e chuva.', w: 560, h: 280 },
  { id: 'radio', group: 'sessao', icon: '📻', title: 'Rádios EN + PT', desc: 'Rádios das equipas transcritos e traduzidos (usa a API, ligue na mesa de controlo).', w: 620, h: 800 },

  // ── Classificação ──
  { id: 'torre', group: 'classificacao', icon: '🏆', title: 'Torre de tempos (grande)', desc: 'Posição, gap ao líder, intervalo, pneu e paragens. Letra grande para ver de longe.', w: 560, h: 1000, race: true },
  { id: 'tabela', group: 'classificacao', icon: '📋', title: 'Tabela completa da sessão', desc: 'Treinos/qualificação: melhor tempo, gap, sectores, pneu. Corrida: torre completa.', w: 900, h: 900 },
  { id: 'sectores', group: 'classificacao', icon: '🎯', title: 'Sectores (roxo/verde/amarelo)', desc: 'S1, S2, S3 e última volta de todos os pilotos, com as cores oficiais.', w: 760, h: 900 },
  { id: 'velocidades', group: 'classificacao', icon: '💨', title: 'Velocidade máxima (speed trap)', desc: 'Ranking de todos os pilotos pela velocidade máxima.', w: 460, h: 800 },
  { id: 'ganhos', group: 'classificacao', icon: '📈', title: 'Posições ganhas e perdidas', desc: 'Quem sobe e quem desce desde o início da corrida.', w: 460, h: 800, race: true },
  { id: 'campeonato', group: 'classificacao', icon: '🏅', title: 'Campeonato em directo', desc: 'Pilotos e equipas: pontos e posição se a corrida acabasse agora.', w: 760, h: 900, race: true },
  { id: 'play', group: 'classificacao', icon: '🎮', title: 'F1 Play em directo', desc: 'Os teus pontos provisórios e a classificação dos membros.', w: 620, h: 900 },

  // ── Estratégia ──
  { id: 'janela-box', group: 'estrategia', icon: '🛞', title: 'Janela de paragem (top 10)', desc: 'Quando cada piloto deve parar, com Safety Car e voltas no pneu.', w: 900, h: 560, race: true },
  { id: 'stints', group: 'estrategia', icon: '🧩', title: 'Pneus e stints (todos)', desc: 'Linha do tempo de pneus de todos os pilotos, com degradação por volta.', w: 1000, h: 800 },
  { id: 'undercut', group: 'estrategia', icon: '⚔️', title: 'Undercut e perda na box', desc: 'Janelas de undercut abertas e quanto custa parar agora.', w: 640, h: 520, race: true },
  { id: 'safety-car', group: 'estrategia', icon: '🚗', title: 'Safety Car — o que deu', desc: 'Períodos de SC/VSC/bandeira vermelha e o efeito nas paragens.', w: 760, h: 560, race: true },
  { id: 'ritmo-stint', group: 'estrategia', icon: '⏱️', title: 'Ritmo por stint (top 10)', desc: 'O que cada mudança de pneu fez ao ritmo, com e sem combustível.', w: 900, h: 560, race: true },
  { id: 'se-parasse', group: 'estrategia', icon: '🎯', title: 'Se parasse agora', desc: 'Onde cada piloto (destacados, ou top 8) voltaria à pista.', w: 900, h: 520, race: true },
  { id: 'boxes', group: 'estrategia', icon: '🔧', title: 'Registo de paragens', desc: 'Todas as paragens: volta, tempo na pit lane, tempo parado e pneus trocados.', w: 700, h: 800, race: true },
  { id: 'ritmo', group: 'estrategia', icon: '📊', title: 'Ritmo e degradação', desc: 'Últimas 5 voltas com delta, pneu e degradação (corrida) ou análise de voltas (treinos).', w: 900, h: 900 },
  { id: 'tempos-volta', group: 'estrategia', icon: '📉', title: 'Tempos por volta', desc: 'Gráfico de tempos por volta dos pilotos escolhidos (até 4).', w: 900, h: 420, needsDrivers: 2 },
  { id: 'pneus-fds', group: 'estrategia', icon: '🛞', title: 'Pneus do fim-de-semana', desc: 'O que cada piloto já usou nas sessões anteriores e o que lhe resta.', w: 900, h: 800 },

  // ── Pista ──
  { id: 'mapa', group: 'pista', icon: '🗺️', title: 'Mapa da pista', desc: 'Os carros em tempo real sobre o traçado.', w: 760, h: 760 },
  { id: 'posicoes', group: 'pista', icon: '📈', title: 'Gráfico de posições', desc: 'A corrida volta a volta, com os teus pilotos destacados.', w: 1000, h: 560, race: true },
  { id: 'ultrapassagens', group: 'pista', icon: '🔀', title: 'Ultrapassagens (com pneus)', desc: 'Quem passou quem, com o pneu e a idade de cada um.', w: 620, h: 800, race: true },
  { id: 'limites', group: 'pista', icon: '🚧', title: 'Track limits', desc: 'Infracções por piloto, aviso e penalização.', w: 760, h: 700, race: true },

  // ── Piloto ──
  { id: 'comparar', group: 'piloto', icon: '🆚', title: 'Comparar 2 pilotos', desc: 'Velocidade, acelerador, travão e mudança, na melhor ou última volta.', w: 1000, h: 800, needsDrivers: 2 },
  { id: 'ficha', group: 'piloto', icon: '🪪', title: 'Ficha do piloto', desc: 'Tudo de um piloto: posição, gaps, pneu, voltas, sectores, paragens, previsão.', w: 520, h: 760, needsDrivers: 1 },
]

export const windowById = (id: string): WindowDef | undefined => WINDOWS.find(w => w.id === id)

// Where a window goes on a screen (used by the Windows launcher script; the script reads the real monitors itself).
export const SLOTS: { id: string; label: string }[] = [
  { id: 'full', label: 'Ecrã inteiro' },
  { id: 'left', label: 'Metade esquerda' },
  { id: 'right', label: 'Metade direita' },
  { id: 'top', label: 'Metade de cima' },
  { id: 'bottom', label: 'Metade de baixo' },
  { id: 'tl', label: 'Canto sup. esquerdo' },
  { id: 'tr', label: 'Canto sup. direito' },
  { id: 'bl', label: 'Canto inf. esquerdo' },
  { id: 'br', label: 'Canto inf. direito' },
]
