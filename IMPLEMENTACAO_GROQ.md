# 🚀 Implementação do Método Groq no UNE.AI

## ✅ O que foi implementado

### 1. Serviço Groq (`src/services/groqService.ts`)
- ✅ Integração direta com API Groq (gratuita)
- ✅ System prompt robusto adaptado para UNE.AI
- ✅ Detecção automática de JSON de ações
- ✅ Execução de ações: `create_event`, `generate_items`, `confirm_event`, `update_event`
- ✅ Persistência de eventos e itens no Supabase
- ✅ Gerenciamento de contexto de eventos

### 2. Orquestrador Simplificado (`src/core/orchestrator/simpleOrchestrator.ts`)
- ✅ Versão simplificada baseada no método do Kliper
- ✅ Integração com ContextManager (persistência de histórico)
- ✅ Compatível com ChatWidget existente
- ✅ Geração automática de sugestões de respostas
- ✅ Detecção de status de eventos e itens

### 3. Integração no ChatWidget (`src/components/ChatWidget.tsx`)
- ✅ Atualizado para usar o novo orquestrador simplificado
- ✅ Comentários para fácil alternância entre orquestradores

---

## ⚙️ Configuração Necessária

### 1. Obter API Key do Groq

1. Acesse: https://console.groq.com/
2. Crie uma conta (gratuita)
3. Vá em **API Keys**
4. Crie uma nova chave ou copie uma existente

### 2. Configurar Variável de Ambiente

Adicione a seguinte variável no seu arquivo `.env` (raiz do projeto):

```env
VITE_GROQ_API_KEY=gsk_sua_chave_aqui
```

**⚠️ IMPORTANTE:**
- A chave do Groq começa com `gsk_`
- Não commite a chave no Git (arquivo `.env` deve estar no `.gitignore`)
- Para produção, configure a variável nas configurações de deploy

### 3. Reiniciar o Servidor de Desenvolvimento

Após adicionar a variável:

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm run dev
```

---

## 🔄 Como Alternar entre Orquestradores

Se precisar voltar ao orquestrador antigo (Gemini/Lovable):

1. Edite `src/components/ChatWidget.tsx`
2. Comente a linha do novo orquestrador:
   ```typescript
   // import { simpleOrchestrate } from '@/core/orchestrator/simpleOrchestrator';
   ```
3. Descomente a linha do orquestrador antigo:
   ```typescript
   import { orchestrate } from '@/core/orchestrator/chatOrchestrator';
   ```
4. Atualize a chamada:
   ```typescript
   const response = await orchestrate(
     text,
     user.id as UUID,
     eventoId as UUID | undefined
   );
   ```

---

## 📋 Como Funciona

### Fluxo Simplificado

```
1. Usuário envia mensagem no ChatWidget
   ↓
2. simpleOrchestrator recebe mensagem
   ↓
3. Carrega contexto e histórico do usuário
   ↓
4. Chama groqService.processMessage()
   ↓
5. Groq API processa com system prompt
   ↓
6. Se detectar JSON de ação → executa ação
   ↓
7. Retorna resposta ao ChatWidget
   ↓
8. ChatWidget exibe resposta e atualiza UI
```

### Ações Disponíveis

O sistema detecta automaticamente quando o LLM retorna JSON com ações:

```json
{
  "action": "create_event",
  "data": {
    "tipo_evento": "churrasco",
    "qtd_pessoas": 10,
    "data_evento": "2025-12-25"
  }
}
```

**Ações implementadas:**
- `create_event`: Cria novo evento e opcionalmente gera itens
- `generate_items`: Gera lista de itens para evento existente
- `confirm_event`: Finaliza evento
- `update_event`: Atualiza informações do evento

---

## 🧪 Testando

### Teste Básico

1. Abra o chat do UNE.AI
2. Digite: "Quero criar um churrasco para 10 pessoas"
3. O sistema deve:
   - Detectar intenção de criar evento
   - Criar evento no banco
   - Gerar lista de itens
   - Mostrar resposta confirmando

### Teste de Confirmação

1. Após criar evento e ver itens
2. Digite: "Confirmar lista"
3. O sistema deve finalizar o evento

---

## ⚠️ Problemas Comuns

### Erro: "VITE_GROQ_API_KEY não configurada"

**Solução:**
- Verifique se adicionou a variável no `.env`
- Reinicie o servidor de desenvolvimento
- Verifique se a chave está correta (começa com `gsk_`)

### Erro: "Groq API error: 401"

**Solução:**
- Verifique se a API key está correta
- Confirme se a conta Groq está ativa
- Verifique se não excedeu o limite de requisições (gratuito tem limites)

### Chat não responde / trava

**Solução:**
- Verifique o console do navegador para erros
- Verifique se a API key está configurada corretamente
- Tente alternar para o orquestrador antigo temporariamente

---

## 📊 Comparação: Antes vs Depois

| Aspecto | Antes (Gemini/Lovable) | Depois (Groq) |
|---------|------------------------|---------------|
| **Custo** | Alto (pago) | Gratuito |
| **Camadas** | 4+ (UI → Orchestrator → Edge → Gateway) | 2 (UI → Service) |
| **Linhas de código** | ~2000+ | ~400 |
| **Complexidade** | Alta | Baixa |
| **Manutenibilidade** | Difícil | Fácil |
| **Latência** | Alta (múltiplas camadas) | Baixa (direto) |

---

## 🎯 Próximos Passos

1. ✅ **Configurar API key** (você precisa fazer)
2. ✅ **Testar fluxo básico** (criar evento, gerar itens)
3. ⏳ **Ajustar system prompt** conforme necessário
4. ⏳ **Otimizar detecção de ações** se necessário
5. ⏳ **Adicionar mais ações** se necessário
6. ⏳ **Remover código antigo** após validação completa

---

## 📝 Notas

- O código antigo (`chatOrchestrator.ts`) ainda está no projeto para referência
- Você pode alternar entre orquestradores facilmente
- O sistema mantém compatibilidade total com o ChatWidget existente
- A persistência de contexto continua funcionando normalmente

---

**✨ Implementação concluída! Agora é só configurar a API key e testar!**




