-- Criar tabela para confirmações de presença em eventos
CREATE TABLE IF NOT EXISTS public.event_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id bigint NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date_confirmed boolean DEFAULT false,
  time_confirmed boolean DEFAULT false,
  location_confirmed boolean DEFAULT false,
  presence_confirmed boolean DEFAULT false,
  alternative_date date,
  alternative_time time without time zone,
  alternative_location text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.event_confirmations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários podem ver confirmações de eventos públicos ou seus próprios"
ON public.event_confirmations
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM public.table_reune
    WHERE table_reune.id = event_confirmations.event_id
    AND (table_reune.is_public = true OR table_reune.user_id = auth.uid())
  )
);

CREATE POLICY "Usuários podem criar suas próprias confirmações"
ON public.event_confirmations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias confirmações"
ON public.event_confirmations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias confirmações"
ON public.event_confirmations
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_event_confirmations_updated_at
BEFORE UPDATE ON public.event_confirmations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();