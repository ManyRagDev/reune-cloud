-- Criar tabela de logs de envio de e-mails
-- Migration criada para Admin Email Center

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
