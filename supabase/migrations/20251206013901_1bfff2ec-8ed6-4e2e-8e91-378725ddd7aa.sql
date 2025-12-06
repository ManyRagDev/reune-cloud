-- =====================================================
-- ADMIN EMAIL CENTER - Índices e Dados Iniciais
-- =====================================================

-- 1. Índices para waitlist_reune (se não existirem)
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_name ON public.waitlist_reune(name);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_origin ON public.waitlist_reune(origin);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_welcome_email_sent ON public.waitlist_reune(welcome_email_sent);

-- 2. Índices para email_templates
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- 3. Índices para email_logs
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON public.email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_email ON public.email_logs(lead_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON public.email_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- 4. Índice para admin_settings
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

-- 5. Foreign key para email_logs -> waitlist_reune (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'email_logs_lead_id_fkey'
  ) THEN
    ALTER TABLE public.email_logs 
    ADD CONSTRAINT email_logs_lead_id_fkey 
    FOREIGN KEY (lead_id) REFERENCES public.waitlist_reune(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 6. Trigger para updated_at em email_templates
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Trigger para updated_at em admin_settings
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- DADOS INICIAIS - EMAIL TEMPLATES
-- =====================================================

INSERT INTO public.email_templates (name, subject, html_content, description, variables, is_active)
VALUES 
  (
    'boas_vindas',
    'Bem-vindo ao ReUNE! 🎉',
    '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
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
</html>',
    'E-mail de boas-vindas para novos leads da waitlist',
    '["nome", "email"]'::jsonb,
    true
  ),
  (
    'atualizacao_lancamento',
    'Novidades do ReUNE 🚀',
    '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td align="center" style="padding: 32px 20px 0;">
              <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">
                Novidades do ReUNE! 🚀
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Olá{{#if nome}}, {{nome}}{{/if}}!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Temos novidades incríveis para compartilhar com você sobre o lançamento do ReUNE!
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 8px 20px 32px;">
              <a href="https://reuneapp.com.br" style="display: inline-block; background-color: #f59e0b; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">
                Ver Novidades
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0;">
                <strong>ReUNE</strong> - Planejamento de eventos simplificado
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'Atualização sobre o lançamento da plataforma',
    '["nome"]'::jsonb,
    true
  ),
  (
    'convite_exclusivo',
    'Você tem acesso exclusivo ao ReUNE! ✨',
    '<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <tr>
            <td align="center" style="padding: 32px 20px 0;">
              <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">
                Parabéns{{#if nome}}, {{nome}}{{/if}}! ✨
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 20px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Você foi selecionado(a) para ter acesso exclusivo e antecipado ao ReUNE!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Use o código abaixo para desbloquear recursos VIP:
              </p>
              <p style="text-align: center; background-color: #fef3c7; border-radius: 8px; padding: 16px; font-size: 24px; font-weight: 700; color: #92400e; margin: 16px 0;">
                {{codigo_acesso}}
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 8px 20px 32px;">
              <a href="https://reuneapp.com.br" style="display: inline-block; background-color: #f59e0b; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">
                Ativar Acesso VIP
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 20px 32px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; line-height: 20px; margin: 8px 0;">
                <strong>ReUNE</strong> - Planejamento de eventos simplificado
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
    'Convite para recursos VIP e acesso antecipado',
    '["nome", "codigo_acesso"]'::jsonb,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- DADOS INICIAIS - ADMIN SETTINGS
-- =====================================================

INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('auto_welcome_enabled', 'false'::jsonb, 'Enviar e-mail de boas-vindas automaticamente'),
  ('from_email', '"ReUNE <noreply@reuneapp.com.br>"'::jsonb, 'E-mail remetente padrão'),
  ('from_name', '"ReUNE"'::jsonb, 'Nome do remetente'),
  ('default_welcome_template', '"boas_vindas"'::jsonb, 'Template padrão de boas-vindas'),
  ('admin_email', '"admin@reuneapp.com.br"'::jsonb, 'E-mail do administrador para notificações'),
  ('email_daily_limit', '1000'::jsonb, 'Limite diário de e-mails - proteção contra spam')
ON CONFLICT (key) DO NOTHING;