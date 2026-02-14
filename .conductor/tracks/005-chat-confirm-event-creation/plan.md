# Plan: Confirmação Antes de Criar Evento

## Objetivos
- Criar fluxo mais natural com confirmação explícita do usuário
- Evitar criação de eventos com dados errados
- Dar sensação de controle ao usuário

## Mudanças Propostas

### 1. `src/services/groqService.ts`
- [x] Adicionar nova ação `request_confirmation` no schema
- [x] Modificar lógica: só criar evento quando intenção for `confirmed`
- [x] Adicionar mensagem de confirmação amigável

### 2. `src/core/orchestrator/simpleOrchestrator.ts`
- [x] Adicionar estado `confirming` no fluxo
- [x] Detectar quando dados estão completos mas não confirmados
- [x] Retornar payload com `suggestedReplies` para confirmação/correção
- [x] Só executar `create_event` após confirmação explícita

### 3. `src/core/orchestrator/chatTemplates.ts`
- [ ] Adicionar templates para:
  - `confirm_event_creation`: "Entendi! Você quer [tipo] para [qtd] pessoas em [data]. Posso criar?"
  - `confirm_generate_items`: "Posso montar a lista de itens agora?"

### 4. `src/components/ChatWidget.tsx`
- [x] Adicionar sugestões rápidas para confirmação
- [x] Garantir que sugestões de correção funcionem

## Validação
1. Testar: "churrasco 10 pessoas dia 25/12" → deve perguntar antes de criar
2. Testar: clicar em "Sim, criar!" → cria evento
3. Testar: clicar em "Mudar quantidade" → permite corrigir
4. Testar: fluxo gradual (só tipo → só qtd → data → confirmação)
