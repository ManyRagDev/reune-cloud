# Track 029: Notificação de Novos Cadastros via Telegram

## 🎯 Objetivo
Receber uma notificação imediata e formatada no Telegram (via Bot próprio) sempre que um novo usuário se cadastrar na plataforma ReUNE.

---

## 🏗️ Arquitetura da Solução

```
[Usuário se Cadastra] 
         │
         ▼
[auth.users (Supabase Auth)] 
         │ (Trigger on_auth_user_created)
         ▼
[public.profiles] 
         │
         ▼ (Database Webhook / Trigger pg_net)
[Supabase Edge Function: notify-telegram-signup]
         │ (POST https://api.telegram.org/bot<TOKEN>/sendMessage)
         ▼
[Telegram (Chat privado ou Grupo do Administrador)]
```

### Por que Edge Function + Webhook?
1. **Segurança Máxima:** O `TELEGRAM_BOT_TOKEN` e o `TELEGRAM_CHAT_ID` ficam armazenados de forma criptografada nos Secrets do Supabase (`supabase secrets set`), sem expor credenciais no código-fonte nem no frontend.
2. **Observabilidade:** Logs visíveis no Dashboard do Supabase (Edge Functions), com rastreio de status (200 OK ou erros do Telegram).
3. **Resiliência:** A chamada ao Telegram não bloqueia nem atrasa o fluxo de cadastro do usuário.
4. **Formatação Rica:** Mensagens em Markdown/HTML com emojis, nome, email, data/hora local e ID do perfil.

---

## 📋 Pré-requisitos do Usuário (Telegram)
Para o sistema funcionar, são necessárias duas informações simples:
1. **`TELEGRAM_BOT_TOKEN`**: Token obtido ao criar um bot no [@BotFather](https://t.me/BotFather) no Telegram (ex: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`).
2. **`TELEGRAM_CHAT_ID`**: O ID do seu chat pessoal ou do grupo onde você deseja receber os alertas (obtido enviando uma mensagem para [@userinfobot](https://t.me/userinfobot) ou chamando `getUpdates`).

---

## 🛠️ Plano de Implementação

### Fase 1: Edge Function no Supabase
- [x] Criar a Edge Function `supabase/functions/notify-telegram-signup/index.ts`:
  - Tratar requisições HTTP (CORS + validação de payload).
  - Extrair dados do novo usuário (`email`, `display_name`, `created_at`, `id`, `provider`).
  - Formatar mensagem amigável e legível em HTML com emojis para o Telegram.
  - Chamar a API oficial do Telegram (`sendMessage`).
  - Tratamento de erros robusto com logs claros.
- [x] Deploy da Edge Function realizado com sucesso no projeto Supabase (`tjihfzitkehyaiznpjnc`).

### Fase 2: Configuração de Disparo (Webhook / Trigger)
- [x] Criar migration SQL `supabase/migrations/20261107184600_notify_telegram_on_signup.sql` usando `pg_net` assíncrono e trigger seguro em `public.profiles`.
- [x] Executar a migration no SQL Editor do Supabase com sucesso.

### Fase 3: Documentação e Guia de Ativação
- [x] Chat ID configurado: `1026643513`.
- [x] Configurar secret `TELEGRAM_BOT_TOKEN` no Supabase Dashboard.

### Fase 4: Verificação e Testes
- [x] Teste de conectividade da Edge Function realizado (retornou validação de token esperada).
- [x] Disparo de teste bem-sucedido para o Telegram (Recebido pelo bot @Reuneappbot no chat ID 1026643513).
- [x] Simulação de payload de cadastro enviada com sucesso.
- [x] Atualizar status final da track em `.conductor/tracks.md`.

---

## 🏁 Definition of Done (Critérios de Sucesso)
1. Edge Function criada com código TypeScript tipado e resiliente a falhas.
2. Template de mensagem formatado com clareza (Nome, Email, Data/Hora, Método de Cadastro).
3. Instruções completas para configuração do Bot e das credenciais no Supabase.
4. Teste de disparo bem-sucedido.
5. Arquivos de rastreio (`plan.md` e `tracks.md`) devidamente atualizados.
