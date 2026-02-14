# Track 012 — detectEditIntentFromMessage() + Integração no Orquestrador

## Contexto
Durante a refatoração da UNE.AI (sessão anterior), a maior parte das tarefas foi concluída.
Esta track implementa a última funcionalidade pendente: uma função de "pré-triagem" que
detecta com nível de confiança se a mensagem do usuário é um comando de edição de itens,
antes mesmo de chamar o LLM.

**Arquivo alvo:** `src/core/orchestrator/itemCommands.ts`
**Arquivo de integração:** `src/core/orchestrator/simpleOrchestrator.ts`

---

## Estado Atual

### `itemCommands.ts` (atual, linhas importantes)

O arquivo já tem `parseItemCommand()` que faz o parse completo de um comando de edição.
O problema é que `parseItemCommand` retorna `null` para comandos ambíguos como "mais 5 cervejas"
ou "preciso de mais gelo", que poderiam ser edições mas não casam com os regex exatos.

A nova função `detectEditIntentFromMessage()` deve ser a primeira barreira — mais permissiva,
avalia se a mensagem *parece* ser um comando de edição antes de passar para o LLM.

### `simpleOrchestrator.ts` (estado atual, linha ~116)

```typescript
const itemCommand = parseItemCommand(userText);
if (itemCommand && currentEventId) {
  // executa edição diretamente
  ...
}
// se não for comando, vai para o LLM
```

O fluxo atual usa APENAS `parseItemCommand` (alta precisão, pode perder casos médios).
Após esta track, o fluxo será:

```
detectEditIntentFromMessage()
  └─ confidence: high  → parseItemCommand() → executeItemEdit() (sem LLM)
  └─ confidence: medium → LLM com contexto de "provável edição"
  └─ confidence: low / false → LLM normal
```

---

## Implementação

### Passo 1 — Adicionar `detectEditIntentFromMessage()` em `itemCommands.ts`

Adicionar ao FINAL do arquivo (após `generateEditFeedback`), antes do último `}` se houver,
ou simplesmente append no final do arquivo.

```typescript
/**
 * Pré-triagem de intenção de edição de itens.
 * Mais permissiva que parseItemCommand — usada para decidir se vale chamar o LLM
 * ou se podemos executar diretamente.
 *
 * confidence: 'high'   → parseItemCommand() deve resolver, executar sem LLM
 * confidence: 'medium' → enviar para LLM com contexto de edição ativo
 * confidence: 'low'    → pode ser edição, enviar para LLM normalmente
 */
export function detectEditIntentFromMessage(message: string): {
  isEditCommand: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestedOperation?: 'add' | 'remove' | 'update' | 'multiply';
} {
  const lower = message.toLowerCase().trim();

  // ─── ALTA CONFIANÇA: verbos imperativos explícitos no início da frase ────
  const highConfidence: Array<[RegExp, 'add' | 'remove' | 'update' | 'multiply']> = [
    [/^(adiciona|coloca|bota|inclui|põe|poe)\s+/i, 'add'],
    [/^(tira|remove|exclui|apaga|retira|deleta)\s+/i, 'remove'],
    [/^(muda|altera|troca|modifica)\s+.+\s+(pra|para)\s+\d+/i, 'update'],
    [/^(aumenta|sobe|diminui|reduz|baixa)\s+.+\s+(pra|para|a|em)\s+\d+/i, 'update'],
    [/^(dobra|duplica|triplica|multiplica)\s+/i, 'multiply'],
    [/^nao\s+(quero|preciso|quer)\s+/i, 'remove'],
  ];

  for (const [pattern, op] of highConfidence) {
    if (pattern.test(lower)) {
      return { isEditCommand: true, confidence: 'high', suggestedOperation: op };
    }
  }

  // ─── MÉDIA CONFIANÇA: palavra de edição + quantidade numérica ────────────
  const editKeywords = ['mais', 'menos', 'adicional', 'extra', 'falta', 'sobra'];
  const hasEditKeyword = editKeywords.some(kw => lower.includes(kw));
  const hasNumber = /\d+/.test(lower);
  const hasItemWord = /\b(cerveja|carne|pão|pao|gelo|refrigerante|agua|água|carvão|carvao|item|produto)\b/i.test(lower);

  if (hasEditKeyword && hasNumber) {
    return { isEditCommand: true, confidence: 'medium' };
  }
  if (hasEditKeyword && hasItemWord) {
    return { isEditCommand: true, confidence: 'medium' };
  }

  // ─── BAIXA CONFIANÇA: contexto sugere manipulação de lista ───────────────
  if (lower.includes('lista') || lower.includes('item') || lower.includes('itens')) {
    return { isEditCommand: true, confidence: 'low' };
  }

  return { isEditCommand: false, confidence: 'low' };
}
```

---

### Passo 2 — Atualizar import em `simpleOrchestrator.ts`

**Arquivo:** `src/core/orchestrator/simpleOrchestrator.ts`
**Linha atual (13):**

```typescript
import { parseItemCommand } from './itemCommands';
```

**Substituir por:**

```typescript
import { parseItemCommand, detectEditIntentFromMessage } from './itemCommands';
```

---

### Passo 3 — Atualizar o bloco de detecção em `simpleOrchestrator.ts`

**Localizar o bloco (em torno da linha 114):**

```typescript
  // Verificar se é comando de edição de itens (Track 006)
  // Se o usuário está editando itens, processar diretamente sem chamar IA
  const itemCommand = parseItemCommand(userText);
  if (itemCommand && currentEventId) {
    console.log('[simpleOrchestrator] Comando de edição detectado:', itemCommand.operation);

    try {
      const editResult = await executeItemEdit(itemCommand, currentEventId, userId);
      ...
    }
  }
```

**Substituir por:**

```typescript
  // Verificar se é comando de edição de itens (Track 012)
  // Pré-triagem com detectEditIntentFromMessage antes de chamar o LLM
  const editIntent = detectEditIntentFromMessage(userText);

  if (editIntent.isEditCommand && currentEventId) {
    if (editIntent.confidence === 'high') {
      // Alta confiança: tentar parseItemCommand diretamente, sem chamar LLM
      const itemCommand = parseItemCommand(userText);
      if (itemCommand) {
        console.log('[simpleOrchestrator] Edição de alta confiança:', itemCommand.operation);
        try {
          const editResult = await executeItemEdit(itemCommand, currentEventId, userId);
          await contextManager.saveMessage(userId, 'user', userText, Number(currentEventId));
          await contextManager.saveMessage(userId, 'assistant', editResult.message, Number(currentEventId));
          const snapshot = await getPlanSnapshot(currentEventId);
          return {
            estado: 'created' as EventStatus,
            evento_id: currentEventId,
            mensagem: editResult.message,
            snapshot: snapshot || undefined,
            showItems: true,
            suggestedReplies: ['Editar mais itens', 'Confirmar lista', 'Adicionar participantes'],
          };
        } catch (error) {
          console.error('[simpleOrchestrator] Erro ao editar item:', error);
          return {
            estado: 'created' as EventStatus,
            evento_id: currentEventId,
            mensagem: 'Ops! Não consegui fazer essa alteração. Pode tentar de outro jeito?',
            showItems: false,
            suggestedReplies: ['Ver lista completa', 'Cancelar'],
          };
        }
      }
      // Se parseItemCommand retornou null apesar de alta confiança, cai no LLM
    }
    // Confiança média/baixa: o LLM vai decidir (contexto de event ID já está disponível)
    console.log('[simpleOrchestrator] Possível edição (confiança:', editIntent.confidence, ') — delegando ao LLM');
  }
```

**ATENÇÃO:** O bloco antigo tinha:
```typescript
  const itemCommand = parseItemCommand(userText);
  if (itemCommand && currentEventId) {
    ...
  }
```
Esse bloco inteiro deve ser **substituído** pelo novo bloco acima. Não deixar o `parseItemCommand`
duplicado.

---

## Verificação

Após implementar, testar os seguintes casos no chat:

| Input do usuário | Resultado esperado |
|---|---|
| `adiciona 10 cervejas` | Alta confiança → executa sem LLM → "Pronto! Adicionei 10 cerveja na lista ✓" |
| `tira o refrigerante` | Alta confiança → executa sem LLM → "Removido! Tirei refrigerante da lista ✓" |
| `dobra tudo` | Alta confiança → executa sem LLM → "Feito! Dobrado todos os itens ✓" |
| `mais 5 cervejas` | Média confiança → vai para LLM que retorna `edit_item` JSON |
| `faltou gelo` | Média confiança → LLM decide se é edição ou conversa |
| `quero ver a lista` | Baixa confiança → LLM processa normalmente |
| `churrasco 10 pessoas sábado` | `isEditCommand: false` → fluxo normal de criação |

---

## Checklist

- [ ] `detectEditIntentFromMessage()` adicionada no final de `itemCommands.ts`
- [ ] Export da função confirmado
- [ ] Import atualizado em `simpleOrchestrator.ts`
- [ ] Bloco de detecção substituído pelo novo (não duplicar lógica)
- [ ] Nenhum erro TypeScript novo introduzido
- [ ] Teste manual: "adiciona 10 cervejas" com evento ativo → executa sem chamar LLM
- [ ] Teste manual: "mais 5 cervejas" com evento ativo → LLM retorna edit_item JSON corretamente
