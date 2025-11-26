-- Tabela para dinâmicas de eventos
CREATE TABLE IF NOT EXISTS public.event_dynamics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id bigint NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('secret_santa')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela para configuração de Amigo Secreto
CREATE TABLE IF NOT EXISTS public.event_secret_santa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id bigint NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  min_value numeric,
  max_value numeric,
  draw_date timestamp with time zone,
  rules_json jsonb DEFAULT '{}'::jsonb,
  has_drawn boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Tabela para participantes do Amigo Secreto
CREATE TABLE IF NOT EXISTS public.event_secret_santa_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_santa_id uuid NOT NULL REFERENCES public.event_secret_santa(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  wishlist_text text,
  wishlist_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(secret_santa_id, user_id)
);

-- Tabela para pares sorteados do Amigo Secreto
CREATE TABLE IF NOT EXISTS public.event_secret_santa_pairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_santa_id uuid NOT NULL REFERENCES public.event_secret_santa(id) ON DELETE CASCADE,
  giver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(secret_santa_id, giver_id)
);

-- Habilitar RLS
ALTER TABLE public.event_dynamics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_secret_santa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_secret_santa_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_secret_santa_pairs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para event_dynamics
CREATE POLICY "Usuários podem ver dinâmicas de eventos acessíveis"
  ON public.event_dynamics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_dynamics.event_id
      AND (table_reune.user_id = auth.uid() OR table_reune.is_public = true OR is_event_organizer(auth.uid(), event_dynamics.event_id))
    )
  );

CREATE POLICY "Organizadores podem criar dinâmicas"
  ON public.event_dynamics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_dynamics.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_dynamics.event_id))
    )
  );

CREATE POLICY "Organizadores podem deletar dinâmicas"
  ON public.event_dynamics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_dynamics.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_dynamics.event_id))
    )
  );

-- Políticas RLS para event_secret_santa
CREATE POLICY "Usuários podem ver amigo secreto de eventos acessíveis"
  ON public.event_secret_santa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_secret_santa.event_id
      AND (table_reune.user_id = auth.uid() OR table_reune.is_public = true OR is_event_organizer(auth.uid(), event_secret_santa.event_id))
    )
  );

CREATE POLICY "Organizadores podem criar amigo secreto"
  ON public.event_secret_santa FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_secret_santa.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_secret_santa.event_id))
    )
  );

CREATE POLICY "Organizadores podem atualizar amigo secreto"
  ON public.event_secret_santa FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_secret_santa.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_secret_santa.event_id))
    )
  );

-- Políticas RLS para event_secret_santa_participants
CREATE POLICY "Usuários podem ver participantes de amigo secreto acessível"
  ON public.event_secret_santa_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_participants.secret_santa_id
      AND (tr.user_id = auth.uid() OR tr.is_public = true OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

CREATE POLICY "Organizadores podem adicionar participantes"
  ON public.event_secret_santa_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_participants.secret_santa_id
      AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

CREATE POLICY "Participantes podem atualizar próprio perfil"
  ON public.event_secret_santa_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Políticas RLS para event_secret_santa_pairs
CREATE POLICY "Participantes veem apenas seu par"
  ON public.event_secret_santa_pairs FOR SELECT
  USING (
    giver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_pairs.secret_santa_id
      AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

CREATE POLICY "Sistema pode criar pares durante sorteio"
  ON public.event_secret_santa_pairs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_pairs.secret_santa_id
      AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_secret_santa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_dynamics_updated_at
  BEFORE UPDATE ON public.event_dynamics
  FOR EACH ROW
  EXECUTE FUNCTION update_secret_santa_updated_at();

CREATE TRIGGER update_event_secret_santa_updated_at
  BEFORE UPDATE ON public.event_secret_santa
  FOR EACH ROW
  EXECUTE FUNCTION update_secret_santa_updated_at();

CREATE TRIGGER update_event_secret_santa_participants_updated_at
  BEFORE UPDATE ON public.event_secret_santa_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_secret_santa_updated_at();