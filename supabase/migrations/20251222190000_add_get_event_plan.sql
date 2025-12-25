-- Add missing get_event_plan RPC for table_reune domain
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
  -- Check access
  IF NOT EXISTS (
    SELECT 1
    FROM table_reune
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
