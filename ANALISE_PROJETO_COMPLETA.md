# 📊 Análise Completa do Projeto ReUNE

## 1. 🛠️ STACK ATUAL

### Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.19
- **Linguagem**: TypeScript 5.8.3
- **UI Library**: 
  - Radix UI (componentes primitivos)
  - shadcn/ui (componentes estilizados)
  - Tailwind CSS 3.4.17
- **Roteamento**: React Router DOM 6.30.1
- **Estado**: React Hooks (useState, useEffect)
- **Formulários**: React Hook Form 7.61.1 + Zod 3.25.76
- **Queries**: TanStack React Query 5.83.0
- **Animações**: Framer Motion 12.23.24

### Backend
- **BaaS**: Supabase
  - **Banco de Dados**: PostgreSQL (via Supabase)
  - **Autenticação**: Supabase Auth
  - **Edge Functions**: Deno (TypeScript)
  - **Storage**: Supabase Storage
  - **Realtime**: Supabase Realtime (se usado)

### Infraestrutura
- **Hosting Frontend**: Lovable (provavelmente)
- **Edge Functions**: Supabase Edge Functions (Deno runtime)
- **API Externa**: Groq API (para LLM)

---

## 2. 🔐 AUTENTICAÇÃO

### Provider: **Supabase Auth**

**Localização**: `src/integrations/supabase/client.ts`

```typescript
export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY, 
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

**Hook de Autenticação**: `src/hooks/useAuth.tsx`
- Usa `supabase.auth.onAuthStateChange()` para monitorar estado
- Retorna: `{ user, session, loading }`

**Página de Login**: `src/pages/Login.tsx`
- Login: `supabase.auth.signInWithPassword({ email, password })`
- Signup: `supabase.auth.signUp({ email, password })`
- Auto-confirm email: **HABILITADO** (conforme documentação)

**Variáveis de Ambiente Necessárias**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (chave pública/anônima)

**Fluxo de Autenticação**:
1. Usuário faz login/signup via `Login.tsx`
2. Supabase Auth valida credenciais
3. Retorna session com JWT token
4. Token é armazenado no `localStorage`
5. `useAuth` detecta mudança e atualiza estado
6. App redireciona para dashboard

---

## 3. 💬 ONDE O CHAT RODA

### Arquitetura Atual (Após Implementação Groq)

```
┌─────────────────────────────────────────────────────────┐
│              FRONTEND (React/Vite)                      │
│  ┌───────────────────────────────────────────────────┐   │
│  │  ChatWidget.tsx                                   │   │
│  │  - Captura mensagem do usuário                    │   │
│  │  - Chama simpleOrchestrate()                      │   │
│  └──────────────────────┬────────────────────────────┘   │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         ORQUESTRADOR (simpleOrchestrator.ts)           │
│  ┌───────────────────────────────────────────────────┐   │
│  │  - Carrega contexto e histórico                   │   │
│  │  - Chama groqService.processMessage()             │   │
│  └──────────────────────┬────────────────────────────┘   │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│         SERVIÇO GROQ (groqService.ts)                   │
│  ┌───────────────────────────────────────────────────┐   │
│  │  - Monta system prompt                            │   │
│  │  - Chama supabase.functions.invoke('llm-chat')    │   │
│  └──────────────────────┬────────────────────────────┘   │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│      EDGE FUNCTION (supabase/functions/llm-chat)        │
│  ┌───────────────────────────────────────────────────┐   │
│  │  - Autentica via JWT token                        │   │
│  │  - Rate limiting                                  │   │
│  │  - Chama Groq API (server-side)                   │   │
│  │  - Processa tool calling (se necessário)          │   │
│  │  - Retorna resposta                               │   │
│  └──────────────────────┬────────────────────────────┘   │
└─────────────────────────┼─────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              GROQ API (Externo)                        │
│  ┌───────────────────────────────────────────────────┐   │
│  │  - Modelo: llama-3.3-70b-versatile               │   │
│  │  - API: https://api.groq.com/openai/v1/...       │   │
│  │  - Gratuito                                       │   │
│  └───────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Camadas do Chat

1. **Frontend** (`ChatWidget.tsx`):
   - UI do chat
   - Estado local de mensagens
   - Chama orquestrador

2. **Orquestrador** (`simpleOrchestrator.ts`):
   - Gerencia contexto do usuário
   - Carrega histórico
   - Chama serviço Groq
   - Processa resposta

3. **Serviço Groq** (`groqService.ts`):
   - Prepara mensagens
   - Chama edge function via `supabase.functions.invoke()`
   - Detecta ações JSON
   - Executa ações (criar evento, gerar itens)

4. **Edge Function** (`llm-chat/index.ts`):
   - **Roda no servidor** (Supabase Edge Functions)
   - Autentica requisição
   - Chama Groq API diretamente
   - Processa tool calling
   - Retorna resposta

### ✅ Vantagens desta Arquitetura

- **Segurança**: API key do Groq fica no servidor (edge function)
- **Sem CORS**: Edge function faz chamada server-side
- **Autenticação**: JWT token validado automaticamente
- **Rate Limiting**: Implementado na edge function
- **Escalabilidade**: Edge functions escalam automaticamente

---

## 4. ❌ ERRO DE LOGIN: "failed to fetch"

### Análise do Problema

O erro "failed to fetch" **NÃO é um erro de login**, mas sim um erro de **rede/CORS** que pode estar acontecendo em:

#### Possível Causa 1: Edge Function não configurada

Se a edge function `llm-chat` não estiver deployada ou configurada corretamente, o `supabase.functions.invoke()` pode falhar.

**Verificar**:
```bash
# Verificar se a função está deployada
npx supabase functions list

# Deploy se necessário
npx supabase functions deploy llm-chat
```

#### Possível Causa 2: Variáveis de Ambiente Faltando

A edge function precisa da variável `GROQ_API_KEY` configurada no Supabase.

**Configurar**:
1. Acesse Supabase Dashboard
2. Vá em **Edge Functions** → **llm-chat** → **Settings**
3. Adicione secret: `GROQ_API_KEY` = `gsk_...`

#### Possível Causa 3: CORS na Edge Function

A edge function pode não estar retornando headers CORS corretos.

**Verificar**: `supabase/functions/llm-chat/index.ts` deve ter:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
```

#### Possível Causa 4: URL do Supabase Incorreta

Se `VITE_SUPABASE_URL` estiver incorreto, todas as chamadas falham.

**Verificar**: `.env` deve ter:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🔍 Como Diagnosticar

1. **Abra o Console do Navegador** (F12)
2. **Vá na aba Network**
3. **Tente fazer login**
4. **Procure por requisições falhadas**:
   - `supabase.co/auth/v1/token` (login)
   - `supabase.co/functions/v1/llm-chat` (chat)

5. **Verifique o erro específico**:
   - **CORS error**: Problema de headers
   - **401 Unauthorized**: Token inválido ou expirado
   - **404 Not Found**: Edge function não deployada
   - **500 Internal Server Error**: Erro na edge function
   - **Network Error**: Problema de conexão ou URL incorreta

### 🛠️ Soluções

#### Se o erro for no Login (Supabase Auth):

1. Verificar variáveis de ambiente:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
   ```

2. Verificar se o projeto Supabase está ativo

3. Verificar se email/senha estão corretos

#### Se o erro for no Chat (Edge Function):

1. **Deploy da edge function**:
   ```bash
   npx supabase login
   npx supabase link --project-ref seu-project-ref
   npx supabase functions deploy llm-chat
   ```

2. **Configurar secret**:
   ```bash
   npx supabase secrets set GROQ_API_KEY=gsk_sua_chave
   ```

3. **Verificar logs**:
   ```bash
   npx supabase functions logs llm-chat
   ```

---

## 📋 RESUMO EXECUTIVO

| Aspecto | Status |
|---------|--------|
| **Stack Frontend** | React + Vite + TypeScript + Tailwind |
| **Stack Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Autenticação** | Supabase Auth (Email/Password) |
| **Chat - Camada** | Frontend → Orquestrador → Serviço → Edge Function → Groq API |
| **Chat - Localização** | Edge Function (server-side) |
| **Erro "failed to fetch"** | Provavelmente edge function não configurada ou CORS |

---

## 🎯 PRÓXIMOS PASSOS PARA RESOLVER

1. ✅ Verificar se variáveis de ambiente estão configuradas
2. ✅ Deploy da edge function `llm-chat`
3. ✅ Configurar secret `GROQ_API_KEY` no Supabase
4. ✅ Testar login (deve funcionar independente do chat)
5. ✅ Testar chat após configurar edge function
6. ✅ Verificar logs da edge function se ainda houver erro

---

**Última atualização**: Baseado na análise do código atual



