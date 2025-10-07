-- Função para substituir todos os itens de um evento
CREATE OR REPLACE FUNCTION public.items_replace_for_event(
  evento_id TEXT,
  itens JSONB
) RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
  result_row JSONB;
BEGIN
  -- Verificar se o usuário é o dono do evento
  IF NOT EXISTS (
    SELECT 1 FROM table_reune 
    WHERE id = evento_id::bigint 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao evento';
  END IF;

  -- Deletar itens existentes (se houver)
  DELETE FROM event_items WHERE event_id = evento_id::bigint;

  -- Inserir novos itens
  FOR item IN SELECT * FROM jsonb_array_elements(itens)
  LOOP
    INSERT INTO event_items (
      event_id,
      nome_item,
      quantidade,
      unidade,
      valor_estimado,
      categoria,
      prioridade
    ) VALUES (
      evento_id::bigint,
      item->>'nome_item',
      (item->>'quantidade')::numeric,
      item->>'unidade',
      (item->>'valor_estimado')::numeric,
      item->>'categoria',
      item->>'prioridade'
    )
    RETURNING jsonb_build_object(
      'id', id,
      'event_id', event_id,
      'nome_item', nome_item,
      'quantidade', quantidade,
      'unidade', unidade,
      'valor_estimado', valor_estimado,
      'categoria', categoria,
      'prioridade', prioridade
    ) INTO result_row;
    
    RETURN NEXT result_row;
  END LOOP;

  RETURN;
END;
$$;

-- Função para obter plano completo do evento
CREATE OR REPLACE FUNCTION public.get_event_plan(
  evento_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verificar se o usuário tem acesso ao evento
  IF NOT EXISTS (
    SELECT 1 FROM table_reune 
    WHERE id = evento_id::bigint 
    AND (user_id = auth.uid() OR is_public = true)
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao evento';
  END IF;

  SELECT jsonb_build_object(
    'evento', to_jsonb(e.*),
    'itens', COALESCE(
      (SELECT jsonb_agg(to_jsonb(i.*)) FROM event_items i WHERE i.event_id = evento_id::bigint),
      '[]'::jsonb
    ),
    'participantes', COALESCE(
      (SELECT jsonb_agg(to_jsonb(p.*)) FROM event_participants p WHERE p.event_id = evento_id::bigint),
      '[]'::jsonb
    ),
    'distribuicao', '[]'::jsonb
  )
  INTO result
  FROM table_reune e
  WHERE e.id = evento_id::bigint;

  RETURN result;
END;
$$;

-- Função para adicionar/atualizar participantes
CREATE OR REPLACE FUNCTION public.participants_bulk_upsert(
  evento_id TEXT,
  participantes JSONB
) RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  participante JSONB;
  result_row JSONB;
BEGIN
  -- Verificar se o usuário é o dono do evento
  IF NOT EXISTS (
    SELECT 1 FROM table_reune 
    WHERE id = evento_id::bigint 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao evento';
  END IF;

  -- Inserir/atualizar participantes
  FOR participante IN SELECT * FROM jsonb_array_elements(participantes::jsonb)
  LOOP
    INSERT INTO event_participants (
      event_id,
      nome_participante,
      contato,
      status_convite
    ) VALUES (
      evento_id::bigint,
      participante->>'nome_participante',
      participante->>'contato',
      COALESCE(participante->>'status_convite', 'pendente')
    )
    ON CONFLICT (event_id, nome_participante) 
    DO UPDATE SET
      contato = EXCLUDED.contato,
      status_convite = EXCLUDED.status_convite
    RETURNING jsonb_build_object(
      'id', id,
      'event_id', event_id,
      'nome_participante', nome_participante,
      'contato', contato,
      'status_convite', status_convite
    ) INTO result_row;
    
    RETURN NEXT result_row;
  END LOOP;

  RETURN;
END;
$$;

-- Função para distribuição de custos (stub simples)
CREATE OR REPLACE FUNCTION public.distribution_bulk_upsert(
  evento_id TEXT,
  rows JSONB
) RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário é o dono do evento
  IF NOT EXISTS (
    SELECT 1 FROM table_reune 
    WHERE id = evento_id::bigint 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao evento';
  END IF;

  -- Por enquanto, apenas retornar o JSON recebido
  -- (a implementação completa requer uma tabela de distribuição)
  RETURN QUERY SELECT * FROM jsonb_array_elements(rows);
END;
$$;

-- Função para resumo de distribuição (stub simples)
CREATE OR REPLACE FUNCTION public.get_distribution_summary(
  evento_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o usuário tem acesso ao evento
  IF NOT EXISTS (
    SELECT 1 FROM table_reune 
    WHERE id = evento_id::bigint 
    AND (user_id = auth.uid() OR is_public = true)
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao evento';
  END IF;

  -- Retornar estrutura básica
  RETURN jsonb_build_object(
    'porParticipante', '[]'::jsonb,
    'custoTotal', 0
  );
END;
$$;

-- Criar tabelas auxiliares se não existirem
CREATE TABLE IF NOT EXISTS public.event_items (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES table_reune(id) ON DELETE CASCADE,
  nome_item TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'un',
  valor_estimado NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'geral',
  prioridade TEXT NOT NULL DEFAULT 'B' CHECK (prioridade IN ('A', 'B', 'C')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_participants (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES table_reune(id) ON DELETE CASCADE,
  nome_participante TEXT NOT NULL,
  contato TEXT,
  status_convite TEXT NOT NULL DEFAULT 'pendente' CHECK (status_convite IN ('pendente', 'confirmado', 'recusado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, nome_participante)
);

-- Enable RLS
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for event_items
CREATE POLICY "Usuários podem ver itens de eventos próprios ou públicos"
  ON public.event_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_items.event_id 
      AND (table_reune.user_id = auth.uid() OR table_reune.is_public = true)
    )
  );

CREATE POLICY "Usuários podem inserir itens em eventos próprios"
  ON public.event_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_items.event_id 
      AND table_reune.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar itens de eventos próprios"
  ON public.event_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_items.event_id 
      AND table_reune.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar itens de eventos próprios"
  ON public.event_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_items.event_id 
      AND table_reune.user_id = auth.uid()
    )
  );

-- RLS policies for event_participants
CREATE POLICY "Usuários podem ver participantes de eventos próprios ou públicos"
  ON public.event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_participants.event_id 
      AND (table_reune.user_id = auth.uid() OR table_reune.is_public = true)
    )
  );

CREATE POLICY "Usuários podem inserir participantes em eventos próprios"
  ON public.event_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_participants.event_id 
      AND table_reune.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar participantes de eventos próprios"
  ON public.event_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_participants.event_id 
      AND table_reune.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar participantes de eventos próprios"
  ON public.event_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune 
      WHERE table_reune.id = event_participants.event_id 
      AND table_reune.user_id = auth.uid()
    )
  );