-- Atualizar a função process_invitation para sempre salvar o email
CREATE OR REPLACE FUNCTION public.process_invitation(_event_id bigint, _invitee_email text, _invitee_name text, _is_organizer boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _inviter_id uuid := auth.uid();
  _existing_user_id uuid;
  _event_record record;
  _invitation_id uuid;
  _invitation_token uuid;
BEGIN
  -- Verificar se usuário tem permissão (criador ou organizador)
  IF NOT (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE id = _event_id AND user_id = _inviter_id
    ) OR is_event_organizer(_inviter_id, _event_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissão para convidar pessoas';
  END IF;

  -- Buscar dados do evento
  SELECT * INTO _event_record
  FROM table_reune
  WHERE id = _event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evento não encontrado';
  END IF;

  -- Verificar se o email já está cadastrado
  SELECT id INTO _existing_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(_invitee_email)
  LIMIT 1;

  -- Gerar token único para o convite
  _invitation_token := gen_random_uuid();

  -- Criar registro na tabela event_invitations (SEMPRE com email)
  INSERT INTO event_invitations (
    event_id,
    participant_email,
    participant_name,
    invitation_token,
    status
  ) VALUES (
    _event_id,
    _invitee_email,  -- Sempre salvar o email
    _invitee_name,
    _invitation_token,
    'pending'
  )
  ON CONFLICT (event_id, participant_email)
  DO UPDATE SET
    participant_name = EXCLUDED.participant_name,
    invitation_token = EXCLUDED.invitation_token,
    status = 'pending',
    created_at = NOW()
  RETURNING id INTO _invitation_id;

  -- Se usuário existe, criar notificação in-app
  IF _existing_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _existing_user_id,
      _event_id,
      CASE WHEN _is_organizer THEN 'organizer_invite' ELSE 'event_invite' END,
      'Novo Convite: ' || _event_record.title,
      'Você foi convidado(a) como ' || 
      CASE WHEN _is_organizer THEN 'organizador(a)' ELSE 'participante' END ||
      ' do evento ' || _event_record.title,
      jsonb_build_object(
        'invitation_id', _invitation_id,
        'is_organizer', _is_organizer,
        'event_date', _event_record.event_date,
        'event_time', _event_record.event_time
      )
    )
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
      'user_exists', true,
      'message', 'Convite enviado via notificação in-app',
      'invitation_id', _invitation_id
    );
  ELSE
    -- Retornar dados necessários para enviar email no cliente
    RETURN jsonb_build_object(
      'user_exists', false,
      'message', 'Email precisa ser enviado',
      'invitation_id', _invitation_id,
      'invitation_token', _invitation_token,
      'event_data', jsonb_build_object(
        'title', _event_record.title,
        'date', _event_record.event_date,
        'time', _event_record.event_time
      )
    );
  END IF;
END;
$function$;