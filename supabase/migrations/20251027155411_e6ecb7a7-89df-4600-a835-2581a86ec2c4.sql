-- Remover função antiga
DROP FUNCTION IF EXISTS public.send_friend_request(text);

-- Criar nova função que aceita email ou username
CREATE OR REPLACE FUNCTION public.send_friend_request(_receiver_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _sender_id UUID := auth.uid();
  _receiver_id UUID;
  _receiver_email TEXT;
  _request_id UUID;
  _invitation_token UUID;
  _sender_name TEXT;
  _already_friends BOOLEAN;
  _pending_request BOOLEAN;
  _is_email BOOLEAN;
BEGIN
  -- Normalizar entrada
  _receiver_identifier := LOWER(TRIM(_receiver_identifier));
  
  -- Determinar se é email (tem @ e ponto) ou username
  _is_email := _receiver_identifier ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
  
  IF _is_email THEN
    -- É um email válido
    _receiver_email := _receiver_identifier;
    
    -- Buscar usuário por email
    SELECT id INTO _receiver_id
    FROM auth.users
    WHERE LOWER(email) = _receiver_email
    LIMIT 1;
  ELSE
    -- É um username (remover @ se houver)
    _receiver_identifier := REGEXP_REPLACE(_receiver_identifier, '^@', '');
    
    -- Buscar usuário por username
    SELECT p.id, u.email INTO _receiver_id, _receiver_email
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.username) = _receiver_identifier
    LIMIT 1;
    
    IF _receiver_id IS NULL THEN
      RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
  END IF;

  -- Verificar se não está tentando adicionar a si mesmo
  IF _receiver_id = _sender_id OR (_receiver_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = _sender_id AND LOWER(email) = _receiver_email
  )) THEN
    RAISE EXCEPTION 'Você não pode enviar solicitação de amizade para si mesmo';
  END IF;

  -- Verificar se já são amigos
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id_1 = _sender_id AND user_id_2 = _receiver_id)
       OR (user_id_2 = _sender_id AND user_id_1 = _receiver_id)
  ) INTO _already_friends;

  IF _already_friends THEN
    RAISE EXCEPTION 'Vocês já são amigos';
  END IF;

  -- Verificar se já existe solicitação pendente
  IF _receiver_email IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM friend_requests
      WHERE sender_id = _sender_id 
      AND LOWER(receiver_email) = _receiver_email
      AND status = 'pending'
    ) INTO _pending_request;

    IF _pending_request THEN
      RAISE EXCEPTION 'Já existe uma solicitação pendente para este usuário';
    END IF;
  END IF;

  -- Buscar nome do remetente
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

-- Remover constraint de validação de email, já que agora aceita username também
ALTER TABLE friend_requests DROP CONSTRAINT IF EXISTS valid_email_format;