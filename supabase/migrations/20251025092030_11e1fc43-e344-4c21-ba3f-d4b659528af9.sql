-- Limpar solicitações inválidas (sem email de destinatário)
DELETE FROM friend_requests 
WHERE receiver_email IS NULL OR receiver_email = '';

-- Adicionar constraint NOT NULL para receiver_email (já existe, mas garantir)
-- Adicionar constraint de verificação de formato de email
ALTER TABLE friend_requests 
ADD CONSTRAINT valid_email_format 
CHECK (receiver_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Adicionar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_friend_requests_status 
ON friend_requests(status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_email 
ON friend_requests(receiver_email);

-- Atualizar função send_friend_request para validar melhor o email
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
  _pending_request BOOLEAN;
BEGIN
  -- Validar formato de email
  IF _receiver_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;

  -- Normalizar email (lowercase, trim)
  _receiver_email := LOWER(TRIM(_receiver_email));

  -- Verificar se não está tentando adicionar a si mesmo
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE id = _sender_id AND LOWER(email) = _receiver_email
  ) THEN
    RAISE EXCEPTION 'Você não pode enviar solicitação de amizade para si mesmo';
  END IF;

  -- Verificar se já são amigos
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id_1 = _sender_id AND user_id_2 = (SELECT id FROM auth.users WHERE LOWER(email) = _receiver_email))
       OR (user_id_2 = _sender_id AND user_id_1 = (SELECT id FROM auth.users WHERE LOWER(email) = _receiver_email))
  ) INTO _already_friends;

  IF _already_friends THEN
    RAISE EXCEPTION 'Vocês já são amigos';
  END IF;

  -- Verificar se já existe solicitação pendente
  SELECT EXISTS (
    SELECT 1 FROM friend_requests
    WHERE sender_id = _sender_id 
    AND LOWER(receiver_email) = _receiver_email
    AND status = 'pending'
  ) INTO _pending_request;

  IF _pending_request THEN
    RAISE EXCEPTION 'Já existe uma solicitação pendente para este usuário';
  END IF;

  -- Verificar se destinatário existe
  SELECT id INTO _receiver_id
  FROM auth.users
  WHERE LOWER(email) = _receiver_email
  LIMIT 1;

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