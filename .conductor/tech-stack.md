# Tech Stack

## Atualizações Recentes (2026-01-07)

### 1. Funcionalidade de Listagem de Eventos

Foi implementada a funcionalidade de listar eventos do usuário para edição. Quando o usuário clica em "Listar Eventos", o sistema busca todos os eventos em status "em aberto" e os exibe para seleção via `suggestedReplies`.

**Fluxo:**
1. Usuário clica no botão "Listar Eventos"
2. ChatWidget chama `simpleOrchestrate('', userId, 'list_events')`
3. `simpleOrchestrate` chama `listUserEvents(userId)`
4. `listUserEvents` busca eventos via `get_all_user_events(userId)`
5. Eventos são exibidos no chat como mensagens com `suggestedReplies` (título do evento)
6. Usuário pode clicar em um evento para editá-lo

**Módulos Atualizados:**
- `simpleOrchestrator.ts` - Adicionada função `listUserEvents(userId)` que retorna `ListEventsPayload`
- `types/domain.ts` - Adicionados tipos `RecentEvent` e `ListEventsPayload`
  - `rpc.ts` - Adicionada função `get_all_user_events(userId)` (acesso direto ao banco)
- `ChatWidget.tsx` - Atualizada função `handleListEvents()` que chama `simpleOrchestrate(..., 'list_events')`

**Correções:**
- `id: Number(event.id)` em `listUserEvents` para compatibilidade com `ChatMessage`

### 2. Correção de Bug de Criação de Novo Evento

Foi corrigido o problema onde ao criar um novo evento, o sistema tentava recuperar o `evento_id` antigo do banco (race condition). 

**Arquivos Modificados:**
- `simpleOrchestrator.ts` (linha 39): Se `eventoId` foi explicitamente passado como undefined, NUNCA usa o valor salvo no banco como fallback
- `ChatWidget.tsx` (linha 203): Adicionado delay de 200ms após `clearUserContext` para garantir que o banco processou o upsert

## Frontend (React + TypeScript)

| Componente | Descrição | Status |
|-----------|-----------|--------|
| ChatWidget | Widget de chat com IA (shadcn/ui) com orquestrador integrado | ✅ Funcional |

## Backend & Data Layer

| Camada | Descrição |
|---------|-----------|
| Banco | Supabase |
| Acesso RPC | **Estritamente** via `src/api/rpc.ts` |
| ORM | Supabase Client |
| Autenticação | Supabase Auth (`useAuth` hook) |

## AI & Logic

| Módulo | Descrição |
|---------|---------|
| Orquestrador | `simpleOrchestrate` (único e válido) com padrão de decisão baseado em estados |
| LLM | Groq API via Edge Function (`supabase/functions/llm-chat`) |
| Serviço IA | `groqService` com gerador de itens culturalmente coerentes |

## UI & UX

| Biblioteca | Descrição |
|---------|---------|
| Componentes | `shadcn/ui` (Radix UI) |
| Estilos | Tailwind CSS + `tailwindcss-animate` |
| Ícones | `lucide-react` |
| Animações | `framer-motion` |
| Gráficos | `recharts` (para resumos financeiros) |
| Feedback | `sonner` (Toasts) |

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     Frontend (React + TypeScript)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                            │
│                 ┌────────────────────┐    ┌────────────────────┐    │
│                 │  ChatWidget      │    │  EventManager   │    │
│                 └────────────────────┘    └────────────────────┘    │
│                     │                │                │                │                │
│                 ▼                ▼                ▼                ▼                │
│                 │                │                │                │                │
│              ┌───────────────────────────────────────────────────────────────────────┐   │
│              │  UI & UX (shadcn/ui, Tailwind)                │   │
│              └───────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                                                │
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                   Backend & Data (Supabase)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                            │
│                 ┌────────────────────┐    ┌────────────────────┐    │
│                 │  Database (Supabase)  │    │  RPC Access     │    │
│                 └────────────────────┘    └────────────────────┘    │
│                     │                │                │                │
│                 ▼                ▼                ▼                │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                                                │
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    IA & Logic                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                            │
│                 ┌────────────────────┐    ┌────────────────────┐    │
│                 │  simpleOrchestrate │    │  Groq Service   │    │
│                 └────────────────────┘    └────────────────────┘    │
│                     │                │                │                │
│                 ▼                ▼                ▼                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Integração entre Componentes

```
ChatWidget
   │
   ├── simpleOrchestrate (Lógica de decisão)
   ├── groqService (Geração de itens)
   └── sonner (Notificações)
```

## Tecnologias Específicas

### Frontend
- **React 18** com Strict Mode TypeScript
- **React Router DOM** para navegação
- **TanStack Query** (v5) para gerenciamento de estado (server) + React Context (local)
- **Radix UI** (shadcn/ui) para componentes modernos
- **Tailwind CSS** para estilos utilitários
- **Framer Motion** para animações suaves

### Backend
- **Supabase** como banco de dados e serviço de autenticação
- **Edge Functions** (`supabase/functions/llm-chat`) para processamento de LLM com Groq

### Integração
- **RPC Client:** `src/api/rpc.ts` abstrai todas as chamadas ao Supabase, garantindo acesso estrito e consistente
- **ChatWidget:** Gerencia o fluxo de chat, criação de eventos e listagem de eventos
- **Orquestrador:** `simpleOrchestrate` - Único orquestrador válido para gerenciar conversas