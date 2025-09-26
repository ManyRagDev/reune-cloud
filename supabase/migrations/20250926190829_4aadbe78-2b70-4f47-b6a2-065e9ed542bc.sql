-- Criar tabela para co-organizadores
CREATE TABLE public.event_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT REFERENCES public.table_reune(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view organizers of events they can see" 
ON public.event_organizers FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.table_reune 
    WHERE id = event_organizers.event_id 
    AND (is_public = true OR user_id = auth.uid())
  )
);

CREATE POLICY "Organizers can add other organizers" 
ON public.event_organizers FOR INSERT 
WITH CHECK (
  -- Deve ser organizador do evento para adicionar outros
  auth.uid() IN (
    SELECT user_id FROM public.table_reune WHERE id = event_id
    UNION
    SELECT user_id FROM public.event_organizers WHERE event_id = event_organizers.event_id
  )
);

CREATE POLICY "Organizers can remove other organizers" 
ON public.event_organizers FOR DELETE 
USING (
  -- Deve ser organizador do evento para remover outros
  auth.uid() IN (
    SELECT user_id FROM public.table_reune WHERE id = event_id
    UNION  
    SELECT user_id FROM public.event_organizers WHERE event_id = event_organizers.event_id
  )
);