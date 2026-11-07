# Product Definition: ReUNE

## Vision
O ReUNE é um ecossistema completo para organização social. Ele atua como um "super-app" para comunidades, começando com eventos sociais (Churrascos, Festas) e módulos especializados.

## Core Behavior (The "Brain" - Une.AI)

O assistente Une.AI não é apenas um chatbot, é um **Orquestrador Logístico** baseado em uma máquina de estados finita. Ele segue um fluxo estrito de decisão para garantir dados consistentes e previsíveis.

### Estados do ChatWidget (Simplificado)

| Estado | Descrição | Ações Permitidas |
|--------|-----------|------------------|
| `draft` | Fase de coleta de dados e refinamento | Chat livre, definir data, local, etc. |
| `created` | Itens gerados e salvos | Confirmar evento ou editar lista |
| `finalized` | Evento confirmado pelo organizador | Apenas visualização (ou reabertura via chat) |
| `cancelled` | Evento cancelado | Histórico preservado |

### 0. Fase de Onboarding (Tela Inicial)
Antes de iniciar o chat, o usuário deve selecionar o contexto na interface:
- **Botão [Criar Novo Evento]:**
  - Ação: Limpa `eventoId` do estado local e do contexto no banco.
  - Resultado: Inicia chat "limpo" (tabula rasa).
- **Botão [Editar Evento Existente]:**
  - Ação: Lista últimos 3 rascunhos do usuário.
  - Resultado: Carrega `eventoId` e histórico de mensagens.

### 1. Fase de Triagem (O Porteiro)
**Regra de Ouro:** O sistema nunca avança para geração de itens sem os dados base.

- **Input Mínimo Obrigatório:** `tipo_evento` E `qtd_pessoas`
- **Validação de Schema:** A IA deve retornar JSON estrito com estas chaves (ex: não aceitar `event_name`)
- **Ação:** Se faltar qualquer um, o sistema deve perguntar especificamente pelo dado faltante antes de prosseguir
- **Tratamento de Erros:** JSON parse error → limpeza de backticks/markdown → re-pedir dados

### 2. Fase de Refinamento (Inteligência Cultural)

- **Desambiguação de Tema:**
  - Se o evento for temático (ex: "Festa Junina", "Aniversário") e o horário não for claro
  - Perguntar: *"Será almoço ou jantar?"* para calcular corretamente proporção comida vs. bebida
  - `subtipo_evento` tem precedência sobre `tipo_evento` na lógica de decisão

- **Datas Inteligentes:**
  - Se o tipo do evento for um Feriado (ex: "Natal", "São João")
  - Consultar tabela de feriados e sugerir data automaticamente
  - **⚠️ CRÍTICO:** Usar formato local `YYYY-MM-DD` (não UTC) para evitar bug "D-1"

- **Validação de Data:**
  - Datas devem ser validadas antes do persist
  - Formato aceito: DD/MM/AAAA (conversão interna para YYYY-MM-DD local)
  - Horário padrão: `T12:00:00` para evitar viradas de dia por fuso horário

### 3. Fase de Execução

- **Persistência via eventManager:**
  - Diferenciar entre "Criar Novo Evento" (limpa ID) e "Editar Existente" (carrega contexto)
  - Usar função unificada `upsertEvent` do `eventManager.ts`
  - Acesso ao banco **sempre** via `src/api/rpc.ts` (nunca `supabase.from` direto)

- **Geração de Itens:**
  - Lista só é gerada quando Fase 1 e 2 estão completas.
  - **Edição:** Em atualizações de eventos existentes (`update_event`), a lista NÃO deve ser regenerada ou exibida a menos que explicitamente solicitado.
  - Gerar via `groqService.ts` com prioridade para chaves específicas
  - Salvar itens via rpc.ts

- **Feedback Visual:**
  - `ChatWidget` deve exibir lista visual (snapshot) sempre que houver itens gerados
  - Usar `sonner` para toasts de erro/sucesso
  - Estado `showItems: TRUE` quando itens gerados com sucesso

### Tratamento de Erros

1. **JSON Parse Error:** Limpeza de backticks/markdown antes do `JSON.parse`
2. **RLS Error:** Reset do `eventoId` local + toast Sonner de erro de permissão
3. **Invalid Date:** Re-pedir data com formato claro (DD/MM/AAAA)
4. **Missing Context:** Detectar edição vs. criação para carregar/salvar corretamente

## Core Modules

### 1. Event Management
- Criação assistida por IA via `simpleOrchestrator.ts`
- Dashboard de acompanhamento com gráficos via `recharts`
- Edição colaborativa com locking de estado

### 2. Une.AI Assistant
- Chat via `ChatWidget` integrado ao `simpleOrchestrator`
- Edge Functions (`supabase/functions/llm-chat`) para processamento
- `groqService.ts` para integração com LLM

### 3. Secret Santa
- Landing Page dedicada e de alta conversão para tráfego pago/orgânico (`/amigo-secreto` em `SecretSantaLanding.tsx`) com Open Graph meta tags, mockup interativo de WhatsApp e telas reais, comparativo de modos em baralho empilhado (Framer Motion drag), trilha cronológica em 'S', casos de uso, FAQ interativo e sticky bar mobile.
  - **Toggle Interativo de Mockup no Hero:** Alternância em tempo real entre o *Modo Grupo (Link do WhatsApp + Tela de Revelação com PIN de 4 dígitos)* e o *Modo Relâmpago (WhatsApp Individual + Envelope Lacrado com Selo de Cera)*, eliminando qualquer ambiguidade sobre a tela final do convidado.
  - **O Grande Diferencial (Pilha de Cartas com Framer Motion):** Baralho empilhado com física elástica (`drag="x"`, rotação, z-index dinâmico) e controles táteis `[ < ] [ • • • ] [ > ]` para alternar entre Link de Grupo, Convites Anti-Penetras e Sorteador Relâmpago.
  - **Como Funciona em 3 Passos (Economia de Scroll):** 3 cards alinhados horizontalmente com setas direcionais neobrutalistas no desktop e carrossel snap horizontal (`overflow-x-auto snap-x`) no mobile, reduzindo mais de 400px de scroll vertical.
  - **Por Que Abandonar o Papelzinho (Trilha Sinuosa em 'S'):** Timeline estilo tabuleiro/jogo conectada por linha guia tracejada com nós coloridos numerados para cada marco (Zero marmelada, Lista de desejos, Festa conectada e Segredo absoluto).
  - **Diagramação e CTA Final Mobile-Proof:** Botão `"CRIAR MEU AMIGO SECRETO GRÁTIS"` com quebra flexível e padding proporcional que previne truncamento em qualquer largura de tela (a partir de 360px).
- **Modal de Pré-Decisão Transparente (`SecretSantaChoiceModal.tsx`):**
  - Ao clicar em "Criar meu amigo secreto", exibe caixa de seleção clara entre:
    1. *⚡ Sorteador Relâmpago (Sem Cadastro, instantâneo, envelopes no WhatsApp)*.
    2. *🎁 Suíte Completa ReUNE (Com Conta, cadastro rápido em apenas 1 minuto, lista de presentes, festa com mapa, anti-penetras)*.
  - Condução estratégica e suave para cadastro ("é fácil e leva 1 min") mantendo a opção sem cadastro como alternativa instantânea e transparente.
  - Uso padronizado da marca e ícone oficial do **WhatsApp** em todos os pontos de contato e despacho.
- **Redirecionamentos Inteligentes de Login (`Login.tsx` e `Index.tsx`):**
  - O botão de voltar na tela de login respeita o parâmetro `redirect`/`returnTo` (exibindo "Voltar para o Amigo Secreto" quando vindo da landing de amigo secreto).
  - Após efetuar login ou cadastro, redireciona de volta para `/amigo-secreto?action=wizard`, abrindo automaticamente o Wizard de criação.
- **Sorteador Relâmpago ⚡ Sem Cadastro (`/amigo-secreto/rapido` e `/sorteio-rapido` em `QuickSecretSanta.tsx`):**
  - Resolução instantânea do sorteio em 1 minuto sem exigir criação de conta.
  - Algoritmo de derangement garantindo que ninguém se tire.
  - Tela de despacho individual com botões diretos para envio no WhatsApp de cada amigo.
  - Suporte a pré-preenchimento de título via query param `?group=...`.
  - **Envelopes Lacrados Digitais (`/envelope/:token` em `QuickSecretSantaEnvelope.tsx`):**
    - Mecanismo anti-curiosos/anti-spoilers: o link do participante fica protegido por um lacre digital.
    - Se aberto pelo destinatário no seu próprio aparelho: o lacre é rompido, salvo no dispositivo e revela o amigo.
    - Se aberto previamente por outro dispositivo (ex: organizador curioso): exibe alerta ostensivo de 🚨 **LACRE VIOLADO** com data e hora exata da espionagem.
- **Suíte Completa de Amigo Secreto (com Conta):**
  - Fluxo dedicado e interativo via Wizard em 3 passos (`SecretSantaWizardModal.tsx`).
  - Sorteio algoritmicamente justo via `secretSantaDraw.ts`.
  - Conexão nativa com a festa da revelação (data, hora, local com Google Maps e rotas).
  - Dois modos de convite via WhatsApp (`SecretSantaShareModal.tsx`):
    - **Link Aberto do Grupo:** 1 link compartilhado no WhatsApp com entrada ágil e PIN de 4 dígitos.
    - **Convites Anti-Penetras:** Lista de nomes pré-autorizados com tokens exclusivos por convidado.
  - Página pública de entrada sem barreira de login (`SecretSantaJoin.tsx`), com wishlist e PIN de proteção.
  - Revelação interativa do amigo sorteado com proteção por PIN de 4 dígitos.
- **Experiência Mobile-First & Micro-Interações:**
  - Viewport com suporte a `viewport-fit=cover` e padding de safe area (`pb-safe`) para iOS e Android.
  - Modais em formato de Bottom-Sheet ergonômico no celular (`SecretSantaChoiceModal.tsx`).
  - Inputs otimizados para teclados virtuais (`inputMode="numeric"` para PINs e `enterKeyHint="done"` com auto-adição por Enter em listas de participantes).
  - Micro-interações táteis nos botões (`touch-press`) e celebração com confetes dinâmicos (`CelebrationConfetti.tsx`) na revelação do amigo e na confirmação de presença.
  - Sticky CTA fixo no rodapé mobile da Landing Page respeitando a safe area.

### 4. Gamification
- Perfis de usuário com badges
- Sistema de conquistas baseado em engajamento

## Target Audience

- **Primário:** Organizadores de eventos sociais casuais (Churrascos, Aniversários)
- **Secundário:** Eventos corporativos e igrejas
- **Terceário:** Organizações comunitárias e ONGs

## Non-Functional Requirements

### Performance
- Respostas do chat < 2 segundos (95th percentile)
- Geração de lista de itens < 5 segundos
- Animações suaves via `framer-motion`

### Reliability
- Idempotência de operações críticas (veja `utils/idempotency.ts`)
- Tratamento robusto de erros com rollback automático
- Logs de erro para debugging via `console.error`

### Usability
- Interface responsiva com `tailwindcss`
- Componentes acessíveis via `shadcn/ui` (Radix UI based)
- Feedback claro em todas as ações

## Technical Constraints

- **Orquestrador:** Único orquestrador válido é `simpleOrchestrator.ts` (`chatOrchestrator.ts` é obsoleto)
- **Database Layer:** Acesso **estritamente** via `src/api/rpc.ts`
- **Date Handling:** Nunca usar UTC para datas de eventos (sempre local)
- **UI Library:** Usar `shadcn/ui` para componentes
- **Icons:** Usar `lucide-react` para ícones
- **State Management:** `@tanstack/react-query` (server) + React Context (local)

## Success Metrics

- Taxa de conclusão de eventos criados via IA > 80%
- Tempo médio para criar evento completo < 5 minutos
- Satisfação do usuário (NPS) > 4.0/5.0
- Taxa de retenção de usuários mensal > 60%
