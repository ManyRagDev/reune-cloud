# Especificação: Unificar Chamadas LLM (Performance)

## Contexto
Atualmente toda mensagem do usuário dispara 2 chamadas à API do Groq:
1. **Planner** (temperatura 0.1): Extrai intenção e dados estruturados
2. **Response** (temperatura 0.7): Gera resposta conversacional

Isso dobra o tempo de resposta e dobra o consumo de tokens.

## Objetivo
Reduzir para 1 chamada única mantendo a qualidade da extração e da resposta.

## Solução Proposta: Single-Pass com Prompt Estruturado

### Formato de Saída Esperado
A IA deve retornar JSON contendo tanto a intenção quanto a resposta:

```json
{
  "intent": "create_event | generate_items | update_event | confirm_event | edit_items | request_confirmation | conversational",
  "extracted_data": {
    "tipo_evento": "string",
    "qtd_pessoas": 10,
    "data_evento": "2025-12-25"
  },
  "response": "Mensagem conversacional para o usuário",
  "requires_confirmation": false,
  "suggested_replies": ["Sim", "Não", "Mudar data"]
}
```

### Vantagens
- **1 chamada só** em vez de 2
- **Temperatura única** (0.5) - equilíbrio entre precisão e naturalidade
- **Mais simples** de manter
- **Menor latência** (~40-50% mais rápido)

### Desafios
- Prompt precisa ser muito bem escrito para não perder qualidade
- Temperatura intermediária pode afetar: 
  - Extração (precisa ser precisa → baixa temp)
  - Resposta (precisa ser natural → alta temp)

### Estratégia de Mitigação
Usar **temperatura 0.3** e prompts muito explícitos:
- Instruções claras de extração (JSON estrito)
- Exemplos de respostas naturais
- Fallback: se JSON falhar, fazer segunda chamada só para resposta

## Implementação

### Novo Prompt Unificado
```
Você é o UNE.AI, assistente de eventos.

TAREFA: Analisar a mensagem do usuário e retornar JSON.

REGRAS DE EXTRAÇÃO:
1. Identifique intenção (create_event, edit_items, etc.)
2. Extraia dados estruturados (tipo, qtd, data)
3. Se dados estiverem completos mas ação for irreversível, marcar requires_confirmation: true

REGRAS DE RESPOSTA:
1. Seja natural, casual, use emojis moderados
2. Se requires_confirmation for true, pergunte se pode prosseguir
3. Sugira respostas rápidas quando apropriado

FORMATO OBRIGATÓRIO (JSON):
{
  "intent": "...",
  "extracted_data": {...},
  "response": "...",
  "requires_confirmation": boolean,
  "suggested_replies": [...]
}

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional.
```

### Modificações

1. **`src/services/groqService.ts`:**
   - Nova função `processMessageUnified()`
   - Prompt único com schema definido
   - Parser de JSON robusto (com fallback)
   - Temperatura 0.3

2. **`src/core/orchestrator/simpleOrchestrator.ts`:**
   - Substituir chamada dupla por chamada única
   - Extrair campos do JSON retornado
   - Manter lógica de estado

## Critérios de Aceitação
- [ ] Apenas 1 chamada LLM por mensagem do usuário
- [ ] Qualidade de extração mantida (testar com casos complexos)
- [ ] Qualidade de resposta mantida (ainda soa natural)
- [ ] Latência reduzida em pelo menos 30%
- [ ] Fallback funciona se JSON falhar

## Nota sobre o Groq
O Groq é realmente rápido (processamento em ~100-200ms), mas:
- 2 chamadas = 2x latência de rede (pode ser 300-500ms cada)
- 2 chamadas = 2x chance de erro de rede
- Unificar simplifica o código e melhora UX

## Decisão do Usuário
Esta track é **opcional** e deve ser discutida antes de implementar, pois:
- Se o atual já está "rápido o suficiente", pode não valer o esforço
- Mudança arriscada (pode quebrar extração ou resposta)
- Requer testes extensivos

**Recomendação:** Implementar as tracks 005, 006, 007 primeiro. Depois avaliar se esta é necessária.
