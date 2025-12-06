-- Expandir tabela waitlist_reune com campos para gerenciamento de e-mails
-- Migration criada para Admin Email Center

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
