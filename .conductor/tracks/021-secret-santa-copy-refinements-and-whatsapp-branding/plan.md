# Track 021 — Refinamento de Copy do Amigo Secreto & Padronização da Marca WhatsApp

## Objetivo
1. Refinar a copy de pré-decisão no modal (`SecretSantaChoiceModal.tsx`) para posicionar o modo sem cadastro como **instantâneo** e o cadastro como **rápido (leva só 1 minuto)**, incentivando a criação de conta com honestidade e sem atrito.
2. Padronizar todas as menções a "Zap" no projeto para a grafia oficial **WhatsApp** e enriquecer os pontos de contato com o ícone oficial do WhatsApp.

---

## Arquivos & Recursos Impactados
- `src/components/icons/WhatsAppIcon.tsx`: Ícone oficial SVG de alta fidelidade do WhatsApp com suporte a classes Tailwind.
- `src/components/events/SecretSantaChoiceModal.tsx`:
  - Atualização do header: "Sem pegadinhas: você pode sortear instantaneamente sem cadastro ou criar sua conta em apenas 1 minuto para ter a experiência completa com lista de presentes e festa."
  - Card Sem Cadastro: Tag "Instantâneo ⚡", descrição destacando que resolve em segundos na tela.
  - Card Com Cadastro: Tag "Recomendado • Leva só 1 min 🚀", destacando facilidade de criação e benefícios completos.
- `src/pages/SecretSantaLanding.tsx`:
  - Trocar "Sem confusão e direto no Zap" por "Sem confusão e direto no WhatsApp".
  - Trocar "mandar no Zap de cada amigo" por "mandar no WhatsApp de cada amigo".
  - Inserir o ícone do WhatsApp onde for pertinente.

---

## Plano de Execução Detalhado

### Fase 1: Componente do Ícone do WhatsApp (`WhatsAppIcon.tsx`)
- [x] **1.1 Criar componente SVG reutilizável `WhatsAppIcon.tsx`:**
  - Suportar `className` para tamanho e preenchimento ou cor padrão `#25D366`.

### Fase 2: Refinamento de Copy do Modal (`SecretSantaChoiceModal.tsx`)
- [x] **2.1 Atualizar texto do cabeçalho e cards:**
  - Header: contraste claro entre "instantâneo" e "cadastro em só 1 minuto".
  - Card 1: foco em rapidez instantânea.
  - Card 2: foco em condução suave para cadastro fácil ("só 1 minuto") com benefícios completos.
  - Usar `WhatsAppIcon` no benefício de compartilhamento.

### Fase 3: Padronização na Landing Page (`SecretSantaLanding.tsx`)
- [x] **3.1 Substituir todas as instâncias de "Zap":**
  - Hero headline: "Sem confusão e direto no WhatsApp."
  - Cards de comparação e benefícios.
  - Inclusão do `WhatsAppIcon` nos botões e badges relevantes.

### Fase 4: Validação, Testes e DoD
- [x] **4.1 Verificação TypeScript (`npm run type-check`).**
- [x] **4.2 Testes Unitários (`npm run test:unit`).**
- [x] **4.3 Build de Produção (`npm run build`).**
- [x] **4.4 Atualização Conductor (`plan.md`, `tracks.md` e `product.md`).**

---

## Critérios de Aceite (Definition of Done)
1. Nenhuma ocorrência de "Zap" na interface da landing de Amigo Secreto.
2. A copy do modal posiciona o sem cadastro como "instantâneo" e o cadastro como "só 1 minuto", conduzindo o usuário de forma persuasiva.
3. Ícone autêntico do WhatsApp renderizado com clareza.
4. Todos os testes e build 100% verdes.
