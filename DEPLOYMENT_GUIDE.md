# 🚀 Guia de Deploy - Admin Email Center

## ⚠️ PROBLEMA ATUAL

O erro **401 Unauthorized** está acontecendo porque:
1. As tabelas novas do banco de dados ainda não foram criadas
2. A Edge Function está tentando acessar tabelas que não existem

## 📝 SOLUÇÃO EM 3 PASSOS

### **PASSO 1: Criar as Tabelas no Banco de Dados** ⭐ CRÍTICO

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione o projeto **ReUNE**
3. No menu lateral, clique em **SQL Editor**
4. Clique em **"New Query"**
5. Copie TODO o conteúdo do arquivo: `supabase/SETUP_ADMIN_EMAIL_CENTER.sql`
6. Cole no editor SQL
7. Clique em **"Run"** (ou pressione `Ctrl+Enter`)
8. Aguarde a execução (deve demorar 2-5 segundos)
9. Você verá uma mensagem de sucesso e uma tabela de verificação no final

**✅ Resultado esperado:**
```
tabela                tem_campo_name    tem_campo_origin    tem_campo_welcome
waitlist_reune        1                 1                   1
email_templates       3                 0                   0
admin_settings        6                 0                   0
email_logs            0                 0                   0
```

---

### **PASSO 2: Deploy da Edge Function Atualizada**

Agora você precisa fazer deploy da Edge Function `get-admin-data` atualizada que acabei de modificar.

#### Opção A: Via Supabase CLI (Recomendado)

1. **Login no Supabase CLI:**
   ```bash
   npx supabase login
   ```
   - Isso abrirá o browser para você autorizar
   - Copie o token e cole no terminal

2. **Link o projeto:**
   ```bash
   npx supabase link --project-ref tfrogqqqmgfgfybesglq
   ```

3. **Deploy a função:**
   ```bash
   npx supabase functions deploy get-admin-data
   ```

#### Opção B: Via Supabase Dashboard (Alternativa)

1. Acesse: https://supabase.com/dashboard/project/tfrogqqqmgfgfybesglq/functions
2. Clique na função **get-admin-data**
3. Clique em **"Edit function"**
4. Copie o conteúdo de `supabase/functions/get-admin-data/index.ts`
5. Cole no editor
6. Clique em **"Deploy"**

---

### **PASSO 3: Testar o Admin Email Center**

1. Abra a aplicação ReUNE no navegador
2. Acesse `/admin`
3. Faça login com a senha: **2025**
4. Clique na tab **"Email Center"**
5. **Abra o Console do navegador** (F12)
6. Você deve ver logs com emojis:
   - 🔐 Enviando requisição com senha: ✅ Presente
   - 📡 Resposta da API: 200 { ... }

**✅ Sucesso!** Se você ver status **200**, tudo funcionou!

**❌ Se ainda ver erro 401:**
- Verifique se o SQL do PASSO 1 foi executado com sucesso
- Verifique se a função foi deployada no PASSO 2
- Veja os logs no Console do navegador

---

## 🔧 Troubleshooting

### Erro: "relation 'email_templates' does not exist"
**Causa:** Você pulou o PASSO 1
**Solução:** Execute o arquivo SQL `SETUP_ADMIN_EMAIL_CENTER.sql` no SQL Editor

### Erro: "Access token not provided"
**Causa:** Você não está logado no Supabase CLI
**Solução:** Execute `npx supabase login` primeiro

### Erro: 401 Unauthorized mesmo após deploy
**Causa:** A função antiga ainda está em cache
**Solução:**
1. Aguarde 1-2 minutos
2. Limpe o cache do browser (Ctrl+Shift+Delete)
3. Tente novamente

### Erro: "Unknown error" ou 500
**Causa:** Pode ser problema com Service Role Key
**Solução:**
1. Verifique no Dashboard > Settings > API
2. Confirme que `SUPABASE_SERVICE_ROLE_KEY` está configurada nas Edge Functions

---

## 📊 O Que Foi Criado

### Tabelas:
- ✅ `email_templates` - Templates de e-mail editáveis
- ✅ `email_logs` - Histórico de envios
- ✅ `admin_settings` - Configurações do admin
- ✅ Campos novos em `waitlist_reune`: name, origin, welcome_email_sent, welcome_email_sent_at

### Edge Functions:
- 🔄 `get-admin-data` - ATUALIZADA (mais robusta, com logs)
- 🆕 `send-admin-email` - Envio de e-mails (deploy futuro)
- 🆕 `email-templates` - CRUD de templates (deploy futuro)
- 🆕 `get-email-logs` - Buscar logs (deploy futuro)

### Componentes React:
- ✅ `AdminEmailCenter.tsx` - Dashboard principal
- ✅ `LeadTable.tsx` - Tabela de leads
- ✅ `SendEmailModal.tsx` - Modal de envio
- ✅ `EmailTemplateEditor.tsx` - Editor de templates
- ✅ `EmailLogViewer.tsx` - Visualizador de logs
- ✅ `AdminHeader.tsx` - Header compartilhado

---

## 🎯 Próximos Passos Após Funcionar

1. **Deploy das outras Edge Functions:**
   ```bash
   npx supabase functions deploy send-admin-email
   npx supabase functions deploy email-templates
   npx supabase functions deploy get-email-logs
   ```

2. **Configurar Resend API Key:**
   ```bash
   npx supabase secrets set RESEND_API_KEY=re_xxxxx
   ```

3. **Testar envio de e-mail:**
   - Selecione um lead na tabela
   - Clique em "Enviar E-mail"
   - Escolha um template
   - Envie!

---

## 📞 Se Nada Funcionar

Me envie os seguintes logs:

1. **Console do navegador** (F12 → Console)
2. **Logs da Edge Function** (Supabase Dashboard → Functions → get-admin-data → Logs)
3. **Resultado da query de verificação** (última query do SQL setup)

---

**🎨 Design aplicado:** Amber/Purple gradient theme com glassmorphism!
