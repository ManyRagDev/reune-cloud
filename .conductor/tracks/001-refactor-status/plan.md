# Refatoração dos Status de Eventos
**Data:** 07/01/2026
**Responsável:** Antigravity (Conductor Replacement)

## Contexto
O sistema possuía múltiplos status granulares (`collecting_core`, `aguardando_data`, `itens_pendentes_confirmacao`, etc.) que dificultavam a manutenção e causavam inconsistências. A decisão foi simplificar para 4 status canônicos.

## Mudanças Realizadas

### 1. Novo Fluxo de Status
Os status permitidos agora são estritamente:
- `draft`: Evento em fase de planejamento/coleta de dados.
- `created`: Dados coletados, itens gerados (se aplicável), aguardando confirmação final.
- `finalized`: Evento confirmado pelo usuário.
- `cancelled`: Evento cancelado.

### 2. Arquivos Impactados

#### `src/core/orchestrator/eventManager.ts`
- **Reparo Crítico:** Arquivo reescrito para remover código corrompido/comentado.
- **Lógica:** 
  - `upsertEvent`: Define status inicial como `draft`.
  - `generateItemList`: Gera itens e retorna lista (não altera status diretamente).
  - `setEventStatus`: Função utilitária para transições.
  - Removidas funções legadas que usavam status antigos.

#### `src/services/groqService.ts`
- Atualizada máquina de estados para usar `draft` durante toda a coleta.
- Ao gerar itens com sucesso, transiciona para `created`.
- Ao confirmar evento, transiciona para `finalized`.
- Removidas verificações de `collecting_core` e `itens_pendentes_confirmacao`.

#### `src/db/repositories/events.ts`
- Atualizada a lista de `openStatuses` para buscar apenas `['draft', 'created']`.

#### `src/core/orchestrator/simpleOrchestrator.ts`
- Atualizada lógica de "Detect Action" para usar `created` e `finalized`.
- Corrigido reset de contexto para ocorrer apenas em `finalized` ou `cancelled`.
- Mapeamento de UI ajustado.

#### `src/components/ChatWidget.tsx`
- Atualizada verificação de `isFinishedEvent` para `['finalized', 'cancelled']`.
- Atualizado estado inicial de edição para `draft`.

#### `src/pages/EventDetails.tsx`
- Adicionado seletor manual de status no header (visível apenas para organizadores).
- Implementada lógica `handleStatusChange` para atualização direta no banco.
- Feedback visual (Toast) ao alterar status.

### 3. Estratégia de Migração de Dados (CRÍTICO)
Como o banco de dados já contém eventos com os status antigos (`collecting_core`, etc), é necessário normalizar os dados para não quebrar a aplicação.
Abaixo o script SQL para execução imediata no Supabase SQL Editor:

```sql
-- Script de Migração de Dados Legados
UPDATE public.table_reune
SET status = CASE
    WHEN status IN ('collecting_core', 'aguardando_data', 'aguardando_preferencia_menu') THEN 'draft'
    WHEN status IN ('itens_pendentes_confirmacao', 'distrib_pendente_confirmacao') THEN 'created'
    WHEN status = 'finalizado' THEN 'finalized'
    WHEN status = 'cancelado' THEN 'cancelled'
    ELSE 'draft'
END
WHERE status NOT IN ('draft', 'created', 'finalized', 'cancelled');
```

### 4. Correções e Ajustes (08/01/2026)
- **Correção na Listagem:** `EventsRepository` atualizado para listar todos os eventos exceto `finalized` (inclui `draft`, `created`).
- **Fluxo de Edição Refinado:** 
  - Ação `update_event` agora é silenciosa (sem geração de itens não solicitada).
  - Chat fecha automaticamente após confirmação de atualização simples (ex: mudança de data).
  - Geração de itens (`generate_items`) restrita a pedidos explícitos.
- **Correção Crítica Dashboard:** Removida ordenação server-side (`order by`) que causava erro 500/CORS em indexação. Ordenação mantida no cliente.

## Próximos Passos
- Monitorar logs para garantir que nenhuma query RPC falhe por ENUM inválido.
