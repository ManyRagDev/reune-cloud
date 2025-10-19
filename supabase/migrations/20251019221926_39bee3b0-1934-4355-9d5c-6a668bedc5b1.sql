-- Atualizar função items_replace_for_event para validar se evento foi criado pela IA
CREATE OR REPLACE FUNCTION public.items_replace_for_event(evento_id text, itens jsonb)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item JSONB;
  result_row JSONB;
  event_created_by_ai BOOLEAN;
BEGIN
  -- Verificar se o usuário é o dono do evento
  IF NOT EXISTS (
    SELECT 1 FROM table_reune 
    WHERE id = evento_id::bigint 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado ao evento';
  END IF;

  -- Verificar se o evento foi criado pela IA
  SELECT created_by_ai INTO event_created_by_ai
  FROM table_reune
  WHERE id = evento_id::bigint;

  -- Se o evento NÃO foi criado pela IA, não permitir adicionar itens via esta função
  IF event_created_by_ai = false THEN
    RAISE EXCEPTION 'Não é permitido adicionar itens automaticamente a eventos criados manualmente. Use a interface de usuário.';
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
$function$;