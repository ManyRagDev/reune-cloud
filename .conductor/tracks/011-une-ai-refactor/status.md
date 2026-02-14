# Refatoração UNE.AI — Status Geral

## Resumo Executivo

Refatoração profunda do chatbot UNE.AI realizada em 2026-02-11.
**8 de 10 tarefas concluídas nesta sessão.**
2 tarefas pendentes → ver Tracks 012 e 013.

---

## O que foi feito

### `src/services/groqService.ts`

| Mudança | Status |
|---------|--------|
| System prompt substituído (~150 linhas → ~100 linhas, seções com ═══) | ✅ |
| Dual-LLM removido (PLANNER_SYSTEM_PROMPT, buildPlannerPrompt, parsePlannerEnvelope, plannerToAction) | ✅ |
| Import `plannerEnvelopeSchema` removido | ✅ |
| Import `isValidFutureDate, parseToIsoDate` removido (não usados) | ✅ |
| `processMessage()` simplificado para 1 chamada LLM | ✅ |
| `ActionData` atualizado: removido `request_confirmation`/`confirmed`, adicionado `edit_item` | ✅ |
| `executeAction()` — case `edit_item` adicionado | ✅ |
| `executeItemEdit()` — tipo `any[]` para itens (workaround Supabase type) | ✅ |
| Fallback para resposta vazia ou JSON inválido em `processMessage()` | ✅ |
| `systemResponses` import removido | ✅ |
| `merged.categoria_evento` / `merged.subtipo_evento` removidos do bloco `create_event` | ✅ |

**Pendências em groqService.ts** → Track 013:
- `buildEventName` hint (não usado)
- `EventContext` ainda tem `categoria_evento`/`subtipo_evento` (campos obsoletos)
- `merged.subtipo_evento` em `generateItemsWithGroqLocal` call
- `_userId` prefix em `executeItemEdit`

---

### `src/core/orchestrator/simpleOrchestrator.ts`

| Mudança | Status |
|---------|--------|
| Bug crítico corrigido: `currentEventId` declarado antes de `parseItemCommand` | ✅ |
| Session timeout: 1h → 4h | ✅ |
| Lógica de timeout: preserva evento ativo ao expirar | ✅ |
| `extractCollectedData()` removida | ✅ |
| `extractPeopleCount()` removida | ✅ |
| `mergedCollected` → `collectedData` (sem regex) | ✅ |
| Bloco `request_confirmation` removido (~45 linhas) | ✅ |
| Bloco `confirmed` removido (~110 linhas) | ✅ |
| `formatDate()` removida | ✅ |
| `isConfirmationResponse()` removida | ✅ |
| `getSuggestedReplies()` — nova implementação contextual | ✅ |
| `getSuggestedReplies()` — passa `userText` como parâmetro | ✅ |
| Import `generateEditFeedback` removido | ✅ |
| `processMessage()` — contexto enriquecido (tipo, pessoas, data do savedContext) | ✅ |

**Pendências em simpleOrchestrator.ts** → Track 012 + 013:
- Substituir bloco `parseItemCommand` pelo novo com `detectEditIntentFromMessage` (Track 012)
- `CollectedData` type alias potencialmente removível (Track 013)

---

### `src/core/orchestrator/itemCommands.ts`

| Mudança | Status |
|---------|--------|
| `detectEditIntentFromMessage()` adicionada | ❌ Pendente (Track 012) |

---

## Breaking Changes

| Item | Comportamento Anterior | Comportamento Novo |
|------|----------------------|-------------------|
| LLM calls por mensagem | 2 (planner + conversacional) | 1 (conversacional unificado) |
| Fluxo de confirmação | `confirming` state → `confirmed` action | IA confirma conversacionalmente, retorna `create_event` direto |
| `request_confirmation` action | Existia, gerava estado intermediário | Removida completamente |
| `confirmed` action | Existia, executava ação pendente | Removida completamente |
| `pending_confirmation` no contexto | Usado para guardar ação pendente | Não existe mais |
| Session timeout | 1h — sempre limpa | 4h — preserva evento ativo |
| Extração regex de qtd_pessoas | Extraía via regex antes do LLM | Apenas LLM extrai |
| `edit_item` via chat | Só via `parseItemCommand` (alta confiança) | + `detectEditIntentFromMessage` (média confiança via LLM) |

---

## Próximas Tracks

1. **Track 012** → `detectEditIntentFromMessage()` em itemCommands.ts + integração
2. **Track 013** → TypeScript cleanup + verificação end-to-end
