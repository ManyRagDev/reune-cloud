-- ============================================================================
-- SETUP COMPLETO DO ADMIN EMAIL CENTER
-- Execute este arquivo no SQL Editor do Supabase Dashboard
-- ============================================================================

-- ============================================================================
-- 1. EXPANDIR TABELA WAITLIST_REUNE
-- ============================================================================

-- Adicionar novos campos
ALTER TABLE public.waitlist_reune
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_name ON public.waitlist_reune(name);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_origin ON public.waitlist_reune(origin);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_welcome_sent ON public.waitlist_reune(welcome_email_sent);

-- Comentários para documentação
COMMENT ON COLUMN public.waitlist_reune.name IS 'Nome do lead (opcional, pode ser NULL para dados históricos)';
COMMENT ON COLUMN public.waitlist_reune.origin IS 'Origem do cadastro: landing, launch, amigosecreto, invite, etc';
COMMENT ON COLUMN public.waitlist_reune.welcome_email_sent IS 'Indica se o lead já recebeu e-mail de boas-vindas';
COMMENT ON COLUMN public.waitlist_reune.welcome_email_sent_at IS 'Data/hora do envio do e-mail de boas-vindas';

-- ============================================================================
-- 2. CRIAR TABELA EMAIL_TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (apenas service role pode modificar)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Política: apenas service role tem acesso
DROP POLICY IF EXISTS "Service role tem acesso total a templates" ON public.email_templates;
CREATE POLICY "Service role tem acesso total a templates"
ON public.email_templates
USING (false);

-- Índices
CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.email_templates IS 'Templates de e-mail editáveis pelo admin';
COMMENT ON COLUMN public.email_templates.name IS 'Nome único do template (slug)';
COMMENT ON COLUMN public.email_templates.subject IS 'Assunto do e-mail';
COMMENT ON COLUMN public.email_templates.html_content IS 'HTML do template com suporte a variáveis {{nome}}, {{email}}, etc';
COMMENT ON COLUMN public.email_templates.variables IS 'Array JSON com nomes das variáveis disponíveis: ["nome", "email"]';

-- Templates iniciais (usar INSERT ... ON CONFLICT para evitar duplicatas)
INSERT INTO public.email_templates (name, subject, description, html_content, variables) VALUES
(
  'boas_vindas',
  'Bem-vindo ao ReUNE! 🎉',
  'E-mail de boas-vindas para novos leads da waitlist',
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
  '["nome", "email"]'::jsonb
),
(
  'atualizacao_lancamento',
  'Novidades do ReUNE 🚀',
  'Atualização sobre o lançamento da plataforma',
  '<!DOCTYPE html><html lang="pt-BR"><body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, sans-serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding: 40px 20px;"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;"><tr><td align="center" style="padding: 32px 20px;"><h1 style="color: #1a1a1a; font-size: 28px;">Novidades do ReUNE! 🚀</h1></td></tr><tr><td style="padding: 24px 20px;"><p style="color: #374151; font-size: 16px;">Olá{{#if nome}}, {{nome}}{{/if}}!</p><p style="color: #374151; font-size: 16px;">Temos novidades incríveis sobre o lançamento do ReUNE!</p></td></tr></table></td></tr></table></body></html>',
  '["nome"]'::jsonb
),
(
  'convite_exclusivo',
  'Você tem acesso exclusivo ao ReUNE! ✨',
  'Convite para recursos VIP e acesso antecipado',
  '<!DOCTYPE html><html lang="pt-BR"><body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, sans-serif;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding: 40px 20px;"><table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;"><tr><td align="center" style="padding: 32px 20px;"><h1 style="color: #1a1a1a; font-size: 28px;">Parabéns{{#if nome}}, {{nome}}{{/if}}! 🎉</h1></td></tr><tr><td style="padding: 24px 20px;"><p style="color: #374151; font-size: 16px;">Você foi selecionado(a) para ter acesso exclusivo ao ReUNE!</p><p>Código: <strong>{{codigo_acesso}}</strong></p></td></tr></table></td></tr></table></body></html>',
  '["nome", "codigo_acesso"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. CRIAR TABELA EMAIL_LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.waitlist_reune(id) ON DELETE SET NULL,
  lead_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (apenas service role pode visualizar)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Política: apenas service role tem acesso
DROP POLICY IF EXISTS "Service role tem acesso total a logs" ON public.email_logs;
CREATE POLICY "Service role tem acesso total a logs"
ON public.email_logs
USING (false);

-- Índices para performance em queries comuns
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON public.email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_email ON public.email_logs(lead_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON public.email_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

-- Comentários para documentação
COMMENT ON TABLE public.email_logs IS 'Histórico completo de envios de e-mail do admin';
COMMENT ON COLUMN public.email_logs.lead_id IS 'ID do lead (nullable caso lead seja deletado)';
COMMENT ON COLUMN public.email_logs.lead_email IS 'Email do destinatário (guardado para referência mesmo se lead for deletado)';
COMMENT ON COLUMN public.email_logs.template_name IS 'Nome do template usado';
COMMENT ON COLUMN public.email_logs.sent_at IS 'Data/hora do envio';
COMMENT ON COLUMN public.email_logs.status IS 'Status: success, failed ou pending';
COMMENT ON COLUMN public.email_logs.error_message IS 'Mensagem de erro se status = failed';
COMMENT ON COLUMN public.email_logs.metadata IS 'Dados extras: resend_message_id, variables usadas, etc';

-- ============================================================================
-- 4. CRIAR TABELA ADMIN_SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS (apenas service role pode modificar)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Política: apenas service role tem acesso
DROP POLICY IF EXISTS "Service role tem acesso total a settings" ON public.admin_settings;
CREATE POLICY "Service role tem acesso total a settings"
ON public.admin_settings
USING (false);

-- Índice para busca por chave
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Comentários
COMMENT ON TABLE public.admin_settings IS 'Configurações do painel admin';
COMMENT ON COLUMN public.admin_settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN public.admin_settings.value IS 'Valor em formato JSON';
COMMENT ON COLUMN public.admin_settings.description IS 'Descrição da configuração';

-- Configurações iniciais
INSERT INTO public.admin_settings (key, value, description) VALUES
(
  'auto_welcome_enabled',
  'false'::jsonb,
  'Enviar e-mail de boas-vindas automaticamente para novos leads (desativado por padrão para segurança)'
),
(
  'from_email',
  '"ReUNE <noreply@reuneapp.com.br>"'::jsonb,
  'E-mail remetente padrão para envios do admin'
),
(
  'from_name',
  '"ReUNE"'::jsonb,
  'Nome do remetente padrão'
),
(
  'default_welcome_template',
  '"boas_vindas"'::jsonb,
  'Nome do template padrão para e-mail de boas-vindas automático'
),
(
  'admin_email',
  '"admin@reuneapp.com.br"'::jsonb,
  'E-mail do administrador para notificações'
),
(
  'email_daily_limit',
  '1000'::jsonb,
  'Limite diário de e-mails que podem ser enviados (proteção contra spam)'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETO!
-- ============================================================================

-- Verificar se tudo foi criado corretamente
SELECT
  'waitlist_reune' as tabela,
  COUNT(*) FILTER (WHERE column_name = 'name') as tem_campo_name,
  COUNT(*) FILTER (WHERE column_name = 'origin') as tem_campo_origin,
  COUNT(*) FILTER (WHERE column_name = 'welcome_email_sent') as tem_campo_welcome
FROM information_schema.columns
WHERE table_name = 'waitlist_reune'

UNION ALL

SELECT 'email_templates', COUNT(*), 0, 0
FROM email_templates

UNION ALL

SELECT 'admin_settings', COUNT(*), 0, 0
FROM admin_settings

UNION ALL

SELECT 'email_logs', COUNT(*), 0, 0
FROM email_logs;
