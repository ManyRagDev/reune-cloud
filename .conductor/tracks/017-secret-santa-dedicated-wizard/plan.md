# Track 017 — Wizard Dinâmico de Criação de Amigo Secreto e Convites WhatsApp (Aberto vs Anti-Penetras)

## Objetivo
Criar uma interface nova, dedicada, dinâmica e altamente intuitiva (estilo Wizard em passos interativos) para a criação e configuração de Amigo Secreto, permitindo ao organizador escolher entre dois modos de convite ("Link Aberto para o Grupo" vs "Convites Individuais Anti-Penetras") com disparo direto para o WhatsApp.

---

## Arquivos & Recursos Impactados
- **Banco de Dados (Supabase via MCP):**
  - Adição de `invite_mode` (`text`) em `event_secret_santa` (valores: `'open'` ou `'individual'`).
  - Adição de `pin_code` (`text`) e flexibilização de `user_id` (para permitir participantes pré-autorizados ou convidados sem login) em `event_secret_santa_participants`.
- **Novos Componentes e Telas:**
  - `src/components/events/SecretSantaWizardModal.tsx`: Wizard interativo em 3 passos com visual Neubrutalism (Cores vibrantes, badges de valores em 1 clique, data do sorteio, local com Google Maps e escolha do modo de convite: Aberto ou Individual).
  - `src/components/events/SecretSantaShareModal.tsx`: Modal pós-criação para disparo imediato no WhatsApp (com mensagem pré-formatada para grupos ou botões individuais por participante).
  - `src/pages/SecretSantaJoin.tsx`: Página de ingresso fácil via link do WhatsApp (`/amigo/:id/entrar` ou `/amigo-secreto/entrar/:token`).
- **Telas Conectadas:**
  - `src/pages/Dashboard.tsx`: Acionar o novo Wizard a partir do botão do Header e do Banner da Hero.
  - `src/pages/SecretSantaLanding.tsx`: Conectar o novo Wizard diretamente.
  - `src/pages/SecretSantaParticipants.tsx`: Suporte aos dois modos de compartilhamento no WhatsApp (Link aberto vs Links individuais).
  - `src/App.tsx`: Rota de entrada pública `/amigo/:id/entrar`.

---

## Plano de Execução Detalhado

### Fase 1: Schema do Banco e Suporte a Convites Híbridos
- [x] **1.1 Ajustar Schema Supabase (via MCP):**
  - Adicionar `invite_mode` em `event_secret_santa`.
  - Permitir `user_id` opcional e adicionar `pin_code` em `event_secret_santa_participants` para participantes convidados.

### Fase 2: Construção do `SecretSantaWizardModal.tsx`
- [x] **2.1 Passo 1 (Identidade & Vibe 🏷️):**
  - Nome do grupo, badges de sugestão rápida ("Firma", "Família", "Amigos"), emoji temático (🎁, 🎅, 🎄, 🍻, 🍕).
- [x] **2.2 Passo 2 (Presentes & Sorteio 💰):**
  - Seletor rápido de valor em cards (Lembrancinha R$ 20-50, Padrão R$ 50-100, Caprichado R$ 100-200 ou Personalizado), data do sorteio dos nomes.
- [x] **2.3 Passo 3 (Festa da Revelação & Modo de Convite 🥳):**
  - Data/horário da festa, local com `GoogleAddressAutocomplete` e mini-mapa.
  - Seletor de Modo de Convite:
    - 🚀 **Link Aberto do Grupo:** Qualquer um entra e cadastra seu nome e PIN de segurança.
    - 🛡️ **Convites Individuais:** Organizador lista os nomes pré-autorizados (anti-penetras).
  - Opção rápida: "Vincular a uma festa existente".

### Fase 3: Compartilhamento no WhatsApp e Tela de Ingresso
- [x] **3.1 Criar `SecretSantaShareModal.tsx`:**
  - Botão principal: "Compartilhar no Grupo do WhatsApp" (com mensagem pronta e formatada).
  - Se modo individual: botões "Mandar pro [Nome] no Zap" para cada convidado da lista.
- [x] **3.2 Criar tela de entrada amigável `SecretSantaJoin.tsx`:**
  - Acessada via link do WhatsApp (`/amigo/:id/entrar` e `/amigo/entrar/:token`).
  - O convidado seleciona ou digita seu nome, define seus 3 desejos de presentes e seu PIN de 4 dígitos para ver o resultado depois.

### Fase 4: Integração Geral, Validação e Testes
- [x] **4.1 Conectar no `Dashboard.tsx` e `SecretSantaLanding.tsx`:**
  - Substituir diálogos antigos pelo novo Wizard integrado.
- [x] **4.2 Validações:**
  - `npm run type-check` (0 erros).
  - `npm run test:unit` (183/183 verdes).
  - `npm run build` (geração limpa).

---

## Critérios de Aceite (Definition of Done)
1. O Wizard é 100% visual, animado e intuitivo em 3 passos com barra de progresso.
2. O organizador escolhe entre Link Aberto ou Convites Individuais Anti-Penetras.
3. Ao finalizar, o modal de compartilhamento do WhatsApp já gera a mensagem pronta para envio com 1 clique.
4. Convidados conseguem entrar pelo link do WhatsApp no celular sem fricção de login, registrando nome e wishlist.
5. `type-check`, `test:unit` e `build` passam sem qualquer erro.
