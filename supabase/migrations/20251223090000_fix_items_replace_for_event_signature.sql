-- Fix items_replace_for_event signature to accept text (event id is bigint)
DROP FUNCTION IF EXISTS public.items_replace_for_event(uuid, jsonb);

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
  -- Permissao: dono do evento, organizador ou convidado confirmado
  IF NOT (
    EXISTS (SELECT 1 FROM table_reune WHERE id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers WHERE event_id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations WHERE event_id = evento_id::bigint AND user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissao para editar itens deste evento';
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
