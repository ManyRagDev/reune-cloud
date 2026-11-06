# Track 023 — Otimização Mobile-First, Micro-Interações e Feedback Visual Fluido

## Objetivo
Transformar a experiência do ReUNE e do Amigo Secreto em uma interface **Mobile-First** exemplar: altamente responsiva em celulares pequenos (360px a 430px), com ergonomia para o polegar (touch targets >= 48px), inputs otimizados para teclados virtuais (`inputMode="numeric"`, `enterKeyHint`), animações ricas de revelação com Framer Motion (romper lacre, confetes de celebração) e modais adaptados para o viewport móvel com safe areas.

---

## Arquivos & Recursos Impactados
- `index.html`: Viewport com `viewport-fit=cover` e suporte a safe-area.
- `src/components/ui/CelebrationConfetti.tsx`: Componente leve de celebração e partículas usando Framer Motion (zero dependências extras).
- `src/pages/QuickSecretSantaEnvelope.tsx`: Experiência sensorial mobile de romper o lacre digital, selo de cera tátil, animação de abertura e revelação de presente.
- `src/pages/QuickSecretSanta.tsx`: Teclado mobile fluido para digitação rápida de nomes, lista de chips interativa, animação de sorteio e botões de compartilhamento WhatsApp com hit target ergonômico.
- `src/pages/SecretSantaJoin.tsx`: Página pública do convidado com PIN numérico de 4 blocos (`inputMode="numeric"`), feedback visual de presença confirmada e visual de mini-app nativo.
- `src/components/events/SecretSantaChoiceModal.tsx`: Layout mobile-first sem cortes de tela, touch targets generosos e contraste Neobrutalism.
- `src/components/events/SecretSantaWizardModal.tsx`: Stepper e navegação responsiva em 3 passos com botões de avanço fixos/ergonômicos no rodapé mobile.
- `src/pages/SecretSantaLanding.tsx`: Sticky CTA no rodapé mobile com suporte a safe area e cards compactos de grupos.
- `tests/e2e/mobile-polish-audit.cjs`: Validação automatizada no Playwright com viewport mobile real (iPhone 14 / Pixel 7: 390x844).

---

## Plano de Execução Detalhado

### Fase 1: Fundação Mobile & Componente de Feedback Visual (Micro-interações)
- [x] **1.1 Ajustar Viewport & Safe Areas:**
  - Em `index.html`: `viewport-fit=cover`.
  - Em `src/index.css`: utilitários de safe-area padding (`pb-safe`, `pt-safe`).
- [x] **1.2 Criar Efeito de Celebração Visual (`CelebrationConfetti.tsx`):**
  - Implementar sistema de partículas/confetes animados com Framer Motion para momentos de comemoração (sorteio finalizado, envelope aberto, presença confirmada).

### Fase 2: Experiência Mobile do Envelope Lacrado (`QuickSecretSantaEnvelope.tsx`)
- [x] **2.1 Redesign do Selo Digital & Rompimento Tátil:**
  - Selo de segurança com visual de lacre de cera / carimbo vermelho Neobrutalist (`rounded-full`, relevo, sombra sólida).
  - Feedback tátil ao tocar: efeito de tremor/crack antes de abrir.
  - Animação de abertura do envelope revelando o amigo sorteado com confetes visuais.
  - Tela de violação: alerta com pulsação suave em vermelho, borda contrastante e data/hora explícita.

### Fase 3: Sorteador Relâmpago Mobile-First (`QuickSecretSanta.tsx`)
- [x] **3.1 Otimização de Teclado e Entrada de Nomes:**
  - Input com `enterKeyHint="done"`, auto-capitalização de nomes e submit ao pressionar Enter sem perder foco do teclado.
  - Chips de participantes com botão de remoção fácil (área de toque de pelo menos 44px).
- [x] **3.2 Feedback Visual de Sorteio:**
  - Animação de processamento divertida ("Girando a roleta...", "Garantindo sigilo...") antes de exibir os envelopes prontos.
  - Botões de envio no WhatsApp com visual ergonômico (altura 48-52px) destacados para toque com polegar.

### Fase 4: Entrada do Convidado Mobile (`SecretSantaJoin.tsx`)
- [x] **4.1 Interface de Entrada Estilo Mini-App:**
  - Card centralizado otimizado para celulares sem rolagem excessiva.
  - Campo de PIN com 4 dígitos grandes e destacados com `inputMode="numeric"` e `maxLength={4}`.
- [x] **4.2 Celebração de Presença Confirmada:**
  - Ao confirmar, disparo de confetes visuais e badge de confirmação com status de segurança do PIN.

### Fase 5: Modais e Landing Page Mobile-First
- [x] **5.1 Ajustar Modais (`SecretSantaChoiceModal` e `SecretSantaWizardModal`):**
  - Modais com scroll suave interno, evitando que o rodapé saia do viewport em telas de 360-390px.
- [x] **5.2 Sticky CTA na Landing Page (`SecretSantaLanding`):**
  - Barra de ação fixa no rodapé mobile com botão "Criar Amigo Secreto" com safe area padding.

### Fase 6: Validação E2E Mobile, Documentação e DoD
- [x] **6.1 Executar testes E2E simulando dispositivos móveis (390x844).**
- [x] **6.2 Capturar screenshots mobile das telas atualizadas.**
- [x] **6.3 Atualizar Conductor (`plan.md`, `tracks.md` e `product.md`).**

---

## Critérios de Aceite (Definition of Done)
1. Todas as telas chave (Landing, Sorteador Relâmpago, Envelope Lacrado, Convidado e Modais) 100% utilizáveis com apenas uma mão no celular.
2. Touch targets de botões e links com no mínimo 44px a 48px de altura.
3. Teclados móveis apropriados (`inputMode="numeric"` para PIN, `enterKeyHint="done"` para nomes).
4. Feedback visual marcante em cada ação (animação de rompimento do lacre, confetes ao confirmar/sortear).
5. Build de produção (`npm run build`) sem erros de compilação.
6. Testes E2E mobile passando com 100% de sucesso.
