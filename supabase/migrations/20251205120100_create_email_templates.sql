-- Criar tabela de templates de e-mail
-- Migration criada para Admin Email Center

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

-- Templates iniciais
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
                Fique de olho no seu e-mail ({{email}}) para novidades exclusivas e acesso antecipado. ✨
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 8px 20px 32px;">
              <a href="https://reuneapp.com.br" style="display: inline-block; background-color: #f59e0b; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">
                Conhecer o ReUNE
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
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0;">
                [Adicione aqui o conteúdo da atualização]
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 8px 20px 32px;">
              <a href="https://reuneapp.com.br" style="display: inline-block; background-color: #0ea5e9; border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">
                Saber Mais
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
  '["nome"]'::jsonb
),
(
  'convite_exclusivo',
  'Você tem acesso exclusivo ao ReUNE! ✨',
  'Convite para recursos VIP e acesso antecipado',
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
            <td align="center" style="padding: 32px 20px;">
              <div style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 12px; padding: 12px 24px;">
                <span style="color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                  ⭐ Acesso VIP
                </span>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 0 20px 24px;">
              <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0;">
                Parabéns{{#if nome}}, {{nome}}{{/if}}! 🎉
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 20px 24px;">
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Você foi selecionado(a) para ter <strong>acesso exclusivo</strong> ao ReUNE antes de todo mundo!
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 24px; margin: 0 0 16px 0;">
                Use seu código de acesso especial:
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <div style="display: inline-block; background-color: #fef3c7; border: 2px dashed #f59e0b; border-radius: 8px; padding: 16px 32px;">
                  <code style="color: #92400e; font-size: 24px; font-weight: 700; font-family: monospace;">
                    {{codigo_acesso}}
                  </code>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 8px 20px 32px;">
              <a href="https://reuneapp.com.br/app" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 8px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px;">
                Ativar Acesso VIP →
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
  '["nome", "codigo_acesso"]'::jsonb
)
ON CONFLICT (name) DO NOTHING;
