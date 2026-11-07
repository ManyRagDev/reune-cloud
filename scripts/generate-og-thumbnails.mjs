import { writeFileSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const brainDir = '/home/emanuel/.gemini/antigravity/brain/6a8da887-4788-46a2-8bf5-1fb9c1b01436';

mkdirSync(brainDir, { recursive: true });

// =============================================================================
// 1. REUNE GERAL (og-reune.png) - 1200 x 630
// =============================================================================
const svgReune = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dotPattern" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="3" cy="3" r="2" fill="#E2E8F0"/>
    </pattern>
    <filter id="shadowHeavy" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="10" dy="10" stdDeviation="0" flood-color="#000000"/>
    </filter>
    <filter id="shadowMed" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#000000"/>
    </filter>
    <filter id="shadowSmall" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="4" dy="4" stdDeviation="0" flood-color="#000000"/>
    </filter>
  </defs>

  <!-- Fundo Neobrutalist Quente -->
  <rect width="1200" height="630" fill="#FFFDF5"/>
  <rect width="1200" height="630" fill="url(#dotPattern)"/>

  <!-- Borda Externa Robusta -->
  <rect x="14" y="14" width="1172" height="602" rx="24" fill="none" stroke="#000000" stroke-width="8"/>

  <!-- Badge Superior Esquerdo -->
  <g transform="translate(60, 48)">
    <rect width="320" height="46" rx="8" fill="#FFE500" stroke="#000000" stroke-width="4" filter="url(#shadowSmall)"/>
    <text x="160" y="30" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#000000" text-anchor="middle" letter-spacing="1.5">⚡ REUNE • O SUPER-APP SOCIAL</text>
  </g>

  <!-- LADO ESQUERDO: TEXTOS E BENEFÍCIOS -->
  <g transform="translate(60, 140)">
    <!-- Título Principal -->
    <text x="0" y="54" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="64" fill="#000000" letter-spacing="-1">Churrasco ou Festa?</text>
    
    <!-- Tarja de Destaque do Título -->
    <g transform="translate(0, 78)">
      <rect width="520" height="74" rx="10" fill="#FFE500" stroke="#000000" stroke-width="5" filter="url(#shadowMed)"/>
      <text x="24" y="52" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="52" fill="#000000" letter-spacing="-1">Zero caos. Com IA.</text>
    </g>

    <!-- Subtítulo Explicativo -->
    <text x="0" y="200" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="24" fill="#374151">Lista de compras calculada automaticamente,</text>
    <text x="0" y="235" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="24" fill="#374151">divisão de custos justa e convites no WhatsApp.</text>

    <!-- Badges de Benefícios -->
    <g transform="translate(0, 280)">
      <!-- Badge 1 -->
      <rect x="0" y="0" width="150" height="44" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="3" filter="url(#shadowSmall)"/>
      <text x="75" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="#000000" text-anchor="middle">✓ Sem Planilhas</text>

      <!-- Badge 2 -->
      <rect x="166" y="0" width="168" height="44" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="3" filter="url(#shadowSmall)"/>
      <text x="250" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="#000000" text-anchor="middle">🤖 Assistente Une.AI</text>

      <!-- Badge 3 -->
      <rect x="350" y="0" width="140" height="44" rx="8" fill="#22C55E" stroke="#000000" stroke-width="3" filter="url(#shadowSmall)"/>
      <text x="420" y="28" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" fill="#FFFFFF" text-anchor="middle">100% GRÁTIS</text>
    </g>

    <!-- URL no rodapé -->
    <g transform="translate(0, 368)">
      <rect width="250" height="40" rx="8" fill="#000000"/>
      <text x="125" y="26" font-family="monospace, monospace" font-weight="800" font-size="18" fill="#FFE500" text-anchor="middle">reuneapp.com.br ➜</text>
    </g>
  </g>

  <!-- LADO DIREITO: CARD DE EVENTO MOCKUP NEOBRUTALIST -->
  <g transform="translate(680, 85) rotate(2)">
    <!-- Card Principal -->
    <rect width="440" height="460" rx="20" fill="#FFFFFF" stroke="#000000" stroke-width="6" filter="url(#shadowHeavy)"/>
    
    <!-- Topo do Card -->
    <rect x="0" y="0" width="440" height="85" rx="14" fill="#FF6B4A" stroke="#000000" stroke-width="6"/>
    <text x="24" y="42" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#FFFFFF">🥩 Churrasco da Galera</text>
    <text x="24" y="68" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#FFEFE9">SÁBADO • 24 PESSOAS CONFIRMADAS</text>

    <!-- Valor por pessoa destacado -->
    <g transform="translate(24, 110)">
      <rect width="392" height="68" rx="12" fill="#FEF3C7" stroke="#000000" stroke-width="3"/>
      <text x="20" y="32" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="14" fill="#92400E">CUSTO ESTIMADO POR PESSOA</text>
      <text x="20" y="58" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#000000">R$ 42,50</text>
      <text x="370" y="48" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="28" fill="#059669" text-anchor="end">✓ Justo</text>
    </g>

    <!-- Itens calculados com IA -->
    <g transform="translate(28, 205)">
      <text x="0" y="16" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="13" fill="#6B7280" letter-spacing="1">LISTA SUGERIDA PELA UNE.AI:</text>
      
      <g transform="translate(0, 32)">
        <circle cx="8" cy="8" r="6" fill="#22C55E"/>
        <text x="24" y="13" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#111827">Picanha, Alcatra &amp; Linguiça (9,6 kg)</text>
      </g>
      <g transform="translate(0, 64)">
        <circle cx="8" cy="8" r="6" fill="#22C55E"/>
        <text x="24" y="13" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#111827">Cerveja &amp; Bebidas (48 latas)</text>
      </g>
      <g transform="translate(0, 96)">
        <circle cx="8" cy="8" r="6" fill="#22C55E"/>
        <text x="24" y="13" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="16" fill="#111827">Carvão, Farofa &amp; Gelo Especial</text>
      </g>
    </g>

    <!-- Botão de Ação WhatsApp no Card -->
    <g transform="translate(24, 375)">
      <rect width="392" height="60" rx="14" fill="#25D366" stroke="#000000" stroke-width="4" filter="url(#shadowSmall)"/>
      <text x="196" y="38" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="20" fill="#000000" text-anchor="middle">📲 Compartilhar no WhatsApp</text>
    </g>
  </g>
</svg>`;

// =============================================================================
// 2. AMIGO SECRETO (og-amigo-secreto.png) - 1200 x 630
// =============================================================================
const svgAmigoSecreto = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="confettiPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
      <circle cx="15" cy="15" r="3" fill="#E11D48" opacity="0.25"/>
      <circle cx="65" cy="25" r="4" fill="#F59E0B" opacity="0.3"/>
      <rect x="40" y="55" width="6" height="6" rx="2" fill="#10B981" opacity="0.25" transform="rotate(25 43 58)"/>
      <circle cx="20" cy="65" r="2.5" fill="#3B82F6" opacity="0.25"/>
    </pattern>
    <filter id="shadowHeavy" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="12" dy="12" stdDeviation="0" flood-color="#000000"/>
    </filter>
    <filter id="shadowMed" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#000000"/>
    </filter>
    <filter id="shadowSmall" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="4" dy="4" stdDeviation="0" flood-color="#000000"/>
    </filter>
  </defs>

  <!-- Fundo Festivo Quente -->
  <rect width="1200" height="630" fill="#FFFBEB"/>
  <rect width="1200" height="630" fill="url(#confettiPattern)"/>

  <!-- Borda Externa Robusta -->
  <rect x="14" y="14" width="1172" height="602" rx="24" fill="none" stroke="#000000" stroke-width="8"/>

  <!-- Badge Superior Esquerdo -->
  <g transform="translate(60, 48)">
    <rect width="360" height="46" rx="8" fill="#FEE2E2" stroke="#000000" stroke-width="4" filter="url(#shadowSmall)"/>
    <text x="180" y="30" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#E11D48" text-anchor="middle" letter-spacing="1.5">🎁 AMIGO SECRETO • REUNE</text>
  </g>

  <!-- LADO ESQUERDO: TEXTOS E BENEFÍCIOS -->
  <g transform="translate(60, 130)">
    <!-- Título Principal -->
    <text x="0" y="52" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="62" fill="#000000" letter-spacing="-1">Amigo Secreto</text>
    <text x="0" y="116" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="62" fill="#000000" letter-spacing="-1">pelo WhatsApp!</text>
    
    <!-- Tarja de Destaque Perfeitamente Alinhada -->
    <g transform="translate(0, 142)">
      <rect width="570" height="62" rx="10" fill="#E11D48" stroke="#000000" stroke-width="4" filter="url(#shadowMed)"/>
      <text x="285" y="39" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="25" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle" letter-spacing="1">⚡ CONVIDE E SORTEIE PELO WHATSAPP</text>
    </g>

    <!-- Subtítulo Explicativo -->
    <text x="0" y="245" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="24" fill="#374151">Convide seus amigos pelo WhatsApp e tire</text>
    <text x="0" y="278" font-family="system-ui, -apple-system, sans-serif" font-weight="600" font-size="24" fill="#374151">os nomes com envelopes digitais lacrados!</text>

    <!-- 3 Badges Perfeitamente Uniformes e Alinhados -->
    <g transform="translate(0, 325)">
      <!-- Badge 1: Envelopes -->
      <g transform="translate(0, 0)">
        <rect width="180" height="46" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="3" filter="url(#shadowSmall)"/>
        <text x="90" y="23" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="#000000" text-anchor="middle" dominant-baseline="middle">✉️ Envelopes Vips</text>
      </g>

      <!-- Badge 2: Anti-Espião -->
      <g transform="translate(195, 0)">
        <rect width="180" height="46" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="3" filter="url(#shadowSmall)"/>
        <text x="90" y="23" font-family="system-ui, -apple-system, sans-serif" font-weight="800" font-size="16" fill="#000000" text-anchor="middle" dominant-baseline="middle">🔒 Selo Anti-Espião</text>
      </g>

      <!-- Badge 3: 100% Grátis -->
      <g transform="translate(390, 0)">
        <rect width="180" height="46" rx="8" fill="#22C55E" stroke="#000000" stroke-width="3" filter="url(#shadowSmall)"/>
        <text x="90" y="23" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" fill="#000000" text-anchor="middle" dominant-baseline="middle">✨ 100% GRÁTIS</text>
      </g>
    </g>

    <!-- URL no rodapé -->
    <g transform="translate(0, 410)">
      <rect width="360" height="42" rx="8" fill="#000000"/>
      <text x="180" y="22" font-family="monospace, monospace" font-weight="800" font-size="17" fill="#FFE500" text-anchor="middle" dominant-baseline="middle">reuneapp.com.br/amigo-secreto ➜</text>
    </g>
  </g>

  <!-- LADO DIREITO: O GRANDE ENVELOPE LACRADO COM SELO DE CERA -->
  <g transform="translate(680, 115)">
    <!-- Envelope Base -->
    <g filter="url(#shadowHeavy)" transform="rotate(-3 220 200)">
      <!-- Corpo Amarelo Claro -->
      <rect x="0" y="0" width="430" height="320" rx="18" fill="#FEF08A" stroke="#000000" stroke-width="6"/>

      <!-- Linhas de Dobra do Envelope -->
      <path d="M 0 320 L 215 160 L 430 320" fill="none" stroke="#EAB308" stroke-width="4"/>
      <path d="M 0 0 L 215 170 L 430 0" fill="#FDE047" stroke="#000000" stroke-width="5"/>

      <!-- Carimbo de Cera Vermelha Central -->
      <g transform="translate(215, 170)">
        <!-- Manchas de cera irregular -->
        <circle cx="0" cy="0" r="48" fill="#DC2626" stroke="#000000" stroke-width="4"/>
        <circle cx="0" cy="0" r="38" fill="#B91C1C"/>
        <!-- Ícone / Texto de Lacre -->
        <text x="0" y="8" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="#FEF2F2" text-anchor="middle">🎁</text>
      </g>

      <!-- Etiqueta no envelope -->
      <g transform="translate(30, 240)">
        <rect width="210" height="48" rx="8" fill="#FFFFFF" stroke="#000000" stroke-width="3" filter="url(#shadowSmall)"/>
        <text x="105" y="30" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="16" fill="#000000" text-anchor="middle">PARA: SEU AMIGO ✨</text>
      </g>
    </g>

    <!-- Tag Flutuante "Toque para Romper o Lacre" -->
    <g transform="translate(60, 375)">
      <rect width="320" height="54" rx="14" fill="#000000" stroke="#FFE500" stroke-width="3" filter="url(#shadowMed)"/>
      <text x="160" y="34" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="18" fill="#FFE500" text-anchor="middle">✉️ Toque para Romper o Lacre!</text>
    </g>

    <!-- Emojis e Detalhes Decorativos -->
    <text x="10" y="40" font-size="38">✨</text>
    <text x="400" y="45" font-size="38">🎊</text>
    <text x="390" y="380" font-size="34">🎄</text>
  </g>
</svg>`;

console.log('Rendering SVGs with Resvg...');

const resvg1 = new Resvg(svgReune, { fitTo: { mode: 'width', value: 1200 } });
const pngData1 = resvg1.render();
const pngBuffer1 = pngData1.asPng();

const resvg2 = new Resvg(svgAmigoSecreto, { fitTo: { mode: 'width', value: 1200 } });
const pngData2 = resvg2.render();
const pngBuffer2 = pngData2.asPng();

// Salvar no diretório de artefatos para o usuário visualizar
const pathReuneBrain = join(brainDir, 'preview-og-reune.png');
const pathAmigoBrain = join(brainDir, 'preview-og-amigo-secreto.png');

writeFileSync(pathReuneBrain, pngBuffer1);
writeFileSync(pathAmigoBrain, pngBuffer2);

// Salvar diretamente na pasta public para o site e Open Graph
const publicDir = join(root, 'public');
const pathOgImage = join(publicDir, 'og-image.png');
const pathOgAmigo = join(publicDir, 'og-amigo-secreto.png');
const pathPreviewReune = join(publicDir, 'preview-og-reune.png');
const pathPreviewAmigo = join(publicDir, 'preview-og-amigo-secreto.png');

writeFileSync(pathOgImage, pngBuffer1);
writeFileSync(pathPreviewReune, pngBuffer1);

writeFileSync(pathOgAmigo, pngBuffer2);
writeFileSync(pathPreviewAmigo, pngBuffer2);

console.log('Saved to Public:');
console.log(' - ' + pathOgImage);
console.log(' - ' + pathOgAmigo);
console.log('Saved to Artifacts:');
console.log(' - ' + pathReuneBrain);
console.log(' - ' + pathAmigoBrain);
