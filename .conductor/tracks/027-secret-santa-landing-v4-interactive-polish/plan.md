# Track 027: Polish Interativo da Landing Page Amigo Secreto (Card Stack Framer Motion, Trilha em S, Carrossel Snap e Hero Toggle)

## 🎯 Objetivo
Implementar as 5 melhorias visuais e ergonômicas aprovadas na Landing Page do Amigo Secreto (`src/pages/SecretSantaLanding.tsx`):

1. **Consistência Visual no Hero (Toggle Interativo de Mockup):**
   - Permitir ao usuário alternar entre o mockup do *Link com PIN no WhatsApp* (modo Com Cadastro / Grupo) e o mockup do *Envelope Lacrado com Selo de Cera* (modo Sem Cadastro / Sorteador Relâmpago).
   - Garantir fidelidade pixel-perfect às telas reais que o usuário encontrará (`SecretSantaJoin.tsx` e `QuickSecretSantaEnvelope.tsx`).

2. **"O Grande Diferencial" (Pilha de Cartas Interativa / Swipe Deck):**
   - Substituir o grid estático de 2 colunas por um baralho empilhado dinâmico usando `framer-motion`.
   - Suporte a arrasto lateral (`drag="x"` com rotação e saída elástica da carta de cima).
   - Botões táteis de navegação `[ < ] [ > ]`, indicador de carta atual (`1 de 2`) e dica amigável *"Arraste a carta ou use as setas"*.

3. **"Como Funciona" (Horizontalidade & Economia de Scroll):**
   - No Desktop: 3 cards alinhados horizontalmente com setas conectoras animadas/estilizadas.
   - No Mobile: Carrossel horizontal snap (`overflow-x-auto snap-x snap-mandatory scrollbar-none`) com indicadores de página `[ • o o ]` para eliminar o scroll vertical infinito.

4. **"Por que abandonar o papelzinho" (Trilha Sinuosa em "S"):**
   - Substituir os blocos 2x2 por uma jornada conectada por uma linha em "S" com nós cronológicos numerados (1. Zero spoilers, 2. Lista de desejos, 3. Troca de presentes integrada à festa, 4. 100% gratuito sem complicação).

5. **Correção do Rodapé CTA & Truncamento de Botão:**
   - Corrigir a diagramação da seção *"Pronto para acabar com a bagunça?"*.
   - Eliminar truncamento do botão `"CRIAR MEU AMIGO SECRETO GRÁTIS"` no celular (que aparecia como `"criar meu amigo secreto g"` em telas de 390px/360px), adotando quebra de linha harmoniosa e padding ergonômico.

---

## 📋 Checklist de Implementação
- [x] 1. Hero: Toggle interativo entre Mockup "Link com PIN" e "Envelope Lacrado" com tabs estilizadas
- [x] 2. Diferenciais: Componente `InteractiveCardDeck` com `framer-motion` (drag gesture, rotação e controles táteis)
- [x] 3. Como Funciona: Layout horizontal com setas no desktop e carrossel snap no mobile
- [x] 4. Por que abandonar o papelzinho: Trilha sinuosa em "S" com SVG/linha tracejada e nós numerados
- [x] 5. Rodapé: Correção da diagramação e responsividade do botão sem corte de texto
- [x] 6. Build & Validação TypeScript (`npm run build`)
- [x] 7. Teste de tela mobile real com Playwright e captura de screenshots
- [x] 8. Commit e Push para branch `main` (deploy Vercel)
