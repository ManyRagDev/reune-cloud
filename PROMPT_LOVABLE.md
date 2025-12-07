# Prompt para Lovable - Admin Email Center Database

Preciso que você crie as seguintes tabelas no Supabase para o sistema de Admin Email Center:

---

## 1. Expandir tabela `waitlist_reune` existente

Adicione os seguintes campos à tabela `waitlist_reune` que já existe:

- `name` (TEXT, nullable) - Nome do lead
- `origin` (TEXT, default 'unknown') - Origem do cadastro (landing, launch, amigosecreto, invite, etc)
- `welcome_email_sent` (BOOLEAN, default false) - Se já recebeu email de boas-vindas
- `welcome_email_sent_at` (TIMESTAMP WITH TIME ZONE, nullable) - Data/hora do envio

Crie índices para:
- `name`
- `origin`
- `welcome_email_sent`

---

## 2. Criar tabela `email_templates`

Tabela para armazenar templates de e-mail editáveis:

**Campos:**
- `id` (UUID, primary key, auto-generated)
- `name` (TEXT, unique, not null) - Nome único do template (slug)
- `subject` (TEXT, not null) - Assunto do e-mail
- `html_content` (TEXT, not null) - HTML do template com suporte a variáveis {{nome}}, {{email}}
- `description` (TEXT, nullable) - Descrição do template
- `variables` (JSONB, default '[]') - Array JSON com nomes das variáveis: ["nome", "email"]
- `is_active` (BOOLEAN, default true) - Se o template está ativo
- `created_at` (TIMESTAMP WITH TIME ZONE, default now())
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now())

**Índices:**
- `name`
- `is_active`

**RLS:** Habilitar Row Level Security (apenas service role deve ter acesso)

**Trigger:** Criar trigger para atualizar `updated_at` automaticamente em updates

**Dados iniciais - 3 templates:**

1. **Template "boas_vindas":**
   - subject: "Bem-vindo ao ReUNE! 🎉"
   - description: "E-mail de boas-vindas para novos leads da waitlist"
   - variables: ["nome", "email"]
   - html_content: Email HTML responsivo com estilo moderno (fundo #f6f9fc, botão amber #f59e0b, saudação "Olá{{#if nome}}, {{nome}}{{/if}}! 👋", texto de boas-vindas, link para https://reuneapp.com.br)

2. **Template "atualizacao_lancamento":**
   - subject: "Novidades do ReUNE 🚀"
   - description: "Atualização sobre o lançamento da plataforma"
   - variables: ["nome"]
   - html_content: Email HTML simples com título "Novidades do ReUNE! 🚀"

3. **Template "convite_exclusivo":**
   - subject: "Você tem acesso exclusivo ao ReUNE! ✨"
   - description: "Convite para recursos VIP e acesso antecipado"
   - variables: ["nome", "codigo_acesso"]
   - html_content: Email HTML com parabéns e código de acesso

---

## 3. Criar tabela `email_logs`

Tabela para histórico de envios de e-mail:

**Campos:**
- `id` (UUID, primary key, auto-generated)
- `lead_id` (UUID, nullable, foreign key para waitlist_reune.id com ON DELETE SET NULL)
- `lead_email` (TEXT, not null) - Email do destinatário (guardado mesmo se lead for deletado)
- `template_name` (TEXT, not null) - Nome do template usado
- `sent_at` (TIMESTAMP WITH TIME ZONE, default now()) - Data/hora do envio
- `status` (TEXT, not null, check: 'success', 'failed', ou 'pending')
- `error_message` (TEXT, nullable) - Mensagem de erro se status = failed
- `metadata` (JSONB, default '{}') - Dados extras: resend_message_id, variables usadas, etc
- `created_at` (TIMESTAMP WITH TIME ZONE, default now())

**Índices:**
- `lead_id`
- `lead_email`
- `template_name`
- `status`
- `sent_at` (DESC)
- `created_at` (DESC)

**RLS:** Habilitar Row Level Security (apenas service role)

---

## 4. Criar tabela `admin_settings`

Tabela para configurações do painel admin:

**Campos:**
- `id` (UUID, primary key, auto-generated)
- `key` (TEXT, unique, not null) - Chave única da configuração
- `value` (JSONB, not null) - Valor em formato JSON
- `description` (TEXT, nullable) - Descrição da configuração
- `created_at` (TIMESTAMP WITH TIME ZONE, default now())
- `updated_at` (TIMESTAMP WITH TIME ZONE, default now())

**Índices:**
- `key`

**RLS:** Habilitar Row Level Security (apenas service role)

**Trigger:** Criar trigger para atualizar `updated_at` automaticamente

**Dados iniciais - 6 configurações:**

1. `auto_welcome_enabled`: false (Enviar e-mail de boas-vindas automaticamente - desativado por padrão)
2. `from_email`: "ReUNE <noreply@reuneapp.com.br>" (E-mail remetente padrão)
3. `from_name`: "ReUNE" (Nome do remetente)
4. `default_welcome_template`: "boas_vindas" (Template padrão de boas-vindas)
5. `admin_email`: "admin@reuneapp.com.br" (E-mail do administrador para notificações)
6. `email_daily_limit`: 1000 (Limite diário de e-mails - proteção contra spam)

---

## Observações Importantes:

- Todas as tabelas devem ter RLS habilitado
- As políticas RLS devem bloquear acesso público (apenas service role)
- Os campos JSONB devem usar `'{}'::jsonb` ou `'[]'::jsonb` como default
- Os triggers de `updated_at` devem usar a função padrão do Supabase
- Os templates HTML devem ser responsivos e bonitos
- Use ON CONFLICT (key/name) DO NOTHING nos INSERTs iniciais para evitar duplicatas

---

## Para o template "boas_vindas", use este HTML:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td align="center" style="padding: 32px 20px 0;">
              <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">
                Olá{{#if nome}}, {{nome}}{{/if}}! 👋
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Seja muito bem-vindo(a) ao <strong>ReUNE</strong>! 🎉
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Estamos muito felizes em ter você na nossa lista de espera. Em breve, você terá acesso à plataforma que vai revolucionar a forma de organizar eventos entre amigos!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">
                Fique de olho no seu e-mail ({{email}}) para novidades exclusivas e benefícios pelo seu acesso antecipado. ✨
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 8px 20px 32px;">
              <a href="https://reuneapp.com.br" style="display: inline-block; background-color: #f59e0b; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">
                Acessar o ReUNE
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0;">
                <strong>ReUNE</strong> - Planejamento de eventos simplificado
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 18px; margin: 4px 0;">
                reuneapp.com.br
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## ✅ Checklist Final:

- [ ] Campos adicionados em `waitlist_reune`
- [ ] Tabela `email_templates` criada com 3 templates iniciais
- [ ] Tabela `email_logs` criada
- [ ] Tabela `admin_settings` criada com 6 configurações
- [ ] Todos os índices criados
- [ ] RLS habilitado em todas as novas tabelas
- [ ] Triggers de `updated_at` funcionando
- [ ] Políticas RLS bloqueando acesso público

Execute tudo e confirme que as tabelas foram criadas com sucesso! 🚀
