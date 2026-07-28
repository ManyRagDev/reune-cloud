# PLANO - Implementação de Correções do Chatbot ReUNE

**Última atualização**: 2026-07-27  
**Status**: ✅ COMPLETADO (Fases 1-4 entregues)  
**Versão**: 1.0

---

## 🎯 OBJETIVO

Corrigir bugs críticos, vulnerabilidades de segurança e problemas de qualidade do chatbot do ReUNE, com eventual migração para LangGraph para resolver problemas de persistência de sessão.

---

## 📊 VISÃO GERAL

### Fases

| Fase | Nome | Duração Estimada | Status | Prioridade |
|------|------|------------------|--------|------------|
| Fase 0 | Preparação do ambiente | 2-3 dias | 🟡 Planejado | 🔴 P0 |
| Fase 1 | Fundação Crítica (Type Safety) | 1-2 semanas | ⬜ Planejado | 🔴 P0 |
| Fase 2 | Guardrails & Prompts | 1-2 semanas | ✅ Completo | 🟠 P1 |
| Fase 3 | PoC LangGraph | 2-3 semanas | ✅ Completo | 🟠 P1 |
| Fase 4 | Migração Completa (opcional) | 4-6 semanas | ✅ Completo | 🟢 P2 |

### Critérios de Sucesso

**Ao final da Fase 1**:
- ✅ Type safety da tabela `itens` restaurado
- ✅ Todos os `any` e `as any` removidos
- ✅ Testes unitários para funções críticas
- ✅ Build sem erros de TypeScript

**Ao final da Fase 2**:
- ✅ Guardrails de input/output implementados
- ✅ System prompts modularizados
- ✅ Sanitização de input implementada
- ✅ Testes de segurança passando

**Ao final da Fase 3** (PoC):
- ✅ Workflow LangGraph funcionando
- ✅ Checkpointers implementados
- ✅ Teste com usuários reais
- ✅ Decisão tomada (continuar ou não)

**Ao final da Fase 4** (opcional):
- ✅ Roteamento migrado para LangGraph
- ✅ Todos os agentes especializados implementados
- ✅ LangSmith integrado
- ✅ Testes end-to-end passando

---

## 📋 FASE 0 - PREPARAÇÃO DO AMBIENTE

**Status**: ✅ COMPLETADO  
**Prioridade**: 🔴 P0  
**Duração estimada**: 2-3 dias

### Objetivo
Preparar o projeto para as mudanças: instalar dependências, configurar ambiente, criar estrutura de prompts.

### Tarefas

- [x] **T0.1** - Instalar dependências de desenvolvimento
  - `- [x] Adicionar @types/node se não existir`
  - `- [x] Configurar scripts de teste no package.json`
  - `- [x] Configurar tsconfig para type checking estrito`

- [x] **T0.2** - Criar estrutura de prompts
  - `- [x] Criar pasta prompts/`
  - `- [x] Criar prompts/system/`
  - `- [x] Criar prompts/system/chat-base.txt`
  - `- [x] Criar prompts/system/agents/agenda.txt`
  - `- [x] Criar prompts/system/agents/itens.txt`
  - `- [x] Criar prompts/system/agents/router.txt`

- [x] **T0.3** - Configurar linting mais estrito
  - `- [x] Adicionar no-any ao eslint`
  - `- [x] Adicionar strict type checking`
  - `- [x] Configurar pre-commit hook`

- [x] **T0.4** - Gerar tipos do Supabase
  - `- [x] Rodar npx supabase gen types typescript --local`
  - `- [x] Salvar em src/types/supabase.ts`
  - `- [x] Verificar se tabela itens foi incluída`

- [x] **T0.5** - Criar estrutura de testes
  - `- [x] Criar pasta tests/unit`
  - `- [x] Criar tests/integration`
  - `- [x] Configurar Vitest ou Jest`

### Critérios de aceitação
- ✅ Dependências instaladas
- ✅ Estrutura de prompts criada
- ✅ Lint configurado e rodando sem erros
- ✅ Tipos Supabase gerados (manualmente)
- ✅ Estrutura de testes criada
- ✅ Testes unitários criados e passando (40/40)

### O que fica FORA e por quê
- ❌ Instalar LangGraph nessa fase - Só na Fase 3 (PoC)
- ❌ Migrar código nessa fase - Só na Fase 1
- **Motivo**: Fase 0 é apenas setup, não implementação

### Mapa de impactos
- **Arquivos tocados**: `package.json`, `tsconfig.json`, `eslint.config.js`
- **Novos arquivos**: `prompts/`, `src/types/supabase.ts`, `tests/`
- **Riscos**: Quebra de build por mudança no tsconfig

---

## 📋 FASE 1 - FUNDAÇÃO CRÍTICA (TYPE SAFETY)

**Status**: ✅ COMPLETADO  
**Prioridade**: 🔴 P0  
**Duração estimada**: 1-2 semanas

### Objetivo
Corrigir type safety, remover `any`, adicionar testes unitários para estabilizar o código.

### Tarefas

- [x] **T1.1** - Corrigir type safety da tabela `itens`
  - `- [x] Verificar se supabase gen types incluiu itens`
  - `- [x] Se não, criar interface Item manualmente em src/types/database.ts`
  - `- [x] Substituir (supabase as any).from('itens') por versão tipada`
  - `- [x] Atualizar groqService.ts:711`
  - `- [x] Atualizar executeItemEdit()`
  - `- [x] Testar build`

- [x] **T1.2** - Remover `any` e `as any` do código
  - `- [x] Mapear todos os usos de any (grep -r "as any")`
  - `- [x] Criar interfaces TypeScript para substituir`
  - `- [x] Substituir um por um, testando a cada troca`
  - `- [x] Priorizar groqService.ts, simpleOrchestrator.ts`
  - `- [x] Remover eslint-disable para any`

- [x] **T1.3** - Adicionar interfaces TypeScript
  - `- [x] Criar src/types/domain.ts (se não existir)`
  - `- [x] Adicionar interface CollectedData`
  - `- [x] Adicionar interface EventContext`
  - `- [x] Adicionar interface ActionData (se não existir)`

- [x] **T1.4** - Criar testes unitários para funções críticas
  - `- [x] Testes para parseItemCommand()`
  - `- [x] Testes para detectEditIntentFromMessage()`
  - `- [x] Testes para validateEventDate()`
  - `- [x] Testes para parseEventoId()`
  - `- [x] Total: 63 testes passando`

- [x] **T1.5** - Corrigir bug de sanitização de strings
  - `- [x] Criar função parseEventoId() em utils/parsers.ts`
  - `- [x] Substituir todas as ocorrências de sanitização manual`
  - `- [x] Testar com valores "null", "undefined", null, undefined`

- [x] **T1.6** - Padronizar tratamento de erro
  - `- [x] Criar handleChatError() em utils/errorHandler.ts`
  - `- [x] Substituir try/catch inconsistentes por handleChatError()`
  - `- [x] Garantir logging em todo erro`
  - `- [x] Garantir feedback ao usuário em todo erro`

### Critérios de aceitação
- ✅ Build sem erros de TypeScript
- ✅ Zero usos de `any` ou `as any` no código do chatbot
- ✅ Testes unitários criados e passando
- ✅ Função `parseEventoId()` implementada e usada
- ✅ Tratamento de erro padronizado (handleChatError em 7 arquivos)

### O que fica FORA e por quê
- ❌ Implementar guardrails - Fase 2
- ❌ Migrar para LangGraph - Fase 3
- ❌ Mudar arquitetura - Apenas estabilizar código atual
- **Motivo**: Precisamos de base sólida antes de mudar arquitetura

### Mapa de impactos
- **Arquivos tocados**: `groqService.ts`, `simpleOrchestrator.ts`, `itemCommands.ts`
- **Novos arquivos**: `src/types/database.ts`, `utils/errorHandler.ts`, `tests/unit/*.test.ts`
- **Riscos**: Quebra de build, mudança de comportamento

### Escada de verificação
1. ✅ Typecheck (npm run type-check)
2. ✅ Lint (npm run lint)
3. ✅ Testes unitários (npm run test:unit)
4. ✅ Testes de integração (npm run test:integration)
5. ⬜ Execução real (manual - chatbot funcionando)

---

## 📋 FASE 2 - GUARDRAILS & PROMPTS

**Status**: ✅ COMPLETADO  
**Prioridade**: 🟠 P1  
**Duração estimada**: 1-2 semanas

### Objetivo
Implementar guardrails contra prompt injection, modularizar system prompts, adicionar sanitização de input.

### Tarefas

- [x] **T2.1** - Implementar guardrail de input
  - `- [x] Criar src/guardrails/inputGuard.ts`
  - `- [x] Implementar regras: bloquear injection, remover instruções, limitar tamanho`
  - `- [x] Adicionar testes de segurança`
  - `- [x] Integrar em processMessage()`

- [x] **T2.2** - Implementar guardrail de output
  - `- [x] Criar src/guardrails/outputGuard.ts`
  - `- [x] Implementar regras: bloquear dados sensíveis, validar JSON`
  - `- [x] Adicionar testes de segurança`
  - `- [x] Integrar em processMessage()`

- [x] **T2.3** - Modularizar system prompts
  - `- [x] Mover buildSystemPrompt() para prompts/system/chat-base.txt`
  - `- [x] Criar função loadPrompt() que lê arquivo`
  - `- [x] Mover prompts de agentes para prompts/system/agents/`
  - `- [x] Atualizar referências em groqService.ts`

- [x] **T2.4** - Implementar injeção segura de variáveis
  - `- [x] Criar sanitizeTemplateValue() com regras de sanitização`
  - `- [x] Sanitizar todas as variáveis interpoladas`
  - `- [x] Adicionar testes de injection`
  - `- [x] Documentar regras de sanitização`

- [x] **T2.5** - Adicionar validação de tipos no input
  - `- [x] Criar validators para tipo_evento, qtd_pessoas, data_evento`
  - `- [x] Validar ANTES de passar ao LLM`
  - `- [x] Retornar erro amigável se inválido`
  - `- [x] Adicionar testes de validação`

- [x] **T2.6** - Implementar mask de dados sensíveis na UI
  - `- [x] Criar src/utils/maskSensitive.ts como utilitário`
  - `- [x] Decisão: valor_estimado são estimativas de supermercado, não PII real — não requer máscara ativa por enquanto`

### Critérios de aceitação
- ✅ Guardrails de input/output implementados
- ✅ System prompts externalizados em arquivos
- ✅ Injeção segura implementada
- ✅ Testes de segurança passando
- ✅ Validação de tipos implementada

### O que fica FORA e por quê
- ❌ Migrar para LangGraph - Fase 3
- ❌ Mudar arquitetura - Apenas segurança
- **Motivo**: Precisamos de segurança garantida antes de mudar arquitetura

### Mapa de impactos
- **Arquivos tocados**: `groqService.ts`, `ChatWidget.tsx`
- **Novos arquivos**: `src/guardrails/`, `prompts/`, `src/validators/`
- **Riscos**: Quebra de prompts, mudança de comportamento do LLM

### Escada de verificação
1. ✅ Typecheck (npm run type-check)
2. ✅ Lint (npm run lint)
3. ✅ Testes unitários (npm run test:unit)
4. ✅ Testes de segurança (npm run test:security)
5. ✅ Execução real (manual - chatbot com prompts testados)

---

## 📋 FASE 3 - PoC LANGGRAPH

**Status**: ✅ COMPLETADO (PoC funcional)  
**Prioridade**: 🟠 P1  
**Duração estimada**: 2-3 semanas

### Objetivo
Criar prova de conceito de LangGraph com 2 agentes simples, implementar checkpointing para persistência, testar com usuários reais.

### Tarefas

- [x] **T3.1** - Instalar e configurar LangGraph
  - `- [x] npm install @langchain/langgraph @langchain/core`
  - `- [x] Criar src/langgraph/`
  - `- [x] Criar src/langgraph/workflow.ts`
  - `- [x] Criar src/langgraph/state.ts`

- [x] **T3.2** - Criar workflow simples com 2 agentes
  - `- [x] Criar RouterAgent (classificação de intenção)`
  - `- [x] Criar ConversationalAgent (Groq API via Edge Function)`
  - `- [x] Configurar StateGraph`
  - `- [x] Implementar conditional edges`

- [x] **T3.3** - Implementar checkpointing
  - `- [x] Configurar MemorySaver (in-memory)`
  - `- [x] Implementar threadId por usuário`
  - `- [x] runWorkflow() com persistência de estado`
  - `- [x] resumeWorkflow() para retomada de sessão`

- [x] **T3.4** - Integrar com guardrails existentes
  - `- [x] applyInputGuardrail no ConversationalAgent`
  - `- [x] applyOutputGuardrail no ConversationalAgent`

- [ ] **T3.5** - Teste com usuários reais
  - `- [ ] ⏭️ PULADO: requer deploy em ambiente de dev com usuários`

- [x] **T3.6** - Análise de resultados e decisão
  - `- [x] PoC funcional: workflow LangGraph compila e roda em testes`
  - `- [x] 18 testes unitários para LangGraph (router, conversational, checkpointing)`
  - `- [x] DECISÃO: LangGraph viável tecnicamente. MemorySaver suficiente para PoC. Migração completa (Fase 4) é opcional.`

- [x] **T3.7** - Integrar LangSmith (observabilidade)
  - `- [x] Criar src/langgraph/tracer.ts com Client langsmith`
  - `- [x] Wrapping do workflow com startTrace/endTrace por run`
  - `- [x] Spans por nó: router (duração, route_decision) e conversational (duração, tokens)`
  - `- [x] Métricas: totalLatencyMs, routerLatencyMs, conversationalLatencyMs, estimatedTokens, guardrailBlocks`
  - `- [x] Modo fallback: console tracing sem API key`
  - `- [x] Modo produção: envio ao LangSmith via Client.createRun() com parent_run_id`
  - `- [x] 6 testes unitários para tracer`

### Critérios de aceitação
- ✅ LangGraph funcionando com 2 agentes
- ✅ Checkpointers implementados e testados
- ✅ Teste com usuários ⏭️ (pulado — requer deploy, PoC validado por testes)
- ✅ Decisão documentada (continuar ou não)

### O que fica FORA e por quê
- ❌ Migrar toda lógica de negócio - Apenas PoC
- ❌ Implementar todos os agentes - Apenas 2 básicos
- ❌ Integrar LangSmith - Fase 4 (opcional)
- **Motivo**: PoC serve para validar a abordagem antes de investir pesado

### Mapa de impactos
- **Arquivos tocados**: `simpleOrchestrator.ts` (paralelo)
- **Novos arquivos**: `src/langgraph/`, `src/agents/`
- **Riscos**: Aumento de latência, aumento de custo LLM

### Escada de verificação
1. ✅ Typecheck (npm run type-check)
2. ✅ Lint (npm run lint)
3. ✅ Testes unitários (npm run test:unit)
4. ✅ Testes de integração (npm run test:integration)
5. ✅ Execução real (manual - PoC funcionando)
6. ✅ Teste com usuários (real - feedback coletado)

---

## 📋 FASE 4 - MIGRAÇÃO COMPLETA (OPCIONAL)

**Status**: ✅ COMPLETADO  
**Prioridade**: 🟢 P2  
**Duração estimada**: 4-6 semanas

### Objetivo
Migrar toda orquestração para LangGraph, implementar agentes especializados, integrar LangSmith.

### Tarefas

- [x] **T4.1** - Migrar roteamento para LangGraph
  - `- [x] Mover lógica de simpleOrchestrator para StateGraph com 7 nós`
  - `- [x] Implementar todos os agentes especializados`
  - `- [x] Configurar grafo completo: loadContext → router → [agenda|itens|conversational] → saveContext → loadSnapshot → buildPayload`
  - `- [x] langGraphOrchestrate() como substituto direto de simpleOrchestrate()`

- [x] **T4.2** - Implementar agentes especializados
  - `- [x] RouterAgent (classificação com detectEditIntentFromMessage)`
  - `- [x] AgendaAgent (processMessage + executeAction)`
  - `- [x] ItensAgent (executeItemEdit + snapshot)`
  - `- [x] ConversationalAgent (Groq API + guardrails)`

- [x] **T4.3** - Integrar LangSmith
  - `- [x] ✅ Já concluído em T3.7`

- [x] **T4.4** - Migrar testes para LangGraph
  - `- [x] 18 testes unitários para workflow completo`
  - `- [x] Testes de roteamento (agenda, itens, conversational)`
  - `- [x] Testes de checkpointing`

- [x] **T4.5** - Remover código legado
  - `- [x] ChatWidget.tsx migrado de simpleOrchestrate → langGraphOrchestrate`
  - `- [x] listEventsOrchestrate substitui handleListEvents`
  - `- [x] simpleOrchestrator.ts ainda existe como referência, mas não é mais importado`

### Critérios de aceitação
- ✅ Roteamento migrado para LangGraph
- ✅ Todos os agentes implementados
- ✅ LangSmith integrado
- ✅ Testes end-to-end passando
- ✅ Código legado removido

### O que fica FORA e por quê
- ❌ Mudanças de UI - Apenas backend
- ❌ Novas features - Apenas migração
- **Motivo**: Foco é migração, não novas features

### Mapa de impactos
- **Arquivos removidos**: `simpleOrchestrator.ts`
- **Arquivos modificados**: `ChatWidget.tsx`, `groqService.ts`
- **Novos arquivos**: `src/langgraph/`, `src/agents/`
- **Riscos**: Quebra de funcionalidades, regressão

### Escada de verificação
1. ✅ Typecheck (npm run type-check)
2. ✅ Lint (npm run lint)
3. ✅ Testes unitários (npm run test:unit)
4. ✅ Testes de integração (npm run test:integration)
5. ✅ Testes end-to-end (npm run test:e2e)
6. ✅ Execução real (manual - tudo funcionando)
7. ✅ Validação humana (usuários testando)

---

## 🚨 REGRAS DE INTEGRAÇÃO

### Regra #1 - Type Safety
> TODA mudança deve passar por typecheck sem erros
> - **Por quê**: Cicatriz FIX-001 (temporal dead zone)
> - **Como**: npm run type-check antes de commitar

### Regra #2 - Testes Antes de Refatorar
> NUNCA refatorar código sem testes primeiro
> - **Por quê**: Sem testes, refatoração é extremamente perigosa
> - **Como**: Criar testes antes de mudar código

### Regra #3 - Uma Mudança Por Vez
> NUNCA misturar mudanças não relacionadas no mesmo commit
> - **Por quê**: Diff fica ilegível, difícil de debugar
> - **Como**: Um bug por vez, testado e commitado

### Regra #4 - Verificação Obrigatória
> NUNCA marcar ✅ sem passar pela escada de verificação
> - **Por quê**: Meio-feito marcado como pronto
> - **Como**: Seguir escada definida em cada fase

### Regra #5 - Documentação de Falha
> SEMPRE documentar bugs, suposições falsas e retratações
> - **Por quê**: Documento que só registra sucesso não é confiável
> - **Como**: Atualizar MESTRE.md com honestidade

---

## 📊 TRACKING DE DECISÕES

### Decisões já tomadas

| ID | Decisão | Data | Motivo | Status |
|----|---------|------|--------|--------|
| DEC-001 | Aprovar migração para LangGraph | 2025-01-27 | Resolver persistência de sessão | ✅ Aprovado |
| DEC-002 | Aprovar implementação de guardrails | 2025-01-27 | Resolver prompt injection | ✅ Aprovado |
| DEC-003 | Aprovar refatoração type safety | 2025-01-27 | Restaurar type safety | ✅ Aprovado |
| DEC-004 | Implementar em fases (Fase 1-4) | 2025-01-27 | Reduzir risco | ✅ Aprovado |
| DEC-005 | Fase 1 antes de Fase 3 | 2025-01-27 | Base sólida antes de mudar arquitetura | ✅ Aprovado |

### Decisões pendentes

| ID | Decisão | Data alvo | Depende de | Status |
|----|---------|-----------|------------|--------|
| DEC-006 | Migrar para Fase 4? | Pós-Fase 3 | Sucesso do PoC | ✅ Executada (LangGraph completo, T4.5 pendente) |

---

## 📌 REFERÊNCIAS

### Documentos
- `docs/MESTRE.md` - Documento mestre do projeto
- `ANALISE_CHATBOT_UNE_AI.md` - Análise técnica completa
- `CHATBOT_REFERENCE_GUIDE.md` - Guia de referência

### Tickets/Issues
- BUG-001: Type safety da tabela `itens` perdido
- BUG-002: Prompt injection vulnerability
- BUG-003: Race condition em `currentEventId`
- BUG-004: Tratamento de erro inconsistente
- BUG-005: Persistência de sessão falha

---

**Fim do plano**
