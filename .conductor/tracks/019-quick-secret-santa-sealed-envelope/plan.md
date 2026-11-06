# Track 019 — Sorteador Relâmpago de Amigo Secreto (Sem Cadastro & Envelopes Lacrados no WhatsApp)

## Objetivo
Implementar uma ferramenta de Amigo Secreto instantânea, sem necessidade de cadastro para o organizador nem para os convidados, com disparos diretos no WhatsApp e o mecanismo inovador de **Envelope com Lacre de Segurança Digital** (anti-curiosos/anti-spoilers).

---

## Arquivos & Recursos Impactados
- **Banco de Dados (Supabase via MCP):**
  - Tabela `quick_secret_santa` (id, title, created_at)
  - Tabela `quick_secret_santa_participants` (id, quick_draw_id, name, target_name, token, opened_at, views_count, device_token)
  - RPCs `create_quick_secret_santa` e `open_quick_envelope`
- **Novos Componentes e Telas:**
  - `src/pages/QuickSecretSanta.tsx`: Tela do Sorteador Relâmpago com lista de nomes, seleção de "Eu sou...", sorteio em 1 clique e tela de despacho de envelopes pro WhatsApp.
  - `src/pages/QuickSecretSantaEnvelope.tsx`: Tela do Envelope Lacrado (`/envelope/:token`) com animação de lacre, detecção de violação caso o organizador tenha espionado, e revelação sem spoilers.
- **Telas Conectadas:**
  - `src/pages/SecretSantaLanding.tsx`: Botões de atalho para o Sorteador Relâmpago no Hero e Navbar.
  - `src/App.tsx`: Rotas `/amigo-secreto/rapido` e `/envelope/:token`.
- **Testes:**
  - `tests/unit/quick-secret-santa.test.ts`: Testes unitários do sorteio derangement e lógica de verificação de lacre.

---

## Plano de Execução Detalhado

### Fase 1: Schema do Banco de Dados & RPCs
- [x] **1.1 Criar tabelas e RPCs via Supabase MCP:**
  - Tabelas `quick_secret_santa` e `quick_secret_santa_participants`.
  - RPC `create_quick_secret_santa(title, participants_json)`.
  - RPC `open_quick_envelope(token, device_fingerprint)`.

### Fase 2: Construção da Tela do Sorteador Relâmpago (`QuickSecretSanta.tsx`)
- [x] **2.1 Interface Neobrutalism de Entrada:**
  - Nome do grupo, campo rápido de participantes (mínimo 3).
  - Seletor de organizador ("Eu sou: [Nome]").
  - Botão animado "Sortear Agora 🎲" (sem pedir cadastro).
- [x] **2.2 Tela de Despacho de Envelopes:**
  - Botões para disparar o envelope individual de cada amigo no WhatsApp.
  - Botão exclusivo para o organizador abrir o seu próprio envelope.
  - Banner com up-sell para o Amigo Secreto Completo ReUNE.

### Fase 3: Construção da Tela do Envelope Lacrado (`QuickSecretSantaEnvelope.tsx`)
- [x] **3.1 Visual do Envelope Lacrado:**
  - Animação de cera / lacre de segurança.
  - Botão "Romper Lacre e Ver Amigo Secreto".
- [x] **3.2 Lógica Anti-Curiosos (Detecção de Lacre Violado):**
  - Se for primeira abertura: rompe, salva no localStorage e revela.
  - Se reaberto no mesmo aparelho: exibe normalmente.
  - Se aberto em aparelho diferente anteriormente: 🚨 **ALERTA DE LACRE VIOLADO!**

### Fase 4: Conexão das Rotas e Landing Page
- [x] **4.1 Integrar rotas no `src/App.tsx`:**
  - `/amigo-secreto/rapido` e `/envelope/:token`.
- [x] **4.2 Integrar botões na Landing Page (`SecretSantaLanding.tsx`):**
  - Card/botão "⚡ Sorteador Relâmpago (Sem Cadastro)" em destaque.

### Fase 5: Testes Unitários, Validação e DoD
- [x] **5.1 Testes Unitários (`tests/unit/quick-secret-santa.test.ts`):**
  - Garantir que ninguém se tire e cobertura da lógica de lacre.
- [x] **5.2 Validações:**
  - `npm run type-check` (0 erros).
  - `npm run test:unit` (todos verdes).
  - `npm run build` (geração limpa).

---

## Critérios de Aceite (Definition of Done)
1. O organizador consegue realizar um sorteio sem qualquer cadastro em menos de 1 minuto.
2. Cada participante recebe seu link de envelope lacrado no WhatsApp.
3. Se alguém abrir o envelope antes do destinatário, o lacre aparece como VIOLADO com data e hora.
4. O destinatário consegue reabrir seu envelope no mesmo celular sem alarme falso.
5. Todos os testes passam 100% verdes.
