# 🔄 Configuração de Sincronização de Emails com Resend

Este documento explica como configurar a sincronização automática de status de emails entre o Resend e o ReUNE Dashboard.

## 📋 Visão Geral

Implementamos **duas formas** de sincronização:

1. **Webhook (Tempo Real)**: Resend notifica automaticamente quando eventos acontecem
2. **Sincronização Manual/Automática**: Botão no dashboard que consulta a API do Resend

---

## 🚀 1. Configuração do Webhook no Resend

### Passo 1: Fazer Deploy da Edge Function

Primeiro, faça o deploy da Edge Function `resend-webhook` via Lovable:

```bash
# Arquivo: supabase/functions/resend-webhook/index.ts
```

Após o deploy, você terá uma URL como:
```
https://[seu-projeto].supabase.co/functions/v1/resend-webhook
```

### Passo 2: Configurar Webhook no Resend

1. Acesse o [Resend Dashboard](https://resend.com/webhooks)
2. Clique em **"Add Webhook"**
3. Preencha os campos:

   **Endpoint URL:**
   ```
   https://[seu-projeto].supabase.co/functions/v1/resend-webhook
   ```

   **Events to subscribe:**
   - ✅ `email.sent` - Email enviado com sucesso
   - ✅ `email.delivered` - Email entregue ao destinatário
   - ✅ `email.bounced` - Email rejeitado/retornou
   - ✅ `email.opened` - Email aberto pelo destinatário
   - ✅ `email.clicked` - Link no email foi clicado

4. Clique em **"Create Webhook"**

### Passo 3: Testar o Webhook

1. No Resend Dashboard, vá para a página do webhook criado
2. Clique em **"Send test event"**
3. Escolha um tipo de evento (ex: `email.sent`)
4. Clique em **"Send"**
5. Verifique se o status voltou como `200 OK`

---

## 🔄 2. Sincronização Manual/Automática

### O que foi implementado:

1. **Botão "Sincronizar Status"** no Admin Email Center
   - Localização: Aba "Leads", no canto superior direito
   - Verifica os últimos **48 horas** de emails
   - Consulta a API do Resend para cada email
   - Atualiza o status automaticamente

2. **Sincronização Automática**
   - Executada automaticamente ao abrir o Admin Email Center
   - Roda em background (sem toast/notificação)
   - Garante que os dados estejam sempre atualizados

### Como Usar:

**Sincronização Manual:**
1. Abra o Admin Email Center
2. Vá para a aba "Leads"
3. Clique no botão **"Sincronizar Status"** (ícone de refresh)
4. Aguarde a sincronização (mensagem de toast aparecerá)

**Sincronização Automática:**
- Simplesmente abra o Admin Email Center
- A sincronização roda automaticamente em background
- Dados são atualizados sem necessidade de interação

---

## 📊 Status de Emails

### Mapeamento de Status:

| Status no ReUNE | Significado | Origem |
|----------------|-------------|--------|
| `pending` | Email na fila | Sistema |
| `success` | Email enviado | Resend: `email.sent` |
| `delivered` | Email entregue | Resend: `email.delivered` |
| `failed` | Email falhou/rejeitado | Resend: `email.bounced` |
| `opened` | Email aberto | Resend: `email.opened` |
| `clicked` | Link clicado | Resend: `email.clicked` |

### No Dashboard:

- ✅ **Verde**: Email enviado/entregue (`success`, `delivered`, `opened`, `clicked`)
- ❌ **Vermelho**: Email falhou (`failed`)
- ⏳ **Amarelo**: Sem emails enviados ou pendente (`pending`)

---

## 🔧 3. Troubleshooting

### Problema: Webhook não está funcionando

**Solução 1:** Verificar se a Edge Function foi deployada
```bash
# Verificar logs da Edge Function
npx supabase functions logs resend-webhook
```

**Solução 2:** Verificar URL do webhook no Resend
- A URL deve terminar com `/resend-webhook`
- Não deve ter trailing slash: `...webhook/` ❌

**Solução 3:** Testar endpoint manualmente
```bash
curl -X POST https://[seu-projeto].supabase.co/functions/v1/resend-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email.sent",
    "created_at": "2025-01-01T00:00:00.000Z",
    "data": {
      "email_id": "test-123",
      "from": "test@reuneapp.com.br",
      "to": ["destinatario@example.com"],
      "subject": "Teste",
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  }'
```

### Problema: Sincronização manual não atualiza

**Solução 1:** Verificar se a Edge Function `sync-email-status` foi deployada

**Solução 2:** Verificar se `RESEND_API_KEY` está configurada no Supabase
1. Acesse o Supabase Dashboard
2. Vá em Settings > Edge Functions
3. Verifique se `RESEND_API_KEY` está presente

**Solução 3:** Verificar logs no console do navegador
- Abra DevTools (F12)
- Vá na aba Console
- Procure por erros durante a sincronização

### Problema: Emails mostram "não enviado" mas foram enviados

**Causa:** Logs antigos criados antes da implementação do webhook

**Solução:** Use o botão "Sincronizar Status" para atualizar retroativamente

---

## 🎯 4. Checklist de Implementação

### Deployments Necessários:

- [ ] Deploy `resend-webhook` Edge Function
- [ ] Deploy `sync-email-status` Edge Function
- [ ] Configurar webhook no Resend Dashboard
- [ ] Testar webhook com evento de teste
- [ ] Testar botão de sincronização manual

### Verificações:

- [ ] Enviar um email de teste
- [ ] Verificar se o status atualiza automaticamente (via webhook)
- [ ] Verificar se o botão de sincronização funciona
- [ ] Verificar se a sincronização automática roda ao abrir o dashboard
- [ ] Verificar logs no Supabase (`npx supabase functions logs`)

---

## 📈 5. Benefícios da Implementação

### Antes:
- ❌ Status desatualizado
- ❌ Emails marcados como "não enviado" incorretamente
- ❌ Sem visibilidade de abertura/cliques
- ❌ Impossível saber se email foi entregue ou rejeitado

### Depois:
- ✅ Status em tempo real via webhook
- ✅ Sincronização automática ao abrir dashboard
- ✅ Botão manual para forçar atualização
- ✅ Rastreamento completo: enviado → entregue → aberto → clicado
- ✅ Detecção de bounces (emails rejeitados)
- ✅ Histórico completo de eventos no metadata dos logs

---

## 🔒 6. Segurança

- O webhook é público (não requer autenticação)
- Isso é normal e seguro para webhooks do Resend
- Opcionalmente, você pode verificar a assinatura Svix (headers `svix-*`)
- A Edge Function valida o formato dos dados recebidos
- A sincronização manual requer senha admin (`password: "2025"`)

---

## 📞 7. Suporte

Se encontrar problemas:

1. Verifique os logs das Edge Functions:
   ```bash
   npx supabase functions logs resend-webhook
   npx supabase functions logs sync-email-status
   ```

2. Verifique o webhook no Resend Dashboard:
   - Vá em Webhooks
   - Clique no webhook configurado
   - Veja o histórico de requests/responses

3. Consulte o console do navegador (F12) para erros no frontend

---

## 🎉 Conclusão

Com essa implementação, o ReUNE Dashboard agora tem **sincronização completa e automática** com o Resend, garantindo que os status dos emails estejam sempre corretos e atualizados em tempo real! 📧✨
