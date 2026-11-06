# Track 020 — Modal de Pré-Decisão de Amigo Secreto & Redirecionamentos Inteligentes de Login

## Objetivo
Resolver os dois gargalos de UX na página de Amigo Secreto:
1. **Caixa de Seleção Intuitiva ("Criar meu amigo secreto"):** Ao clicar no CTA principal, exibir um modal Neobrutalism transparente e acolhedor perguntando como o usuário prefere criar:
   - **Opção A:** ⚡ Sorteador Relâmpago (Sem Cadastro, 1 minuto, Envelopes no WhatsApp).
   - **Opção B:** 🎁 Experiência Completa ReUNE (Com Conta, Lista de Presentes, Festa com Mapa, Anti-Penetras).
2. **Redirecionamentos Inteligentes no Login:**
   - O botão de voltar na tela de login deve retornar para `/amigo-secreto` quando o usuário tiver vindo de lá, em vez de jogá-lo na home geral `/`.
   - Após o login com sucesso, se houver um redirecionamento pendente (`?redirect=/amigo-secreto&action=wizard`), o usuário retorna ao Amigo Secreto já com o Wizard aberto para criar o evento.

---

## Arquivos & Recursos Impactados
- `src/components/events/SecretSantaChoiceModal.tsx`: Novo modal Neobrutalism para escolha de modo (Sem Cadastro vs. Suíte Completa).
- `src/pages/SecretSantaLanding.tsx`: Conectar todos os botões de CTA ao `SecretSantaChoiceModal` e suportar reabertura do Wizard após login (`?action=wizard`).
- `src/pages/Login.tsx`: Detectar parâmetro de redirecionamento (`redirect`/`returnTo`), ajustar o botão de voltar e o redirecionamento pós-login.
- `src/pages/Index.tsx`: Preservar e tratar query params de redirecionamento quando na rota `/app`.

---

## Plano de Execução Detalhado

### Fase 1: Componente do Modal de Escolha (`SecretSantaChoiceModal.tsx`)
- [x] **1.1 Criar modal Neobrutalism:**
  - Card 1: ⚡ Sorteador Relâmpago (Sem Cadastro, 1 minuto, envelopes no WhatsApp).
  - Card 2: 🎁 Suíte Completa ReUNE (Com Conta, lista de presentes, festa com mapa, anti-penetras).
  - Ação Card 1: navega para `/amigo-secreto/rapido`.
  - Ação Card 2: se logado abre Wizard; se não logado navega para `/app?redirect=/amigo-secreto&action=wizard`.

### Fase 2: Integração com a Landing Page (`SecretSantaLanding.tsx`)
- [x] **2.1 Substituir `handleStartClick`:**
  - Em vez de ir direto para `/app` ou abrir wizard, abrir o `SecretSantaChoiceModal`.
  - Conectar os cards de círculos sociais para preencher o título inicial.
- [x] **2.2 Suportar retorno pós-login:**
  - Se `searchParams.get('action') === 'wizard'` e o usuário estiver autenticado, abrir automaticamente o `SecretSantaWizardModal`.

### Fase 3: Ajuste de Redirecionamento e Navegação no Login (`Login.tsx` e `Index.tsx`)
- [x] **3.1 Tratar `returnTo` / `redirect` no Login:**
  - O botão de voltar volta para a URL informada em `redirect` ou `returnTo` (ou histórico anterior).
  - Texto do botão dinâmico: "Voltar para o Amigo Secreto" ou "Voltar pra home".
- [x] **3.2 Redirecionamento após login bem-sucedido:**
  - Redirecionar para a rota desejada com seus parâmetros.

### Fase 4: Testes, Validação e DoD
- [x] **4.1 Verificação TypeScript (`npm run type-check`).**
- [x] **4.2 Execução de Testes Unitários (`npm run test:unit`).**
- [x] **4.3 Build de Produção (`npm run build`).**
- [x] **4.4 Atualização Conductor (`plan.md`, `tracks.md` e `product.md`).**

---

## Critérios de Aceite (Definition of Done)
1. Clicar em "Criar meu amigo secreto" abre a caixa de seleção intuitiva (Sem Cadastro vs. Com Cadastro).
2. O usuário consegue escolher Sorteador Relâmpago sem ver tela de login.
3. Se o usuário escolher a Suíte Completa e não estiver logado, a tela de login exibe botão de voltar para `/amigo-secreto`.
4. Ao clicar em voltar na tela de login, retorna à página `/amigo-secreto`.
5. Ao fazer login, retorna para `/amigo-secreto` já com o Wizard de criação aberto.
6. 100% dos testes e build passando.
