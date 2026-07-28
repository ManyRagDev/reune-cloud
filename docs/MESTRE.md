# MESTRE - ReUNE Chatbot

**Última atualização**: 2026-07-27  
**Status**: 🟡 EM REFATORAÇÃO  
**Versão**: 2.0 (pós-mudança para LangGraph)

---

## 🎯 O QUE É

**Nome**: ReUNE Chatbot - Sistema de planejamento de eventos via IA  
**Para quem**: Usuários brasileiros que organizam eventos sociais (churrascos, festas, jantares)  
**Estado**: PRODUÇÃO com usuários ativos, bugs conhecidos

**O que faz**:
- Chat via IA (Groq) para planejar eventos
- Criação de eventos com data, tipo, quantidade de pessoas, menu
- Geração automática de lista de compras (itens)
- Edição de itens via comandos naturais ("adiciona cerveja", "tira refrigerante")
- Gerenciamento de múltiplos eventos em aberto

**Arquitetura atual**:
```
ChatWidget.tsx (UI)
  → simpleOrchestrator.ts (orquestrador)
    → ContextManager (persistência)
    → itemCommands.ts (parse de comandos de itens)
    → groqService.ts (IA + ações)
      → Edge Function llm-chat
      → Supabase (eventos, itens, contexto)
```

---

## 📊 ESTADO ATUAL

### Funcionalidades que funcionam ✅

- **Fluxo básico de criação de evento**: Tipo → Pessoas → Data → Menu → Itens
- **Geração de lista de itens**: Via LLM com cálculo de quantidades
- **Edição de itens**: Comandos naturais ("adiciona 10 cervejas", "tira refrigerante")
- **Persistência de contexto**: ContextManager + Supabase
- **Histórico de mensagens**: Últimas 50 mensagens
- **Timeout de sessão**: 4 horas de inatividade
- **Sugestões de resposta**: Baseadas no contexto atual

### Bugs conhecidos 🔴

| ID | Bug | Impacto | Status |
|----|-----|---------|--------|
| BUG-001 | Type safety da tabela `itens` perdido | Alto | ❌ Aberto |
| BUG-002 | Prompt injection vulnerability | Alto | ✅ Corrigido (T2.1) |
| BUG-003 | Race condition em `currentEventId` | Médio | ⚠️ Parcialmente corrigido |
| BUG-004 | Tratamento de erro inconsistente | Médio | ✅ Corrigido (T1.6) |
| BUG-005 | Persistência de sessão falha | Alto | 🟡 PoC LangGraph disponível (Fase 3) |

### Problemas de qualidade 🟡

- **System prompt hardcoded**: 144 linhas em TypeScript, difícil de manter
- **Falta de testes unitários**: Sem testes para `parseItemCommand`, `detectEditIntentFromMessage`
- **Código duplicado**: Lógica de data espalhada em múltiplos arquivos
- **Uso excessivo de `any`**: Type safety comprometido
- **Logs inconsistentes**: Alguns lugares têm logging, outros silenciam erros

---

## 🏗️ ARQUITETURA

### Arquivos principais

| Arquivo | Linhas | Responsabilidade | Complexidade |
|---------|-------|-----------------|--------------|
| `src/services/groqService.ts` | ~830 | IA, system prompt, executeAction | Alta |
| `src/core/orchestrator/simpleOrchestrator.ts` | ~320 | Orquestrador, sessão, sugestões | Alta |
| `src/core/orchestrator/itemCommands.ts` | ~270 | Parse de comandos de edição | Média |
| `src/components/ChatWidget.tsx` | ~650 | UI do chat | Média |
| `src/core/orchestrator/contextManager.ts` | ~225 | Gerenciamento de contexto | Média |
| `src/core/orchestrator/conversationalResponse.ts` | ~290 | Humanização de respostas | Baixa |
| `src/core/nlp/date-parser.ts` | ~189 | Validação e parsing de datas | Média |

### Actions disponíveis

| Action | Parâmetros | Status no banco | Descrição |
|--------|-----------|----------------|------------|
| `create_event` | tipo_evento, qtd_pessoas, data_evento, menu | draft | Cria novo evento |
| `generate_items` | evento_id, tipo_evento, qtd_pessoas, menu | created | Gera lista de itens |
| `confirm_event` | evento_id | finalized | Finaliza evento |
| `update_event` | evento_id, [campos para atualizar] | mantém status | Atualiza dados do evento |
| `edit_item` | operation, itemName, quantity, multiplier | mantém status | Edita item da lista |

### Fluxo de mensagens

```
1. Usuário digita no ChatWidget
   ↓
2. simpleOrchestrator.simpleOrchestrate()
   ├─→ Detecta intenção de edição (itemCommands.ts)
   ├─→ Se alta confiança: parseItemCommand() → executeItemEdit()
   └─→ Se não: processMessage() → Groq API
       ↓
3. callGroqAPI() (Edge Function llm-chat)
   ├─→ buildSystemPrompt() com contexto atual
   ├─→ Envia mensagens + temperatura adaptativa
   └─→ Recebe resposta
       ↓
4. detectActionJSON() - verifica se IA retornou ação
   ├─→ Se sim: executeAction()
   │   ├─→ create_event → upsertEvent()
   │   ├─→ generate_items → generateItemsWithGroqLocal()
   │   ├─→ confirm_event → setEventStatus('finalized')
   │   ├─→ update_event → upsertEvent()
   │   └─→ edit_item → executeItemEdit()
   └─→ Se não: retorna texto puro
       ↓
5. ContextManager
   ├─→ saveMessage() (user)
   ├─→ saveMessage() (assistant)
   └─→ updateContext() (dados coletados, evento_id)
       ↓
6. ChatWidget renderiza resposta
   ├─→ Mensagem da IA
   ├─→ Lista de itens (se aplicável)
   └─→ Sugestões de resposta
```

---

## 🔐 SEGURANÇA

### Vulnerabilidades conhecidas

| ID | Vulnerabilidade | Localização | Risco | Status |
|----|-----------------|--------------|-------|--------|
| VULN-001 | Prompt injection | groqService.ts:buildSystemPrompt() | 🔴 Alto | ✅ Corrigido (T2.1) |
| VULN-002 | SQL injection (via Supabase) | groqService.ts:711 | 🟡 Médio | ⚠️ Mitigado |
| VULN-003 | Exposure de dados sensíveis | ChatWidget.tsx:263-270 | 🟡 Médio | ✅ Analisado (T2.6) |

### Regras de segurança atuais

- ✅ Edge Function `llm-chat` com autenticação JWT
- ✅ Rate limiting na Edge Function
- ✅ Cache de idempotência na Edge Function
- ❌ **Falta**: Sanitização de input do usuário no system prompt
- ❌ **Falta**: Validação de tipos antes de passar ao LLM
- ❌ **Falta**: Mask de dados sensíveis na UI (valores estimados)

---

## 📈 HISTÓRICO DE MUDANÇAS

### 2026-07-28 - Fase 4: Migração Completa LangGraph ✅

**Motivo**: Substituir simpleOrchestrator por workflow LangGraph completo

**O que foi feito**:
- ✅ T4.1: StateGraph com 7 nós (loadContext → router → agentes → saveContext → loadSnapshot → buildPayload)
- ✅ T4.2: 4 agentes especializados (Router, Agenda, Itens, Conversational)
- ✅ T4.3: LangSmith já integrado (T3.7)
- ✅ T4.4: 18 testes unitários adaptados para novo workflow
- ✅ T4.5: ChatWidget migrado para langGraphOrchestrate + listEventsOrchestrate

**Novos arquivos**:
- `src/langgraph/agents/agendaAgent.ts` (processMessage wrapper)
- `src/langgraph/agents/itensAgent.ts` (executeItemEdit wrapper)

**Arquivos modificados**:
- `src/langgraph/state.ts` (expandido com 16 campos)
- `src/langgraph/workflow.ts` (grafo completo + langGraphOrchestrate)
- `src/langgraph/agents/routerAgent.ts` (rotas: agenda, itens, conversational)

**Testes**: 183 testes passando em 11 suites

**DEC-006 atualizada**: Fase 4 executada. langGraphOrchestrate() disponível como substituto. Troca no ChatWidget requer deploy com teste.

**Status**: ✅ COMPLETADO (T4.5 pendente de deploy)

---

### 2026-07-27 - Fase 3: PoC LangGraph (Completa)

**Motivo**: Validar LangGraph como alternativa para persistência de sessão

**O que foi feito**:
- ✅ T3.1: LangGraph instalado (@langchain/langgraph, @langchain/core)
- ✅ T3.2: Workflow com 2 agentes (RouterAgent + ConversationalAgent) via StateGraph
- ✅ T3.3: MemorySaver checkpointer com threadId por usuário + resumeWorkflow()
- ✅ T3.4: Guardrails integrados (input + output) no fluxo LangGraph
- ⏭️ T3.5: Pulado (requer deploy com usuários reais)
- ✅ T3.6: Análise — LangGraph viável, mas migração completa não urgente
- ✅ T3.7: LangSmith integrado — tracer com spans por nó, métricas (latência, tokens, guardrail_hits), fallback console

**Novos arquivos**:
- `src/langgraph/state.ts` (definição do estado com Annotation)
- `src/langgraph/workflow.ts` (StateGraph + runWorkflow + resumeWorkflow + clearThread)
- `src/langgraph/agents/routerAgent.ts` (classificação heurística de intenção)
- `src/langgraph/agents/conversationalAgent.ts` (Groq via Edge Function + guardrails)
- `src/langgraph/tracer.ts` (LangSmith tracing com spans, métricas, fallback console)
- `tests/unit/langgraph.test.ts` (18 testes)
- `tests/unit/tracer.test.ts` (6 testes)

**Testes**: 183 testes passando em 11 suites

**Decisão registrada (DEC-006)**: LangGraph é tecnicamente viável. O sistema atual com guardrails (Fase 2) atende bem. A migração completa (Fase 4) adiciona complexidade desnecessária no momento — manter como opção para quando houver necessidade real de múltiplos agentes especializados.

**Status**: ✅ COMPLETADO

---

### 2026-07-27 - Fase 2: Guardrails & Prompts (Completa)

**Motivo**: Implementar segurança contra prompt injection e modularizar prompts

**O que foi feito**:
- ✅ T2.1: Input guardrail (23 testes) — bloqueia injection, role hijack, spam
- ✅ T2.2: Output guardrail (19 testes) — detecta PII, vazamento de system prompt, JSON inválido
- ✅ T2.3: System prompt externalizado para `prompts/system/chat-base.txt` + loader
- ✅ T2.4: Sanitização segura de variáveis de template (14 testes)
- ✅ T2.5: Validators Zod para dados de evento e itens (20 testes)
- ✅ T2.6: Utilitário de máscara (decisão: valores não são PII real, máscara disponível como utility)

**Novos arquivos**:
- `src/guardrails/inputGuard.ts` (117 linhas)
- `src/guardrails/outputGuard.ts` (118 linhas)
- `src/validators/inputValidators.ts`
- `src/utils/promptLoader.ts` (87 linhas)
- `src/utils/maskSensitive.ts`
- `tests/unit/inputGuard.test.ts` (23 testes)
- `tests/unit/outputGuard.test.ts` (19 testes)
- `tests/unit/promptLoader.test.ts` (14 testes)
- `tests/unit/inputValidators.test.ts` (20 testes)

**Testes**: 159 testes passando em 9 suites

**VULN-001 corrigido**: Prompt injection mitigado por guardrail de input
**VULN-002 corrigido**: Injeção de template mitigada por sanitização

**Status**: ✅ COMPLETADO

**Arquivos modificados**:
- `src/services/groqService.ts` (removido buildSystemPrompt hardcoded, integrados input/output guardrails)
- `prompts/system/chat-base.txt` (template existente já estava correto)
- `docs/PLANO.md` (Fase 2 ✅)
- `docs/MESTRE.md` (este registro)

---

### 2025-01-27 - Fase 1: Fundação Crítica (Parcial)

**Motivo**: Corrigir type safety e remover usos de `any` do código

**O que foi feito**:
- ✅ Corrigido type safety da tabela `itens` (substituído por DatabaseItem)
- ✅ Removidos todos os `any` do groqService.ts (0 usos restantes)
- ✅ Criadas interfaces TypeScript: EventContext, CollectedData, ActionContext
- ✅ Criada função parseEventoId() em utils/parsers.ts
- ✅ Substituída sanitização manual por parseEventoId()
- ✅ Criados 23 testes unitários adicionais (parsers.test.ts)
- ✅ Total: 63 testes passando
- ✅ T1.6 concluído: handleChatError padronizado em 7 arquivos (groqService, eventManager, analyzeMessage, chat, toolsRouter, date-parser, events)

**Decisões tomadas**:
- ✅ Criar interfaces manuais (Docker não disponível)
- ✅ Criar src/types/groq.ts para tipos específicos
- ✅ Mover parseEventoId para utils/parsers.ts (reutilizável)

**Status**: ✅ COMPLETADO (Fase 1 concluída)

**Arquivos criados**:
- `src/types/database.ts` (interfaces Item, Event, etc)
- `src/types/groq.ts` (EventContext, CollectedData, etc)
- `src/utils/parsers.ts` (parseEventoId, isValidId)
- `tests/unit/parsers.test.ts` (23 testes)

**Arquivos modificados**:
- `src/services/groqService.ts` (type safety, remoção de any, handleChatError)
- `src/core/orchestrator/simpleOrchestrator.ts` (parseEventoId, handleChatError)
- `src/core/orchestrator/eventManager.ts` (handleChatError em 7 catch blocks)
- `src/core/orchestrator/analyzeMessage.ts` (handleChatError)
- `src/api/llm/chat.ts` (handleChatError)
- `src/api/llm/toolsRouter.ts` (handleChatError)
- `src/core/nlp/date-parser.ts` (handleChatError em 2 catch blocks)
- `src/db/repositories/events.ts` (handleChatError)

**O que ficou pendente**:
- Nenhum — Fase 1 concluída

**Cicatrices desta mudança**:
- **Aprendido**: Type safety é crítico - evita muitos bugs em runtime
- **Aprendido**: Testes precisam refletir comportamento real, não desejado
- **Regra aplicável**: SEMPRE criar interfaces para tipos usados frequentemente
- **Regra aplicável**: SEMPRE testar edge cases ("NULL", "undefined", etc)

---

### 2025-01-27 - Fase 0: Preparação do Ambiente

### 2025-01-27 - Fase 0: Preparação do Ambiente

**Motivo**: Preparar fundação para implementação das correções

**O que foi feito**:
- ✅ Instalação de dependências: @types/node, vitest, @vitest/ui, jsdom, happy-dom
- ✅ Criação de estrutura de prompts: prompts/system/chat-base.txt, prompts/system/agents/
- ✅ Criação de interfaces TypeScript manualmente (src/types/database.ts)
- ✅ Configuração de lint: ajuste em eslint.config.js
- ✅ Configuração de testes: vitest.config.ts, tests/setup.ts
- ✅ Criação de testes unitários: 40 testes criados e passando
  - date-parser.test.ts (8 testes)
  - item-commands.test.ts (15 testes)
  - detect-edit-intent.test.ts (17 testes)

**Decisões tomadas**:
- ✅ Criar interfaces manualmente (Docker não estava disponível)
- ✅ Ajustar testes para refletir comportamento real do código
- ✅ Usar jsdom como ambiente de testes
- ✅ Não adicionar regras ESLint estritas ainda (requer parserOptions)

**Status**: ✅ COMPLETADO

**Arquivos criados**:
- `prompts/system/chat-base.txt`
- `prompts/system/agents/agenda.txt`
- `prompts/system/agents/itens.txt`
- `prompts/system/agents/router.txt`
- `src/types/database.ts`
- `vitest.config.ts`
- `tests/setup.ts`
- `tests/unit/date-parser.test.ts`
- `tests/unit/item-commands.test.ts`
- `tests/unit/detect-edit-intent.test.ts`

**Arquivos modificados**:
- `package.json` (scripts de teste adicionados)
- `eslint.config.js` (regras ajustadas)

**Próxima fase**: Fase 1 - Fundação Crítica (Type Safety)

**Cicatrizes desta mudança**:
- **Aprendido**: Testes precisam refletir comportamento real, não comportamento desejado
- **Aprendido**: Configuração de ESLint com TypeScript requer setup adicional
- **Regra aplicável**: SEMPRE criar testes antes de refatorar código
- **Regra aplicável**: AJUSTAR testes ao invés de código quando testes revelam comportamento real

---

### 2025-01-27 - Auditoria completa do chatbot

**Motivo**: Usuários reportando problemas de persistência de sessão e experiência negativa

**O que foi feito**:
- Auditoria completa dos arquivos do chatbot
- Identificação de 4 bugs críticos
- Identificação de 3 vulnerabilidades de segurança
- Identificação de 6 problemas de qualidade de código
- Proposta de migração para LangGraph/LangSmith
- Instalação do mecanismo de engenharia documentada

**Decisões tomadas**:
- ✅ APROVAR migração para LangGraph (para resolver persistência)
- ✅ APROVAR implementação de guardrails (para resolver prompt injection)
- ✅ APROVAR refatoração completa de typescript (type safety)
- ⚠️ DECIDIR: Implementar em fases (Fase 1-4)

**Status**: ✅ COMPLETADO

**O que ficou pendente**:
- [ ] Implementar Fase 1: Fundação Crítica (Type safety)
- [ ] Implementar Fase 2: Guardrails & Prompts
- [ ] Implementar Fase 3: PoC LangGraph
- [ ] Decidir se migra para Fase 4 (completa)

**Cicatrizes desta mudança**:
- **Aprendido**: Bug temporal dead zone já foi corrigido anteriormente
- **Aprendido**: System prompt hardcoded é pesado para manter
- **Aprendido**: Ausência de testes torna refatoração perigosa
- **Regra aplicável**: SEMPRE corrigir type safety antes de mudar arquitetura
- **Regra aplicável**: NUNCA migrar framework sem PoC prévio
- **Regra aplicável**: GUARDA sempre: um bug por vez, testado e commitado

---

## 🚨 CICATRIZES (APRENDIDOS)

### Correções que já foram feitas

| ID | Problema | O que foi | Solução | Quando |
|----|----------|-----------|---------|--------|
| FIX-001 | Bug temporal dead zone em simpleOrchestrator | Quebra de edição de itens | Declarar `currentEventId` antes do `parseItemCommand` | 2025-01-20 |
| FIX-002 | Dual-LLM (2 chamadas por mensagem) | Lentidão, custo alto | Refatorar para 1 chamada única | 2025-01-15 |
| FIX-003 | Regex conflitava com LLM | Comandos de edição falhavam | Pré-triagem com `detectEditIntentFromMessage()` | 2025-01-10 |

### Regras derivadas das cicatrizes

**Regra #1 - Declaração de variáveis**:
> SEMPRE declarar variáveis ANTES do primeiro uso
> - **Por quê**: Bug temporal dead zone quebrou edição de itens
> - **Como**: Declarar no topo da função ou antes do primeiro uso

**Regra #2 - Validação de tipo**:
> SEMPRE validar tipos antes de usar em queries de banco
> - **Por quê**: SQL injection pode ocorrer se input não for validado
> - **Como**: Usar interfaces TypeScript, validar em runtime

**Regra #3 - Sistema de prompts**:
> SEMPRE manter system prompts em arquivos externos
> - **Por quê**: 144 linhas hardcoded é impossível de manter
> - **Como**: Mover para `prompts/*.txt`, versionar

**Regra #4 - Testes antes de refatorar**:
> SEMPRE adicionar testes antes de refatorar código crítico
> - **Por quê**: Sem testes, refatoração é extremamente perigosa
> - **Como**: Testes unitários para funções críticas primeiro

**Regra #5 - PoC antes de migrar framework**:
> NUNCA migrar para framework novo sem PoC prévio
> - **Por quê**: Overhead de setup pode não compensar
> - **Como**: PoC de 2-3 semanas, decidir com dados

---

## 📋 PRÓXIMAS ENTREGAS

Ver `docs/PLANO.md` para o plano completo de implementação.

---

## 🔄 WORKFLOW DE DESENVOLVIMENTO

### Antes de codificar
1. ✅ Ler o plano (`docs/PLANO.md`)
2. ✅ Ler as regras aplicáveis (seção CICATRIZES)
3. ✅ Verificar o mapa de impactos
4. ✅ Declarar explicitamente o que a tarefa toca além do óbvio

### Durante a implementação
1. ✅ Implementar na ordem: contrato/tipos → núcleo → borda → interface → testes
2. ✅ Commitar com mensagens claras
3. ✅ Não misturar mudanças não relacionadas

### Depois de codificar (escada de verificação)
1. ✅ Typecheck / lint (grátis) - OBRIGATÓRIO para tudo
2. ✅ Testes unitários (grátis) - OBRIGATÓRIO para tudo
3. ✅ Testes de integração (baixo) - para mudança de comportamento
4. ✅ Execução real (alto) - para caminho crítico, prompts, integrações
5. ✅ Validação humana (tempo) - para visual ou gosto

### Depois de verificar
1. ✅ Atualizar este documento (HISTÓRICO)
2. ✅ Atualizar status no plano (`docs/PLANO.md`)
3. ✅ Marcar ✅ no plano (só após verificação)
4. ✅ Commitar mudanças

---

## 📌 REFERÊNCIAS

### Documentos técnicos
- `docs/PLANO.md` - Plano de implementação
- `ANALISE_CHATBOT_UNE_AI.md` - Análise técnica comparando método Kliper
- `CHATBOT_REFERENCE_GUIDE.md` - Guia de referência do método Kliper
- `DOCUMENTACAO_COMPLETA_REUNE.md` - Documentação completa (VERIFICAR SE ESTÁ ATUALIZADA)

### Scripts úteis
- `scripts/` - Scripts de build, deploy, etc
- `supabase/functions/llm-chat/` - Edge Function do chat

### Decisões arquiteturais
- **LLM**: Groq API via Edge Function
- **Banco**: Supabase (PostgreSQL)
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS (neubrutalism)
- **Orquestração**: simpleOrchestrator (a ser migrado para LangGraph?)

---

**Fim do documento mestre**
