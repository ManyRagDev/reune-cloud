-- Criar tabela de configurações do admin
-- Migration criada para Admin Email Center

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
CREATE POLICY "Service role tem acesso total a settings"
ON public.admin_settings
USING (false);

-- Índice para busca por chave
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

-- Trigger para atualizar updated_at
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
