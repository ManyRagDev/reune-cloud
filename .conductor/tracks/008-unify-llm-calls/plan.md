# Plan: Unificar Chamadas LLM (Performance)

## Status
🟡 **OPCIONAL** - Aguardando decisão do usuário

## Objetivos
- Reduzir de 2 chamadas LLM para 1 por mensagem
- Diminuir latência em ~40%
- Simplificar código do orquestrador

## Pré-requisitos
- [ ] Tracks 005, 006, 007 concluídas
- [ ] Testes de regressão passando

## Mudanças Propostas

### 1. `src/services/groqService.ts`
- [ ] Criar função `processMessageUnified()`
- [ ] Criar prompt unificado (extraction + response)
- [ ] Definir schema de saída estrito
- [ ] Temperatura 0.3 (equilíbrio)
- [ ] Implementar fallback para chamada dupla se falhar

### 2. `src/services/groqService.ts` - Prompt Unificado
```typescript
const unifiedSystemPrompt = `
Você é o UNE.AI. Analise a mensagem e retorne JSON:

{
  "intent": "create_event|generate_items|update_event|confirm_event|edit_items|request_confirmation|conversational",
  "extracted_data": { "tipo_evento": "", "qtd_pessoas": 0, "data_evento": "" },
  "response": "mensagem para o usuário",
  "requires_confirmation": false,
  "suggested_replies": []
}

REGRAS:
- Se tiver dados suficientes para ação irreversível, requires_confirmation = true
- Response deve ser natural, casual, em português
- NUNCA inclua markdown no JSON
`;
```

### 3. `src/core/orchestrator/simpleOrchestrator.ts`
- [ ] Substituir chamada dupla por chamada única
- [ ] Extrair `intent`, `response`, `suggestedReplies` do JSON
- [ ] Manter lógica de estado e persistência

### 4. Testes
- [ ] Testar extração com casos complexos
- [ ] Testar respostas naturais
- [ ] Medir latência antes/depois
- [ ] Testar fallback quando JSON falha

## Validação
1. Medir tempo de resposta atual (baseline)
2. Implementar versão unificada
3. Medir novo tempo (deve ser <70% do original)
4. Testar 20+ cenários diferentes
5. Comparar qualidade das respostas (A/B test manual)

## Riscos
| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Extração piora | Média | Prompt bem escrito + testes |
| Respostas ficam robóticas | Média | Exemplos no prompt + temp baixa |
| JSON inválido | Baixa | Parser robusto + fallback |

## Decisão
**Aguardando:** Usuário deve aprovar antes de implementar.
- Se quiser prosseguir, marcar track como ativa
- Se preferir manter atual, arquivar track
