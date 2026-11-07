# Track 024: Redesign das Thumbnails de Prévia do WhatsApp/Redes (ReUNE Geral & Amigo Secreto)

## 🎯 Objetivo
Substituir a thumbnail antiga/legada (estilo terminal neon dividido ao meio com baixa legibilidade) por duas imagens dedicadas de altíssima conversão e legibilidade mobile no WhatsApp:
1. **ReUNE Geral (`og-image.png`):** Identidade Neobrutalism moderna, acolhedora, foco em organização de churrascos/eventos sem caos com IA.
2. **Amigo Secreto (`og-amigo-secreto.png`):** Visual temático festivo com envelope digital lacrado com cera vermelha, confetes, foco em "Sorteio Rápido pelo WhatsApp • Sem Cadastro".

---

## 📐 Especificações Técnicas
- **Dimensões:** 1200 × 630 px (proporção 1.91:1 padrão do WhatsApp e Open Graph).
- **Tipografia:** Space Grotesk / Arial Black / Permanent Marker (textos grandes com contraste máximo para leitura em telas de 300px no WhatsApp).
- **Renderização:** Script automatizado com Playwright Chromium para renderização pixel-perfect com suporte nativo a webfonts, sombras Neobrutalism (`6px 6px 0px #000`) e emojis.
- **Validação Prévia:** Geração das imagens no diretório de artefatos para aprovação visual pelo usuário antes de qualquer subida para a Vercel/GitHub.

---

## 📋 Fases de Execução

### Fase 1: Criação dos Modelos Visuais HTML/CSS
- Criar templates HTML/CSS de 1200x630 para cada uma das duas imagens com foco em alto contraste e hierarquia visual clara.

### Fase 2: Renderização em PNG
- Executar script via Playwright headless para capturar os renders em alta definição (`scaleFactor: 1` para exatos 1200x630).

### Fase 3: Apresentação para Aprovação do Usuário
- Copiar as imagens geradas para a pasta de artefatos e exibi-las inline com comparativo no chat.

### Fase 4: Integração na Aplicação e Vercel (após aprovação)
- Salvar imagens em `public/`.
- Configurar rotas/meta tags dedicadas no `index.html` e `vercel.json` (ou páginas dedicadas para crawler).
- Executar build e push.
