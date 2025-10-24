-- Atualizar função send_friend_request para usar email como fallback
CREATE OR REPLACE FUNCTION public.send_friend_request(_receiver_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sender_id UUID := auth.uid();
  _receiver_id UUID;
  _request_id UUID;
  _invitation_token UUID;
  _sender_name TEXT;
  _already_friends BOOLEAN;
BEGIN
  -- Verificar se já são amigos
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id_1 = _sender_id AND user_id_2 = (SELECT id FROM auth.users WHERE email = _receiver_email))
       OR (user_id_2 = _sender_id AND user_id_1 = (SELECT id FROM auth.users WHERE email = _receiver_email))
  ) INTO _already_friends;

  IF _already_friends THEN
    RAISE EXCEPTION 'Vocês já são amigos';
  END IF;

  -- Verificar se destinatário existe
  SELECT id INTO _receiver_id
  FROM auth.users
  WHERE email = _receiver_email
  LIMIT 1;

  -- Buscar nome do remetente (usando email como fallback)
  SELECT COALESCE(p.display_name, u.email) INTO _sender_name
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = _sender_id;

  -- Criar pedido de amizade
  INSERT INTO friend_requests (sender_id, receiver_id, receiver_email)
  VALUES (_sender_id, _receiver_id, _receiver_email)
  ON CONFLICT (sender_id, receiver_email) 
  DO UPDATE SET created_at = NOW(), status = 'pending'
  RETURNING id, invitation_token INTO _request_id, _invitation_token;

  -- Se usuário existe, criar notificação
  IF _receiver_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _receiver_id,
      'friend_request',
      'Nova solicitação de amizade',
      _sender_name || ' quer ser seu amigo',
      jsonb_build_object(
        'request_id', _request_id,
        'sender_id', _sender_id
      )
    );

    RETURN jsonb_build_object(
      'success', true,
      'user_exists', true,
      'request_id', _request_id
    );
  ELSE
    -- Usuário não existe, retornar dados para envio de email
    RETURN jsonb_build_object(
      'success', true,
      'user_exists', false,
      'request_id', _request_id,
      'invitation_token', _invitation_token,
      'sender_name', _sender_name
    );
  END IF;
END;
$function$;