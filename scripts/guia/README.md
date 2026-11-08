# Guia "Como ler a Telemetria" (PDF + vídeo)

**Regra: o PDF e o vídeo têm de ser actualizados SEMPRE os dois, a cada fim-de-semana de GP em que a telemetria teve upgrades.**

Fontes: `docs/guia/guia-telemetria.html` (PDF A4, 11 páginas) e `docs/guia/video.html` (vídeo 1280x720, animação determinística por `render(t)`).
Saída servida aos membros: `public/guia/guia-telemetria.pdf` e `public/guia/como-ler-a-telemetria.mp4` (cartão no topo de /telemetria).

## Depois de um upgrade da telemetria
1. Actualiza os mocks e os textos dos painéis que mudaram nos DOIS HTML (o PDF explica, o vídeo mostra: `SCENES`/`TAKES` em `video.html`).
2. `node scripts/guia/build.mjs` (PDF + vídeo, ~12 min) ou `node scripts/guia/build.mjs pdf` (só PDF). Instala sozinho o `puppeteer-core` e o `ffmpeg-static` em `%TEMP%\promo_tools`.
3. Sobe `GUIA_VERSION` em `components/telemetry/GuiaTelemetria.tsx` (data e GP): mostra aos membros a data da actualização e força os browsers a buscar os ficheiros novos.
4. Commit, push e `npx vercel --prod --yes`.

## Conferir antes de publicar
`node render.mjs pages` (PNG de cada página + relatório de excesso) e `node render.mjs shots 10,40,90` (stills do vídeo), a correr a partir de `%TEMP%\promo_tools` (o `build.mjs` copia os scripts para lá).
