# Track 014 — Estabilização do Core (Banco, IA e Formulários)

## Objetivo
Eliminar erros de leitura/gravação, alinhar o banco de dados Supabase com o código da aplicação, destravar a inteligência da IA (LangGraph + Groq) e harmonizar os formulários de criação e detalhes de eventos.

---

## Arquivos & Recursos Impactados
- **Banco de Dados (Supabase via MCP):** DDL de limpeza de tabelas zumbis, políticas RLS em `table_reune` e `langgraph_checkpoints`.
- `src/services/groqService.ts`: Regra de bebidas alcoólicas, correção da tabela `event_items` e coluna `event_id`.
- `src/langgraph/checkpointer.ts`: Inclusão de `user_id` no metadata do checkpoint para passar pelo RLS.
- `src/langgraph/agents/routerAgent.ts`: Consciência de estado conversacional (evitar desvio para chat genérico).
- `src/pages/CreateEvent.tsx`: Correção do status `'created'` e adição de `qtd_pessoas` e `tipo_evento`.
- `src/hooks/useEvent.tsx`: Expansão da interface `Event` com `tipo_evento`, `qtd_pessoas` e `menu`.
- `src/pages/EventDetails.tsx`: Exibição de `qtd_pessoas` e remoção do `window.location.reload()`.

---

## Plano de Execução Detalhado

### Fase 1: Saneamento do Banco de Dados (Supabase via MCP)
- [x] **1.1 Proteger tabelas zumbis sem uso** habilitando RLS em `distribuicao_itens`, `participantes_evento`, `itens_evento`, `eventos`, `preferencias_usuario`.
- [x] **1.2 Desbloquear leitura pública de eventos** na `table_reune` e `event_items` para a role `public`/`anon` (permitir que convidados abram o link de convite sem login).
- [x] **1.3 Corrigir política RLS de `langgraph_checkpoints`** aceitando `thread_id` e autenticação válida.
- [x] **1.4 Testar e validar** a integridade referencial com os 10 eventos reais e 79 itens existentes (0 itens órfãos).

### Fase 2: Blindagem da IA e LangGraph
- [x] **2.1 Corrigir bug da exclusão de álcool** em `groqService.ts` (`params.excluir_alcool === true`), garantindo cerveja por padrão em eventos adultos/churrascos.
- [x] **2.2 Corrigir busca de itens para edição** em `groqService.ts` substituindo `.from('itens')` por `.from('event_items').eq('event_id', Number(eventoId))`.
- [x] **2.3 Atualizar `checkpointer.ts`** para incluir `user_id` em `metadata`, permitindo gravação de checkpoints com sucesso.
- [x] **2.4 Tornar o `routerAgent.ts` consciente de estado**: se houver `eventId` ativo ou coleta em andamento, manter roteamento em `agenda` para respostas como números, datas e confirmações.
- [x] **2.5 Executar testes unitários** (`npm run test:unit`) para validar que nenhum teste existente quebrou (183/183 passando).

### Fase 3: Alinhamento dos Formulários na UI
- [x] **3.1 Corrigir `CreateEvent.tsx`**:
  - Trocar status `'published'` para `'created'`.
  - Adicionar campo de entrada para **Quantidade de Pessoas** (`qtd_pessoas`).
  - Mapear modelo selecionado para `tipo_evento`.
- [x] **3.2 Atualizar `src/hooks/useEvent.tsx`**:
  - Incluir `tipo_evento`, `qtd_pessoas`, `menu`, `categoria_evento` na interface `Event`.
- [x] **3.3 Atualizar `EventDetails.tsx`**:
  - Exibir e permitir edição de `qtd_pessoas`.
  - Substituir `window.location.reload()` por invalidação reativa de query.
- [x] **3.4 Rodar `npm run type-check` e `npm run build`** para assegurar compilação limpa.

---

## Critérios de Aceite (Definition of Done)
1. Banco limpo de tabelas legadas sem quebrar nenhuma tabela em produção (`table_reune`, `event_items`, `event_invitations`).
2. Convidados conseguem carregar o evento público sem erro 401 de RLS.
3. IA gera churrasco com cerveja e itens podem ser editados no chat sem erro de tabela inexistente.
4. Checkpoints do LangGraph gravam com sucesso em `langgraph_checkpoints`.
5. Formulário manual cria evento com status `'created'` e `qtd_pessoas` populado.
6. `npm run test:unit` e `npm run type-check` 100% verdes.
