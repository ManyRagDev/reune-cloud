-- Permitir salvamento colaborativo por donos, organizadores e convidados confirmados
-- Remove bloqueios por created_by_ai nas funções e adiciona políticas RLS para edição colaborativa

-- Função: items_replace_for_event
CREATE OR REPLACE FUNCTION public.items_replace_for_event(evento_id text, itens jsonb)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item JSONB;
  result_row JSONB;
BEGIN
  -- Permissão: dono do evento, organizador ou convidado confirmado
  IF NOT (
    EXISTS (SELECT 1 FROM table_reune WHERE id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers WHERE event_id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations WHERE event_id = evento_id::bigint AND user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão para editar itens deste evento';
  END IF;

  -- Deletar itens existentes
  DELETE FROM event_items WHERE event_id = evento_id::bigint;

  -- Inserir novos itens
  FOR item IN SELECT * FROM jsonb_array_elements(itens)
  LOOP
    INSERT INTO event_items (
      event_id, nome_item, quantidade, unidade, valor_estimado, categoria, prioridade
    ) VALUES (
      evento_id::bigint,
      item->>'nome_item',
      COALESCE((item->>'quantidade')::numeric, 1),
      COALESCE(item->>'unidade', 'un'),
      COALESCE((item->>'valor_estimado')::numeric, 0),
      COALESCE(item->>'categoria', ''),
      COALESCE(item->>'prioridade', 'C')
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
$function$;

-- Função: participants_bulk_upsert
CREATE OR REPLACE FUNCTION public.participants_bulk_upsert(evento_id text, participantes jsonb)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  participante JSONB;
  result_row JSONB;
BEGIN
  -- Permissão: dono do evento, organizador ou convidado confirmado
  IF NOT (
    EXISTS (SELECT 1 FROM table_reune WHERE id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers WHERE event_id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations WHERE event_id = evento_id::bigint AND user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissão para editar participantes deste evento';
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
    ON CONFLICT (event_id, contato)
    DO UPDATE SET
      nome_participante = EXCLUDED.nome_participante,
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
$function$;

-- Habilitar RLS e políticas colaborativas
DO $$
BEGIN
  -- event_items
  EXECUTE 'ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Collaborators can manage items" ON public.event_items FOR ALL USING (
    EXISTS (SELECT 1 FROM table_reune tr WHERE tr.id = event_items.event_id AND tr.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers eo WHERE eo.event_id = event_items.event_id AND eo.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations ec WHERE ec.event_id = event_items.event_id AND ec.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM table_reune tr WHERE tr.id = event_items.event_id AND tr.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers eo WHERE eo.event_id = event_items.event_id AND eo.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations ec WHERE ec.event_id = event_items.event_id AND ec.user_id = auth.uid())
  )';

  -- event_participants
  EXECUTE 'ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY IF NOT EXISTS "Collaborators can manage participants" ON public.event_participants FOR ALL USING (
    EXISTS (SELECT 1 FROM table_reune tr WHERE tr.id = event_participants.event_id AND tr.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers eo WHERE eo.event_id = event_participants.event_id AND eo.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations ec WHERE ec.event_id = event_participants.event_id AND ec.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM table_reune tr WHERE tr.id = event_participants.event_id AND tr.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers eo WHERE eo.event_id = event_participants.event_id AND eo.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations ec WHERE ec.event_id = event_participants.event_id AND ec.user_id = auth.uid())
  )';
END$$;