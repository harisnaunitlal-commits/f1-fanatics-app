# Beira F1 Fanatics 2026 — Guia de Setup

## Pré-requisitos
- Node.js 18+ (https://nodejs.org)
- Conta Supabase (https://supabase.com)
- Conta Vercel (https://vercel.com)

## 1. Instalar dependências

```bash
npm install
```

## 2. Configurar Supabase

1. Cria um novo projecto em supabase.com
2. Vai a **SQL Editor** → corre o ficheiro `supabase/schema.sql`
3. Depois corre `supabase/seed.sql` (dados R01-R03 + membros + calendário)
4. Copia as chaves do projecto: Settings → API

## 3. Variáveis de ambiente

Copia `.env.local.example` para `.env.local` e preenche:

```bash
cp .env.local.example .env.local
```

Edita `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  (só para operações admin)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Correr em desenvolvimento

```bash
npm run dev
```

Abre http://localhost:3000

## 5. Deploy Vercel

```bash
npx vercel deploy
```

Adiciona as variáveis de ambiente no dashboard Vercel.

## 6. Configurar admin

No Supabase SQL Editor, define o teu email como admin:

```sql
UPDATE members SET is_admin = true WHERE email = 'haris.naunitlal@gmail.com';
```

## 7. Fluxo para o GP Miami (R04)

1. Abre http://app.beiraf1fanatics.com/predict/4 (ou o URL de deploy)
2. Partilha o link no WhatsApp — os 120 membros podem registar-se e submeter
3. Após a corrida (1 Mai): vai a /admin → Respostas → GP Miami → insere resultados
4. /admin → Calcular pts → Preview → Confirmar
5. O ranking actualiza automaticamente

## Estrutura do projecto

```
app/
  page.tsx              — Página inicial (próximo GP + top 3 + calendário)
  auth/login/           — Login magic link
  auth/callback/        — Callback Supabase auth
  register/             — Registo/edição de perfil
  predict/              — Lista de GPs para prever
  predict/[gpId]/       — Formulário de previsões (15 perguntas)
  ranking/              — Ranking global
  ranking/play/         — Ranking F1 Play com ✓/✗
  ranking/fantasy/      — Ranking F1 Fantasy
  ranking/predict/      — Ranking F1 Predict
  admin/                — Dashboard admin
  admin/answers/[gpId]/ — Inserir respostas corretas
  admin/scores/[gpId]/  — Calcular e confirmar pontuações
  admin/fantasy/        — Importar pontos Fantasy
  admin/predict-scores/ — Importar pontos Predict
  admin/members/        — Gerir membros
  profile/              — Perfil do utilizador

lib/
  supabase/client.ts    — Cliente browser
  supabase/server.ts    — Cliente server
  supabase/types.ts     — Types TypeScript + constantes pilotos/equipas
  scoring.ts            — Motor de pontuação (calculatePlayScore, etc.)

supabase/
  schema.sql            — Schema completo + RLS
  seed.sql              — Dados R01-R03 + 27 membros + calendário 2026
```

## Regras de negócio importantes

- Deadline F1 Play = 1 segundo antes da corrida (enforced no servidor)
- Cada membro pode editar até ao deadline — última submissão válida
- P9 First to Retire = 3 pts | P10 DOTD = 2 pts | resto = 1 pt
- Máximo 20 pts por GP
- Global Score = (play_gpts + fantasy_gpts + predict_gpts) / 3 — sempre dividir por 3
- Ausência numa liga = 0 gpts (não exclui do denominador)
- F1 Predict: usar sempre valor acumulado real do site (nunca calcular deltas)
