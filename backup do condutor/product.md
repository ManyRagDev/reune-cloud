# Product Definition: ReUNE

## Vision
O ReUNE é um ecossistema completo para organização social. Ele atua como um "super-app" para comunidades, começando com eventos sociais (Churrascos, Festas) e módulos especializados.

## Core Behavior (The "Brain" - Une.AI)

O assistente Une.AI não é apenas um chatbot, é um **Orquestrador Logístico** baseado em uma máquina de estados finita. Ele segue um fluxo estrito de decisão para garantir dados consistentes e previsíveis.

### Estados do ChatWidget

| Estado | Descrição | Ações Permitidas |
|--------|-----------|------------------|
| `dados_incompletos` | Faltam tipo ou quantidade de pessoas | Apenas input para dado faltante |
| `aguardando_data` | Dados básicos presentes, aguardando data | Bloquear botão "Gerar Itens" |
| `dados_completos` | Todos dados básicos presentes | Habilitar botão "Gerar Itens" |
| `itens_gerados` | Lista de itens persistida | Mostrar snapshot visual dos itens |

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
  - Lista só é gerada quando Fase 1 e 2 estão completas
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
- Fluxo dedicado de Amigo Secreto
- Sorteio algoritmicamente justo via `secretSantaDraw.ts`
- Wishlist e gerenciamento de participantes

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
