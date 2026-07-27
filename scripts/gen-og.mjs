/**
 * Gera public/og-image.png — imagem de preview para WhatsApp/redes sociais.
 * Usa o design system V2 do ReUNE (neobrutalism, acid lime, Space Grotesk).
 *
 * Uso:  npm run gen-og
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Embute o logo como base64 direto no SVG
const logoBase64 = readFileSync(join(root, 'public', 'reune-logo.png')).toString('base64');
const logoSrc = `data:image/png;base64,${logoBase64}`;

// ─── Design: 1200 × 630 ───────────────────────────────────────────────────
// Painel esquerdo (preto, 560px) → logo + "REUNE" em acid lime
// Painel direito (newsprint, 632px) → tagline + badge + URL
// Borda externa: 8px sólida preta
// ─────────────────────────────────────────────────────────────────────────

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">

  <!-- Borda preta (fundo) -->
  <rect width="1200" height="630" fill="#000000"/>

  <!-- Painel esquerdo: preto profundo -->
  <rect x="8" y="8" width="552" height="614" fill="#0D0D0D"/>

  <!-- Painel direito: newsprint -->
  <rect x="560" y="8" width="632" height="614" fill="#F2F0E9"/>

  <!-- Linha divisória extra (sutileza brutalista) -->
  <rect x="556" y="8" width="4" height="614" fill="#CCFF00"/>

  <!-- ── PAINEL ESQUERDO ─────────────────────────────────────── -->

  <!-- Logo centralizado: centro x=284, y=230 -->
  <image x="164" y="110" width="240" height="240"
         href="${logoSrc}"
         preserveAspectRatio="xMidYMid meet"/>

  <!-- "REUNE" em acid lime abaixo do logo -->
  <text x="284" y="450"
        font-family="Arial Black, Impact, sans-serif"
        font-weight="900"
        font-size="84"
        fill="#CCFF00"
        text-anchor="middle"
        letter-spacing="14">REUNE</text>

  <!-- Linha decorativa acid lime -->
  <rect x="110" y="480" width="348" height="6" fill="#CCFF00" opacity="0.4"/>

  <!-- Subtítulo esquerdo -->
  <text x="284" y="525"
        font-family="Courier New, Courier, monospace"
        font-weight="400"
        font-size="18"
        fill="#CCFF00"
        text-anchor="middle"
        opacity="0.7"
        letter-spacing="3">ORGANIZE COM IA</text>

  <!-- ── PAINEL DIREITO ─────────────────────────────────────── -->

  <!-- Tagline: 4 linhas, fonte bold grande -->
  <text x="610" y="175"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="700"
        font-size="54"
        fill="#000000">Organize</text>

  <text x="610" y="248"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="700"
        font-size="54"
        fill="#000000">eventos com</text>

  <text x="610" y="321"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="700"
        font-size="54"
        fill="#000000">leveza e</text>

  <text x="610" y="394"
        font-family="Arial, Helvetica, sans-serif"
        font-weight="700"
        font-size="54"
        fill="#000000">inteligência.</text>

  <!-- Badge "POWERED BY IA" -->
  <rect x="610" y="435" width="248" height="46" fill="#CCFF00"/>
  <rect x="610" y="435" width="248" height="46" fill="none" stroke="#000000" stroke-width="3"/>
  <text x="734" y="465"
        font-family="Courier New, Courier, monospace"
        font-weight="700"
        font-size="17"
        fill="#000000"
        text-anchor="middle"
        letter-spacing="1">POWERED BY IA</text>

  <!-- URL -->
  <text x="610" y="565"
        font-family="Courier New, Courier, monospace"
        font-size="22"
        fill="#555555"
        letter-spacing="1">reuneapp.com.br</text>

</svg>`;

// ─── Renderiza SVG → PNG via resvg ────────────────────────────────────────

try {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
    font: { loadSystemFonts: true },
  });

  const rendered = resvg.render();
  const png = rendered.asPng();

  writeFileSync(join(root, 'public', 'og-image.png'), png);
  console.log('✅ Gerado: public/og-image.png  (1200 × 630)');
} catch (err) {
  console.error('❌ Erro ao gerar imagem:', err.message);
  process.exit(1);
}
