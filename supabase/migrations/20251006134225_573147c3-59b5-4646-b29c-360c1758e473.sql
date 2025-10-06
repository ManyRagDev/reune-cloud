-- Tabela principal de eventos
CREATE TABLE public.table_reune (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_time TEXT NOT NULL DEFAULT '12:00',
  location TEXT,
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de organizadores de eventos
CREATE TABLE public.event_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT REFERENCES public.table_reune(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de confirmações de eventos
CREATE TABLE public.event_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  presence_confirmed BOOLEAN DEFAULT false,
  date_confirmed BOOLEAN DEFAULT false,
  time_confirmed BOOLEAN DEFAULT false,
  location_confirmed BOOLEAN DEFAULT false,
  alternative_date DATE,
  alternative_time TEXT,
  alternative_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Índices para melhor performance
CREATE INDEX idx_table_reune_user_id ON public.table_reune(user_id);
CREATE INDEX idx_table_reune_event_date ON public.table_reune(event_date);
CREATE INDEX idx_event_organizers_event_id ON public.event_organizers(event_id);
CREATE INDEX idx_event_organizers_user_id ON public.event_organizers(user_id);
CREATE INDEX idx_event_confirmations_event_id ON public.event_confirmations(event_id);
CREATE INDEX idx_event_confirmations_user_id ON public.event_confirmations(user_id);

-- Habilitar RLS
ALTER TABLE public.table_reune ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_confirmations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para table_reune
CREATE POLICY "Usuários podem ver eventos públicos ou próprios"
  ON public.table_reune FOR SELECT
  USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Usuários podem criar eventos"
  ON public.table_reune FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprios eventos"
  ON public.table_reune FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar próprios eventos"
  ON public.table_reune FOR DELETE
  USING (user_id = auth.uid());

-- Políticas RLS para event_organizers
CREATE POLICY "Todos podem ver organizadores de eventos públicos"
  ON public.event_organizers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE id = event_organizers.event_id
      AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Criadores de eventos podem adicionar organizadores"
  ON public.event_organizers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE id = event_organizers.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Criadores podem remover organizadores"
  ON public.event_organizers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE id = event_organizers.event_id
      AND user_id = auth.uid()
    )
  );

-- Políticas RLS para event_confirmations
CREATE POLICY "Usuários podem ver próprias confirmações"
  ON public.event_confirmations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Organizadores podem ver confirmações de seus eventos"
  ON public.event_confirmations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE id = event_confirmations.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar próprias confirmações"
  ON public.event_confirmations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprias confirmações"
  ON public.event_confirmations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar próprias confirmações"
  ON public.event_confirmations FOR DELETE
  USING (user_id = auth.uid());

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_table_reune_updated_at
  BEFORE UPDATE ON public.table_reune
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_confirmations_updated_at
  BEFORE UPDATE ON public.event_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();