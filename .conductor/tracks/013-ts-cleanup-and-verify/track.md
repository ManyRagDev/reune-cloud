# Track 013 — Limpeza TypeScript & Verificação Final

## Contexto
Após a refatoração completa (Tracks 011/012), este track fecha as pontas soltas:
erros TypeScript residuais, código morto, hints e verificação end-to-end do fluxo.

**IMPORTANTE:** Esta track só deve ser executada APÓS a Track 012 estar completa.

---

## Arquivos Envolvidos

- `src/services/groqService.ts`
- `src/core/orchestrator/simpleOrchestrator.ts`

---

## Problema 1 — `buildEventName` não utilizado em groqService.ts

**Diagnóstico:** `'buildEventName' is declared but its value is never read` (hint 6133)

**Localizar em `src/services/groqService.ts`** (em torno de linha 259):
```typescript
function buildEventName(tipo?: string, dataIso?: string): string {
  const base = capitalizeWord(tipo);
  const dateLabel = formatDateForName(dataIso);
  if (dateLabel) {
    return `${base} - ${dateLabel}`;
  }
  return base;
}
```

**Ação:** Verificar se `buildEventName` é chamada em algum lugar do arquivo.
- Se **não for chamada**: remover `buildEventName` e também `formatDateForName` e `capitalizeWord`
  se forem usadas apenas por `buildEventName`.
- Se **for chamada**: ignorar este item.

**Como verificar:** Fazer Grep por `buildEventName` em todo o projeto.
Se só aparecer na sua própria declaração → remover as 3 funções auxiliares:
```typescript
// Remover estas 3 funções (se nenhuma for usada externamente):
function formatDateForName(isoDate?: string): string | undefined { ... }
function capitalizeWord(value?: string): string { ... }
function buildEventName(tipo?: string, dataIso?: string): string { ... }
```

**ATENÇÃO:** `formatDateForName` também pode ser usada no `executeAction` case `update_event`:
```typescript
if (merged.data_evento) parts.push(`Data alterada para ${formatDateForName(merged.data_evento as string)}`);
```
Se for esse o caso, remover apenas `buildEventName` e manter as outras duas.

---

## Problema 2 — `EventContext` tem campos obsoletos em groqService.ts

**Arquivo:** `src/services/groqService.ts`
**Localizar interface `EventContext` (em torno de linha 31):**

```typescript
interface EventContext {
  evento?: {
    id?: string;
    tipo_evento?: string;
    categoria_evento?: string;   // ← obsoleto (não enviado mais)
    subtipo_evento?: string;     // ← obsoleto (não enviado mais)
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    status?: string;
  };
  hasItems?: boolean;
  hasParticipants?: boolean;
  collectedData?: Record<string, unknown>;
}
```

**Ação:** Remover `categoria_evento` e `subtipo_evento` da interface (os callers não os passam mais).

**Código final:**
```typescript
interface EventContext {
  evento?: {
    id?: string;
    tipo_evento?: string;
    qtd_pessoas?: number;
    data_evento?: string;
    menu?: string;
    status?: string;
  };
  hasItems?: boolean;
  hasParticipants?: boolean;
  collectedData?: Record<string, unknown>;
}
```

---

## Problema 3 — `merged.subtipo_evento` e `merged.categoria_evento` em executeAction

**Arquivo:** `src/services/groqService.ts`
**Localizar em `executeAction()` (em torno de linha 484):**

```typescript
finalidade_evento: (merged.finalidade_evento || merged.subtipo_evento || merged.categoria_evento || merged.descricao) as string | undefined,
```

**Problema:** `merged.subtipo_evento` e `merged.categoria_evento` podem não existir em
`ActionData['data']` (campos removidos da interface). TypeScript pode reclamar.

**Ação:** Simplificar para apenas `merged.finalidade_evento` (que ainda existe):
```typescript
finalidade_evento: (merged.finalidade_evento || merged.descricao) as string | undefined,
```

**Alternativa segura** (se quiser manter compatibilidade com dados antigos no `collectedData`):
```typescript
const mergedAny = merged as Record<string, unknown>;
finalidade_evento: (mergedAny.finalidade_evento || mergedAny.subtipo_evento || mergedAny.categoria_evento || mergedAny.descricao) as string | undefined,
```

---

## Problema 4 — `CollectedData` type alias desnecessário em simpleOrchestrator.ts

**Arquivo:** `src/core/orchestrator/simpleOrchestrator.ts`
**Linha 15:**
```typescript
type CollectedData = Record<string, unknown>;
```

Este alias só existe porque era usado pela função `extractCollectedData` (removida).
Verificar se ainda é usado no arquivo:

```
Grep: CollectedData
```

Se aparecer em:
- Linha da declaração do tipo
- Linha da variável `const collectedData = (savedContext.collected_data || {}) as CollectedData;`

E em mais nenhum lugar → remover o alias e usar `Record<string, unknown>` diretamente:
```typescript
// Antes:
const collectedData = (savedContext.collected_data || {}) as CollectedData;

// Depois:
const collectedData = (savedContext.collected_data || {}) as Record<string, unknown>;
```

E remover a linha `type CollectedData = Record<string, unknown>;`.

---

## Problema 5 — Verificar import `EventStatus` em simpleOrchestrator.ts

**Arquivo:** `src/core/orchestrator/simpleOrchestrator.ts`
**Linha 6:**
```typescript
import { UUID, EventStatus, ChatUiPayload, ListEventsPayload, RecentEvent } from '@/types/domain';
```

`EventStatus` é usado em vários lugares do arquivo como cast (ex: `'created' as EventStatus`).
Verificar que ainda é usado; se não for, remover do import.
**Expectativa:** ainda é usado → manter.

---

## Problema 6 — `executeItemEdit` tem parâmetro `userId` não utilizado em groqService.ts

**Diagnóstico:** `'userId' is declared but its value is never read` (hint 6133, ~linha 665)

**Arquivo:** `src/services/groqService.ts`
**Função:** `executeItemEdit(command, eventoId, userId)`

O `userId` não é usado internamente (a edição usa apenas `eventoId`).

**Opção A (recomendada):** Manter o parâmetro com underscore prefix para suprimir o hint:
```typescript
export async function executeItemEdit(
  command: import('@/core/orchestrator/itemCommands').EditItemCommand,
  eventoId: string,
  _userId: UUID  // prefixo _ = intencionalmente não usado (mantido para API compatível)
```
Atualizar a assinatura e o `userId: UUID` → `_userId: UUID`.

**Opção B:** Remover o parâmetro e atualizar todos os callers.
- `simpleOrchestrator.ts` linha ~121: `executeItemEdit(itemCommand, currentEventId, userId)` → `executeItemEdit(itemCommand, currentEventId)`
- `groqService.ts executeAction case 'edit_item'`: `executeItemEdit(editCommand, eventoIdCandidate, userId)` → `executeItemEdit(editCommand, eventoIdCandidate)`
- Assinatura: remover `userId: UUID` e o import de `UUID` se não for mais usado.

**Recomendação:** Opção A é mais segura (mantém compatibilidade futura).

---

## Verificação End-to-End

Após todos os fixes, executar o app e testar o fluxo completo:

### Teste 1: Criação de evento (fluxo básico)
```
Usuário: "churrasco 10 pessoas sábado"
Esperado: IA pergunta "Quer criar?" (SEM criar ainda)

Usuário: "sim"
Esperado: Evento criado no Supabase, IA oferece gerar lista
→ Console: [GroqService] Ação detectada: create_event

Usuário: "pode gerar"
Esperado: Lista aparece no chat
→ Console: [GroqService] Ação detectada: generate_items
```

### Teste 2: Edição de itens (após lista gerada)
```
(com evento ativo e lista gerada)
Usuário: "adiciona 10 cervejas"
→ Console: [simpleOrchestrator] Edição de alta confiança: add
Esperado: Item adicionado sem chamar LLM, mensagem de feedback

Usuário: "tira o refrigerante"
→ Console: [simpleOrchestrator] Edição de alta confiança: remove
Esperado: Item removido

Usuário: "dobra tudo"
→ Console: [simpleOrchestrator] Edição de alta confiança: multiply
Esperado: Todas as quantidades dobradas
```

### Teste 3: Fallback
```
Usuário: "aquele negócio"
Esperado: IA responde com pergunta de clarificação
NÃO deve: retornar JSON, criar evento, ou quebrar
```

### Teste 4: Timeout de sessão
```
1. Alterar SESSION_TIMEOUT_MS temporariamente para 1000 (1 segundo)
2. Enviar uma mensagem
3. Esperar 2 segundos
4. Enviar outra mensagem
→ Se não havia evento ativo: contexto limpo, nova sessão
→ Se havia evento ativo: histórico zerado, evento preservado
5. Restaurar SESSION_TIMEOUT_MS para 4 * 60 * 60 * 1000
```

### Teste 5: Sugestões contextuais
```
Quando IA pergunta "quantas pessoas?":
→ Sugestões devem ser: ["10 pessoas", "15 pessoas", "20 pessoas"]

Quando IA pergunta "quer criar?":
→ Sugestões devem ser: ["Sim, criar!", "Mudar data", "Mudar quantidade"]

Quando lista está gerada:
→ Sugestões devem ser: ["Ver lista completa", "Editar itens", "Confirmar evento"]
```

---

## Checklist

- [ ] `buildEventName` verificado — removido se não usado
- [ ] `EventContext` interface limpa (sem `categoria_evento` e `subtipo_evento`)
- [ ] `merged.subtipo_evento` corrigido em `executeAction`
- [ ] `CollectedData` alias removido ou mantido conforme análise
- [ ] `_userId` prefix adicionado em `executeItemEdit`
- [ ] Nenhum erro TypeScript de severidade Error nos dois arquivos principais
- [ ] Todos os 5 testes end-to-end passando manualmente
- [ ] Build do projeto sem erros: `npm run build` (ou `vite build`)

---

## Notas Adicionais

### Sobre `sistema de camada conversacional`
O `wrapWithConversationalTone` (de `conversationalResponse.ts`) ainda está no fluxo.
Ele adiciona tom conversacional quando o evento é finalizado ou quando itens são gerados.
Não precisa ser removido — é uma camada de qualidade que funciona independentemente.

### Sobre o import `validateEventDate`
O `validateEventDate` de `@/core/nlp/date-parser` ainda é usado em `simpleOrchestrator.ts`
(em torno da linha 164) para validar datas no passado. Manter esse import.

### Sobre o `EventContext.hasParticipants`
O campo `hasParticipants` existe em `EventContext` mas nunca é passado pelos callers atuais.
Pode ser removido da interface ou mantido como campo opcional para uso futuro.
**Recomendação:** Manter por ora, não é um erro.
