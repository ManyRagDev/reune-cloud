-- Atualizar função participants_bulk_upsert para validar se evento foi criado pela IA
CREATE OR REPLACE FUNCTION public.participants_bulk_upsert(evento_id text, participantes jsonb)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  participante JSONB;
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

  -- Se o evento NÃO foi criado pela IA, não permitir adicionar participantes via esta função
  IF event_created_by_ai = false THEN
    RAISE EXCEPTION 'Não é permitido adicionar participantes automaticamente a eventos criados manualmente. Use a interface de usuário.';
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
$function$;