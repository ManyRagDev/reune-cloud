# PLANO - Implementação de Correções do Chatbot ReUNE

**Última atualização**: 2025-01-27  
**Status**: 🟡 EM ANDAMENTO  
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
| Fase 2 | Guardrails & Prompts | 1-2 semanas | ⬜ Planejado | 🟠 P1 |
| Fase 3 | PoC LangGraph | 2-3 semanas | ⬜ Planejado | 🟠 P1 |
| Fase 4 | Migração Completa (opcional) | 4-6 semanas | ⬜ Planejado | 🟢 P2 |

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

**Status**: ⬜ PLANEJADO  
**Prioridade**: 🔴 P0  
**Duração estimada**: 1-2 semanas

### Objetivo
Corrigir type safety, remover `any`, adicionar testes unitários para estabilizar o código.

### Tarefas

- [ ] **T1.1** - Corrigir type safety da tabela `itens`
  - `- [ ] Verificar se supabase gen types incluiu itens`
  - `- [ ] Se não, criar interface Item manualmente em src/types/database.ts`
  - `- [ ] Substituir (supabase as any).from('itens') por versão tipada`
  - `- [ ] Atualizar groqService.ts:711`
  - `- [ ] Atualizar executeItemEdit()`
  - `- [ ] Testar build`

- [ ] **T1.2** - Remover `any` e `as any` do código
  - `- [ ] Mapear todos os usos de any (grep -r "as any")`
  - `- [ ] Criar interfaces TypeScript para substituir`
  - `- [ ] Substituir um por um, testando a cada troca`
  - `- [ ] Priorizar groqService.ts, simpleOrchestrator.ts`
  - `- [ ] Remover eslint-disable para any`

- [ ] **T1.3** - Adicionar interfaces TypeScript
  - `- [ ] Criar src/types/domain.ts (se não existir)`
  - `- [ ] Adicionar interface CollectedData`
  - `- [ ] Adicionar interface EventContext`
  - `- [ ] Adicionar interface ActionData (se não existir)`

- [ ] **T1.4** - Criar testes unitários para funções críticas
  - `- [ ] Testes para parseItemCommand()`
  - `- [ ] Testes para detectEditIntentFromMessage()`
  - `- [ ] Testes para validateEventDate()`
  - `- [ ] Testes para buildSystemPrompt()`
  - `- [ ] Testes para detectActionJSON()`

- [ ] **T1.5** - Corrigir bug de sanitização de strings
  - `- [ ] Criar função parseEventoId() em simpleOrchestrator.ts`
  - `- [ ] Substituir todas as ocorrências de sanitização manual`
  - `- [ ] Testar com valores "null", "undefined", null, undefined`

- [ ] **T1.6** - Padronizar tratamento de erro
  - `- [ ] Criar handleChatError() em utils/errorHandler.ts`
  - `- [ ] Substituir try/catch inconsistentes por handleChatError()`
  - `- [ ] Garantir logging em todo erro`
  - `- [ ] Garantir feedback ao usuário em todo erro`

### Critérios de aceitação
- ✅ Build sem erros de TypeScript
- ✅ Zero usos de `any` ou `as any` no código do chatbot
- ✅ Testes unitários criados e passando
- ✅ Função `parseEventoId()` implementada e usada
- ✅ Tratamento de erro padronizado

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

**Status**: ⬜ PLANEJADO  
**Prioridade**: 🟠 P1  
**Duração estimada**: 1-2 semanas

### Objetivo
Implementar guardrails contra prompt injection, modularizar system prompts, adicionar sanitização de input.

### Tarefas

- [ ] **T2.1** - Implementar guardrail de input
  - `- [ ] Criar src/guardrails/inputGuard.ts`
  - `- [ ] Implementar regras: bloquear injection, remover instruções, limitar tamanho`
  - `- [ ] Adicionar testes de segurança`
  - `- [ ] Integrar em processMessage()`

- [ ] **T2.2** - Implementar guardrail de output
  - `- [ ] Criar src/guardrails/outputGuard.ts`
  - `- [ ] Implementar regras: bloquear dados sensíveis, validar JSON`
  - `- [ ] Adicionar testes de segurança`
  - `- [ ] Integrar em processMessage()`

- [ ] **T2.3** - Modularizar system prompts
  - `- [ ] Mover buildSystemPrompt() para prompts/system/chat-base.txt`
  - `- [ ] Criar função loadPrompt() que lê arquivo`
  - `- [ ] Mover prompts de agentes para prompts/system/agents/`
  - `- [ ] Atualizar referências em groqService.ts`

- [ ] **T2.4** - Implementar injeção segura de variáveis
  - `- [ ] Criar buildSystemPrompt() com template safe`
  - `- [ ] Sanitizar todas as variáveis interpoladas`
  - `- [ ] Adicionar testes de injection`
  - `- [ ] Documentar regras de sanitização`

- [ ] **T2.5** - Adicionar validação de tipos no input
  - `- [ ] Criar validators para tipo_evento, qtd_pessoas, data_evento`
  - `- [ ] Validar ANTES de passar ao LLM`
  - `- [ ] Retornar erro amigável se inválido`
  - `- [ ] Adicionar testes de validação`

- [ ] **T2.6** - Implementar mask de dados sensíveis na UI
  - `- [ ] Opcional: mascarar valor_estimado dos itens`
  - `- [ ] Opcional: só mostrar após confirmação`
  - `- [ ] Decisão: necessário ou não?`

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

**Status**: ⬜ PLANEJADO  
**Prioridade**: 🟠 P1  
**Duração estimada**: 2-3 semanas

### Objetivo
Criar prova de conceito de LangGraph com 2 agentes simples, implementar checkpointing para persistência, testar com usuários reais.

### Tarefas

- [ ] **T3.1** - Instalar e configurar LangGraph
  - `- [ ] npm install @langchain/langgraph @langchain/core`
  - `- [ ] Criar src/langgraph/`
  - `- [ ] Criar src/langgraph/workflow.ts`
  - `- [ ] Criar src/langgraph/state.ts`

- [ ] **T3.2** - Criar workflow simples com 2 agentes
  - `- [ ] Criar RouterAgent (básico)`
  - `- [ ] Criar ConversationalAgent (básico)`
  - `- [ ] Configurar StateGraph`
  - `- [ ] Implementar conditional edges`

- [ ] **T3.3** - Implementar checkpointing
  - `- [ ] Configurar checkpointer (memory ou Supabase)`
  - `- [ ] Implementar threadId por usuário`
  - `- [ ] Testar persistência de estado`
  - `- [ ] Testar retomada de sessão`

- [ ] **T3.4** - Integrar com guardrails existentes
  - `- [ ] Adicionar inputGuard no RouterAgent`
  - `- [ ] Adicionar outputGuard no ConversationalAgent`
  - `- [ ] Testar fluxo completo`

- [ ] **T3.5** - Teste com usuários reais
  - `- [ ] Habilitar LangGraph em ambiente de dev`
  - `- [ ] Selecionar 5-10 usuários para teste`
  - `- [ ] Coletar feedback sobre persistência de sessão`
  - `- [ ] Medir latência e custo LLM`

- [ ] **T3.6** - Análise de resultados e decisão
  - `- [ ] Comparar performance vs. arquitetura atual`
  - `- [ ] Comparar custo LLM vs. arquitetura atual`
  - `- [ ] Avaliar curva de aprendizado da equipe`
  - `- [ ] Decidir: continua para Fase 4 ou reverte`

### Critérios de aceitação
- ✅ LangGraph funcionando com 2 agentes
- ✅ Checkpointers implementados e testados
- ✅ Teste com usuários realizado
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

**Status**: ⬜ PLANEJADO (condicional ao sucesso do PoC)  
**Prioridade**: 🟢 P2  
**Duração estimada**: 4-6 semanas

### Objetivo
Migrar toda orquestração para LangGraph, implementar agentes especializados, integrar LangSmith.

### Tarefas

- [ ] **T4.1** - Migrar roteamento para LangGraph
  - `- [ ] Mover lógica de simpleOrchestrator para StateGraph`
  - `- [ ] Implementar todos os agentes especializados`
  - `- [ ] Configurar grafo completo`
  - `- [ ] Testar fluxos existentes`

- [ ] **T4.2** - Implementar agentes especializados
  - `- [ ] AgendaAgent (gerenciar eventos)`
  - `- [ ] ItensAgent (gerenciar itens)`
  - `- [ ] ConversationalAgent (humanização)`
  - `- [ ] RouterAgent (roteamento)`

- [ ] **T4.3** - Integrar LangSmith
  - `- [ ] Configurar LangSmith API key`
  - `- [ ] Habilitar tracing em dev/staging`
  - `- [ ] Configurar call trees`
  - `- [ ] Testar visualização`

- [ ] **T4.4** - Migrar testes para LangGraph
  - `- [ ] Atualizar testes unitários`
  - `- [ ] Adicionar testes de agentes`
  - `- [ ] Adicionar testes de workflow`
  - `- [ ] Adicionar testes end-to-end`

- [ ] **T4.5** - Remover código legado
  - `- [ ] Remover simpleOrchestrator.ts`
  - `- [ ] Remover código não usado`
  - `- [ ] Atualizar documentação`
  - `- [ ] Commemorar 🎉`

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
| DEC-006 | Continuar para Fase 4? | Pós-Fase 3 | Sucesso do PoC | ⬜ Pendente |

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
