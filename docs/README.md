# 📖 Guia Rápido - Engenharia Documentada

## 🎯 Como funciona

O mecanismo de engenharia documentada organiza o projeto em **entregas fechadas** com rituais claros para nunca perder contexto.

---

## 📁 Estrutura

```
docs/
├── MESTRE.md          # Documento mestre - estado atual do projeto
├── PLANO.md           # Plano de implementação - tarefas e fases
└── README.md          # Este arquivo - guia rápido
```

---

## 🔄 Workflow de uma entrega

### 1. ANTES DE CODAR
```bash
# 1. Ler o plano
cat docs/PLANO.md

# 2. Identificar a tarefa
# Exemplo: T1.1 - Corrigir type safety da tabela itens

# 3. Ler as regras aplicáveis (MESTRE.md - seção CICATRIZES)
# Exemplo: Regra #1 - Type Safety

# 4. Verificar o mapa de impactos
# Exemplo: Arquivos tocados, riscos, etc
```

### 2. DURANTE IMPLEMENTAÇÃO
```bash
# 1. Implementar na ordem: contrato/tipos → núcleo → borda → interface → testes
# 2. Commitar com mensagens claras
git commit -m "T1.1: Corrigir type safety da tabela itens"
# 3. NUNCA misturar mudanças não relacionadas
```

### 3. DEPOIS DE CODAR (Escada de Verificação)
```bash
# 1. Typecheck/lint (OBRIGATÓRIO)
npm run type-check
npm run lint

# 2. Testes unitários (OBRIGATÓRIO)
npm run test:unit

# 3. Testes de integração (se aplicável)
npm run test:integration

# 4. Execução real (se aplicável)
# Testar manualmente o chatbot

# 5. Validação humana (se visual)
# Usuário testando
```

### 4. DEPOIS DE VERIFICAR
```bash
# 1. Atualizar MESTRE.md (HISTÓRICO)
vim docs/MESTRE.md

# 2. Atualizar status no PLANO.md
vim docs/PLANO.md
# Mudar de ⬜ para 🟡 (em andamento) ou ✅ (concluído)

# 3. Commitar mudanças
git add docs/
git commit -m "docs: Atualizar MESTRE e PLANO após T1.1"
```

---

## 🚨 REGRAS CRÍTICAS

### Regra #1 - Type Safety
> TODA mudança deve passar por typecheck sem erros
- **Por quê**: Cicatriz FIX-001 (temporal dead zone)
- **Como**: `npm run type-check` antes de commitar

### Regra #2 - Testes Antes de Refatorar
> NUNCA refatorar código sem testes primeiro
- **Por quê**: Sem testes, refatoração é extremamente perigosa
- **Como**: Criar testes antes de mudar código

### Regra #3 - Uma Mudança Por Vez
> NUNCA misturar mudanças não relacionadas no mesmo commit
- **Por quê**: Diff fica ilegível, difícil de debugar
- **Como**: Um bug por vez, testado e commitado

### Regra #4 - Verificação Obrigatória
> NUNCA marcar ✅ sem passar pela escada de verificação
- **Por quê**: Meio-feito marcado como pronto
- **Como**: Seguir escada definida em cada fase

### Regra #5 - Documentação de Falha
> SEMPRE documentar bugs, suposições falsas e retratações
- **Por quê**: Documento que só registra sucesso não é confiável
- **Como**: Atualizar MESTRE.md com honestidade

---

## 📊 Status das Tarefas

| Status | Significado | Quando usar |
|--------|------------|-------------|
| ⬜ | Planejado | Tarefa ainda não iniciada |
| 🟡 | Em andamento | Tarefa em progresso |
| 🟡 | Planejado (com asterisco) | Tarefa planejada mas com ressalvas |
| ✅ | Concluído | Tarefa concluída E verificada |
| ❌ | Cancelado | Tarefa cancelada (explicar por quê) |
| ⚠️ | Bloqueado | Tarefa bloqueada (explicar por quê) |

---

## 🎯 Começando uma Nova Entrega

### Checklist

- [ ] Li `docs/MESTRE.md`?
- [ ] Li `docs/PLANO.md`?
- [ ] Identifiquei a tarefa correta?
- [ ] Li as regras aplicáveis?
- [ ] Verifiquei o mapa de impactos?
- [ ] Entendi os critérios de aceitação?

### Exemplo prático

```bash
# Vou implementar T1.1 - Corrigir type safety da tabela itens

# 1. Ler o plano
cat docs/PLANO.md | grep -A 20 "T1.1"

# 2. Ler as regras
cat docs/MESTRE.md | grep -A 10 "Regra #1"

# 3. Verificar impactos
cat docs/PLANO.md | grep -A 10 "Mapa de impactos" -A 10

# 4. Implementar
# ... código ...

# 5. Verificar
npm run type-check
npm run lint
npm run test:unit

# 6. Atualizar docs
vim docs/MESTRE.md  # Adicionar ao HISTÓRICO
vim docs/PLANO.md    # Mudar T1.1 de ⬜ para ✅

# 7. Commitar
git commit -m "T1.1: Corrigir type safety da tabela itens"
```

---

## 📌 Perguntas Frequentes

### Q: Onde vejo o que precisa ser feito?
**A**: `docs/PLANO.md` - contém todas as tarefas planejadas.

### Q: O que faço se precisar adicionar uma nova tarefa?
**A**: Adicione em `docs/PLANO.md` na fase apropriada, seguindo o formato.

### Q: O que faço se uma tarefa falhar?
**A**: Documente em `docs/MESTRE.md` (HISTÓRICO) o que foi tentado e por quê falhou. Use status ⚠️ no PLANO.md.

### Q: Posso pular uma fase?
**A**: Não recomendado. As fases são sequenciais por design. Fase 1 deve ser completada antes da Fase 2, etc.

### Q: Posso trabalhar em múltiplas tarefas ao mesmo tempo?
**A**: Só se forem independentes. Verifique se há dependências no PLANO.md.

### Q: O que faço se encontrar um novo bug?
**A**: Adicione em `docs/MESTRE.md` (seção BUGS CONHECIDOS) e crie uma tarefa no PLANO.md se necessário.

---

## 🚀 Próximos Passos

1. **Ler** `docs/MESTRE.md` - entender o estado atual
2. **Ler** `docs/PLANO.md` - ver o que precisa ser feito
3. **Escolher** uma tarefa para começar
4. **Seguir** o workflow acima

---

**Boa sorte! 🚀**
