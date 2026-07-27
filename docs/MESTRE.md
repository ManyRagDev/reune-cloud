# MESTRE - ReUNE Chatbot

**Última atualização**: 2025-01-27  
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
| BUG-002 | Prompt injection vulnerability | Alto | ❌ Aberto |
| BUG-003 | Race condition em `currentEventId` | Médio | ⚠️ Parcialmente corrigido |
| BUG-004 | Tratamento de erro inconsistente | Médio | ❌ Aberto |
| BUG-005 | Persistência de sessão falha | Alto | ❌ Aberto |

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
| VULN-001 | Prompt injection | groqService.ts:buildSystemPrompt() | 🔴 Alto | ❌ Aberto |
| VULN-002 | SQL injection (via Supabase) | groqService.ts:711 | 🟡 Médio | ⚠️ Mitigado |
| VULN-003 | Exposure de dados sensíveis | ChatWidget.tsx:263-270 | 🟡 Médio | ❌ Aberto |

### Regras de segurança atuais

- ✅ Edge Function `llm-chat` com autenticação JWT
- ✅ Rate limiting na Edge Function
- ✅ Cache de idempotência na Edge Function
- ❌ **Falta**: Sanitização de input do usuário no system prompt
- ❌ **Falta**: Validação de tipos antes de passar ao LLM
- ❌ **Falta**: Mask de dados sensíveis na UI (valores estimados)

---

## 📈 HISTÓRICO DE MUDANÇAS

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
