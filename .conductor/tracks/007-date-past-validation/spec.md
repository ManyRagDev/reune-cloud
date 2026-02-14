# Especificação: Validação de Data no Passado

## Contexto
O chat aceita datas que já passaram sem avisar o usuário. Isso pode acontecer por:
- Erro de digitação (25/01/2025 em vez de 25/01/2026)
- Confusão de formato (12/01 pode ser jan/12 ou dez/01)
- Desatenção do usuário

## Objetivo
Detectar quando o usuário informa uma data no passado e alertar antes de prosseguir.

## Comportamento Esperado

### Caso 1: Data no Passado
```
Usuário: "Quero fazer dia 01/01/2020"
Chat: "Ops! Essa data já passou (01/01/2020). Você quer dizer 01/01/2026?"
     [sugestões: "Sim, 2026", "Digitar outra data"]
```

### Caso 2: Data de Hoje
```
Usuário: "Quero fazer hoje"
Chat: "Combinado para hoje (30/01/2026)!"
     [sem alerta, hoje é válido]
```

### Caso 3: Data no Futuro Próximo (Próximos 7 dias)
```
Usuário: "Quero fazer amanhã"
Chat: "Amanhã (31/01/2026) está bem próximo! Tem certeza que consegue organizar a tempo?"
     [sugestão: "Sim, tenho", "Mudar data"]
```

## Regras de Validação

| Data | Ação |
|------|------|
| Antes de hoje | ❌ Bloquear + Alerta + Sugerir correção |
| Hoje | ✅ Permitir (com aviso opcional) |
| Amanhã até 7 dias | ⚠️ Permitir com alerta de "muito em cima" |
| 8+ dias | ✅ Permitir sem alerta |

## Implementação

### Local da Validação
**Opção:** `src/core/nlp/date-parser.ts` (já existe)
- Adicionar função `isDateInPast(dateString: string): boolean`
- Adicionar função `isDateTooClose(dateString: string): boolean`

### Modificações no Fluxo

1. **No `simpleOrchestrator.ts`:**
   - Quando detectar data extraída, validar antes de salvar
   - Se no passado: retornar mensagem de erro + não salvar
   - Se muito próxima: retornar aviso mas permitir continuar

2. **No `groqService.ts`:**
   - Incluir regra no system prompt: "NUNCA aceite datas no passado"
   - Se IA retornar data no passado, corrigir ou pedir novamente

## Edge Cases

### Fuso Horário
- Usar data local do usuário (não UTC)
- Considerar que "hoje" às 23h é diferente de "hoje" às 1h

### Ano Omissos
- "25/12" sem ano → assumir próximo 25/12 (se já passou este ano, próximo ano)
- Se 25/12 já passou (estamos em dezembro), é válido para ano seguinte

### Datas Relativas
- "ontem" → detectar e alertar
- "hoje" → permitir
- "amanhã" → permitir com aviso se for muito em cima

## Critérios de Aceitação
- [ ] Data no passado é bloqueada com alerta amigável
- [ ] Sugestão de correção do ano é oferecida
- [ ] Data de hoje é aceita
- [ ] Datas próximas (1-7 dias) mostram aviso mas permitem continuar
- [ ] Datas relativas ("ontem", "hoje", "amanhã") são tratadas corretamente
