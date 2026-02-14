# Track 012 — detectEditIntentFromMessage() + Integração no Orquestrador

## Objetivo
Implementar uma função de "pré-triagem" que detecta com nível de confiança se a mensagem do usuário é um comando de edição de itens, antes mesmo de chamar o LLM.

## Arquivos Modificados
- `src/core/orchestrator/itemCommands.ts` - Adicionada função `detectEditIntentFromMessage()`
- `src/core/orchestrator/simpleOrchestrator.ts` - Integração da pré-triagem no fluxo

## Implementação

### Passo 1 ✅
Adicionada função `detectEditIntentFromMessage()` em `itemCommands.ts`:
- Alta confiança: verbos imperativos explícitos (adiciona, tira, dobra, etc.)
- Média confiança: palavras de edição + número ou item
- Baixa confiança: menção a lista/itens

### Passo 2 ✅
Atualizado import em `simpleOrchestrator.ts` para incluir `detectEditIntentFromMessage`

### Passo 3 ✅
Substituído bloco de detecção no `simpleOrchestrator.ts`:
- Fluxo anterior: `parseItemCommand()` → execução direta
- Fluxo novo: `detectEditIntentFromMessage()` → alta confiança → `parseItemCommand()` → execução
- Confiança média/baixa: delega para LLM

## Fluxo de Decisão

```
detectEditIntentFromMessage()
  ├─ confidence: high  → parseItemCommand() → executeItemEdit() (sem LLM)
  ├─ confidence: medium → LLM com contexto de "provável edição"
  └─ confidence: low / false → LLM normal
```

## Testes Esperados

| Input do usuário | Resultado esperado |
|---|---|
| `adiciona 10 cervejas` | Alta confiança → executa sem LLM |
| `tira o refrigerante` | Alta confiança → executa sem LLM |
| `dobra tudo` | Alta confiança → executa sem LLM |
| `mais 5 cervejas` | Média confiança → vai para LLM |
| `faltou gelo` | Média confiança → LLM decide |
| `quero ver a lista` | Baixa confiança → LLM processa normalmente |
| `churrasco 10 pessoas sábado` | `isEditCommand: false` → fluxo normal |

## Status
- [x] Código implementado
- [x] Import atualizado
- [x] Bloco de detecção substituído
- [x] Documentação atualizada
