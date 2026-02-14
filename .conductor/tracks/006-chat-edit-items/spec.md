# Especificação: Edição de Itens via Chat

## Contexto
Hoje, depois que a lista de itens é gerada, o usuário não pode modificar ela pelo chat. Ele precisa sair do chat e editar manualmente no app. Isso quebra o fluxo conversacional.

## Objetivo
Permitir que o usuário modifique a lista de itens usando comandos naturais no chat.

## Comandos Suportados

### 1. Adicionar Item
```
Usuário: "Adiciona 10 cervejas a mais"
Chat: "Pronto! Adicionei 10 cervejas na lista."
```

### 2. Remover Item
```
Usuário: "Tira o carvão da lista"
Chat: "Removido! Tirei o carvão."
```

### 3. Alterar Quantidade
```
Usuário: "Aumenta a carne pra 5kg"
Chat: "Alterado! A carne agora é 5kg."
```

### 4. Alterar Múltiplos
```
Usuário: "Dobra todas as bebidas"
Chat: "Feito! Dobrei as quantidades de cerveja e refrigerante."
```

## Implementação

### Opção A: Via Prompt (Simplificado)
- Adicionar ao system prompt exemplos de comandos de edição
- IA interpreta e retorna JSON:
```json
{
  "action": "edit_items",
  "data": {
    "operation": "add|remove|update",
    "item_name": "cerveja",
    "quantity_change": 10
  }
}
```

### Opção B: Via Orquestrador (Mais Robusto)
- Criar parser específico para comandos de edição
- Regex para detectar padrões comuns:
  - "(tira|remove|exclui) [item]"
  - "(adiciona|coloca|inclui) [quantidade] [item]"
  - "(aumenta|diminui) [item] (para|pra) [quantidade]"

### Decisão: Opção Híbrida
1. Regex tenta identificar comando simples (rápido, não gasta tokens)
2. Se não identificar, delega pra IA (flexível, entende variações)

## Estrutura de Dados

```typescript
interface EditItemCommand {
  operation: 'add' | 'remove' | 'update' | 'multiply';
  target: 'specific' | 'category' | 'all';
  itemName?: string;
  category?: 'comida' | 'bebida' | 'descartaveis' | 'decoracao' | 'combustivel';
  quantity?: number;
  quantityDelta?: number; // para "mais 10" ou "menos 5"
  multiplier?: number;    // para "dobrar", "triplicar"
}
```

## Critérios de Aceitação
- [ ] Usuário pode adicionar item via chat
- [ ] Usuário pode remover item via chat
- [ ] Usuário pode alterar quantidade via chat
- [ ] Chat confirma a mudança mostrando o antes/depois
- [ ] Sugestões de resposta aparecem após edição ("Mais alguma coisa?", "Confirmar lista")
