# Guia "Como ler a Telemetria" (PDF + vídeo)

Fontes: `docs/guia/guia-telemetria.html` (PDF A4, 11 páginas) e `docs/guia/video.html` (vídeo 1280x720, animação determinística por `render(t)`).
Saída servida aos membros: `public/guia/guia-telemetria.pdf` e `public/guia/como-ler-a-telemetria.mp4` (cartão na página /telemetria).

Ferramentas (fora do repo, em `%TEMP%\promo_tools`): `puppeteer-core` e `ffmpeg-static` (npm). Os scripts `render.mjs` e `pdf.mjs` correm lá.

- PDF: `node pdf.mjs` (espera pelo ajuste automático do tamanho de cada página)
- Fotogramas do vídeo: `node render.mjs video 20` -> `out/frames/f%05d.jpg`
- Codificar: `ffmpeg -framerate 20 -i f%05d.jpg -c:v libx264 -pix_fmt yuv420p -crf 26 -movflags +faststart como-ler-a-telemetria.mp4`
- Conferir: `node render.mjs pages` (PNG de cada página + relatório de excesso) e `node render.mjs shots 10,40,90` (stills do vídeo)

Quando mudares um painel da telemetria, actualiza o mock correspondente nos dois HTML e volta a gerar.
