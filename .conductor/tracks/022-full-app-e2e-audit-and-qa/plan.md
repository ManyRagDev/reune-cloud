# Track 022 — Auditoria Completa de Usabilidade e Testes E2E com Navegador Real (ReUNE & Amigo Secreto)

## Objetivo
Realizar uma bateria completa de testes automatizados com navegador real (Chromium headless via Playwright), navegando como um usuário real por todas as telas, botões, formulários, modais e verificando a integridade das leituras e gravações no banco de dados Supabase em tempo real.

---

## Arquivos & Recursos Impactados
- `scripts/e2e-full-audit.cjs`: Script orquestrador de testes E2E com Playwright cobrindo todos os fluxos críticos.
- `scripts/test-reune-core.cjs`: Testes específicos da Home V3, Login, Auto-Cadastro e Dashboard.
- `scripts/test-secret-santa-quick.cjs`: Testes do Sorteador Relâmpago, validações de entrada, despacho WhatsApp, envelope com lacre de segurança e simulação de violação de lacre.
- `scripts/test-secret-santa-full.cjs`: Testes da suíte completa de Amigo Secreto (Wizard, criação no Supabase, tela de participantes e entrada pública com wishlist e PIN).
- `.conductor/tracks/022-full-app-e2e-audit-and-qa/report.md`: Relatório executivo detalhado com todos os cenários testados, logs de console, consultas no banco e capturas de tela.

---

## Plano de Execução Detalhado

### Fase 1: Auditoria da Landing Page Geral e Autenticação (ReUNE Core)
- [x] **1.1 Testar Home V3 (`/`):**
  - Carregamento, ausência de erros no console (`console.error`), clique em CTAs, troca de tema claro/escuro.
- [x] **1.2 Testar Fluxo de Autenticação & Auto-Cadastro:**
  - Criar conta nova via `/login`: verificar se é auto-confirmada no banco (`auth.users`) e logada imediatamente sem bloqueio de e-mail.
  - Testar login com conta existente e verificação de sessão JWT.
  - Testar Dashboard do usuário: carregamento de eventos existentes, filtros de status e botão de criar evento.

### Fase 2: Auditoria da Landing Page do Amigo Secreto (`/amigo-secreto`)
- [x] **2.1 Testar Elementos Visuais e Interações:**
  - Mockups do WhatsApp e revelação, acordeão de FAQ (abrir/fechar respostas), badges e links.
- [x] **2.2 Testar Modal de Pré-Decisão (`SecretSantaChoiceModal`):**
  - Clique no CTA principal -> abertura do modal.
  - Clique em cards de círculos (ex: Pilates) -> abertura com nome pré-preenchido.

### Fase 3: Auditoria do Sorteador Relâmpago ⚡ & Envelope Lacrado
- [x] **3.1 Testar Validações de Entrada:**
  - Bloqueio com menos de 3 nomes.
  - Bloqueio com nomes duplicados.
- [x] **3.2 Testar Sorteio e Despacho no WhatsApp:**
  - Inserção de 4 participantes ("Lucas", "Mariana", "Pedro", "Camila").
  - Execução do sorteio via RPC `create_quick_secret_santa`.
  - Verificação de persistência no banco Supabase (`quick_secret_santa` e `quick_secret_santa_participants`).
  - Verificação dos links gerados para cada participante.
- [x] **3.3 Testar Envelope Lacrado & Detecção de Violação:**
  - Abertura legítima: romper o lacre, verificar revelação do amigo e gravação de `opened_at` + `device_token`.
  - Reabertura no mesmo dispositivo: constatar abertura limpa sem alarme falso.
  - Violação de lacre: simular abertura por outro aparelho e verificar o alerta ostensivo de **🚨 LACRE VIOLADO**.

### Fase 4: Auditoria da Suíte Completa de Amigo Secreto (Com Conta)
- [x] **4.1 Testar Retorno Inteligente de Login:**
  - Selecionar "Criar com Conta" -> redirecionamento com `?redirect=/amigo-secreto&action=wizard`.
  - Testar botão "Voltar para o Amigo Secreto".
  - Logar -> verificar abertura automática do `SecretSantaWizardModal`.
- [x] **4.2 Testar Criação de Evento Completo no Supabase:**
  - Preenchimento do Wizard (Título, valor sugerido, data, local).
  - Persistência e geração de ID na tabela `table_reune`.
- [x] **4.3 Testar Entrada de Convidado Sem Login:**
  - Acessar link público de entrada (`/amigo/:id/entrar`).
  - Cadastrar nome, lista de desejos (wishlist) e PIN de 4 dígitos.
  - Confirmar persistência no banco (`secret_santa_participants`).

### Fase 5: Consolidação, Relatório Executivo e DoD
- [x] **5.1 Gerar relatório detalhado com capturas de tela e evidências.**
- [x] **5.2 Atualizar Conductor (`plan.md`, `tracks.md` e `product.md`).**

---

## Critérios de Aceite (Definition of Done)
1. 100% dos fluxos testados com sucesso via navegador real automatizado.
2. 0 erros críticos de console (`console.error`) ou falhas de requisição.
3. Todas as operações de leitura e gravação no Supabase confirmadas no banco.
4. Relatório executivo completo documentado com evidências.
