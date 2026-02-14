# Plan: Edição de Itens via Chat

## Objetivos
- Permitir modificação da lista sem sair do chat
- Comandos naturais ("tira o carvão", "mais 10 cervejas")
- Feedback visual do que mudou

## Mudanças Propostas

### 1. `src/core/orchestrator/itemCommands.ts` (Novo Arquivo)
- [x] Criar parser com regex para comandos comuns
- [ ] Padrões a detectar:
  - Remover: `/^(tira|remove|exclui|apaga)\s+(.+)$/i`
  - Adicionar: `/^(adiciona|coloca|inclui|poe)\s+(\d+)?\s*(.+)$/i`
  - Atualizar: `/^(aumenta|diminui|muda)\s+(.+?)\s+(para|pra)\s+(\d+)$/i`
  - Multiplicar: `/^(dobra|triplica|dobrar|triplicar)\s*(.+)?$/i`
- [ ] Retornar `EditItemCommand` ou `null` se não for comando de edição

### 2. `src/services/groqService.ts`
- [x] Adicionar ação `edit_items`
- [x] Criar função `executeItemEdit()`
- [ ] Buscar itens atuais do evento
- [ ] Aplicar mudanças
- [ ] Salvar via `rpc.items_replace_for_event()`
- [ ] Retornar mensagem com resumo das alterações

### 3. `src/core/orchestrator/simpleOrchestrator.ts`
- [x] Antes de chamar IA, verificar se é comando de edição (regex rápido)
- [ ] Se for, executar direto sem chamar LLM
- [ ] Se não for, delegar pra IA normalmente
- [ ] Adicionar sugestões após edição: ["Editar mais", "Confirmar lista", "Ver lista completa"]

### 4. `src/components/ChatWidget.tsx`
- [ ] Mostrar diff visual quando item for editado (opcional)
- [ ] Atualizar snapshot após edição

## Validação
1. Testar: "tira o carvão" → remove item
2. Testar: "adiciona 10 cervejas" → adiciona item
3. Testar: "aumenta carne pra 5kg" → atualiza quantidade
4. Testar: "dobra todas as bebidas" → multiplica categoria
5. Testar: "quero remover o pão" → IA entende mesmo sem padrão exato
