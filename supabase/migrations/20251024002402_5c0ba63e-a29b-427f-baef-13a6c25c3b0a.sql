-- Criar tabela de solicitações de amizade
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invitation_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sender_id, receiver_email)
);

-- Criar tabela de amizades confirmadas
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (user_id_1 < user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

-- Índices para performance
CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id) WHERE status = 'pending';
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX idx_friendships_user1 ON public.friendships(user_id_1);
CREATE INDEX idx_friendships_user2 ON public.friendships(user_id_2);

-- Enable RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies para friend_requests
CREATE POLICY "Usuários podem criar pedidos de amizade"
ON public.friend_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Usuários podem ver pedidos enviados por eles"
ON public.friend_requests
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Destinatários podem atualizar pedidos recebidos"
ON public.friend_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Remetentes podem deletar pedidos pendentes"
ON public.friend_requests
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id AND status = 'pending');

-- RLS Policies para friendships
CREATE POLICY "Usuários podem ver suas próprias amizades"
ON public.friendships
FOR SELECT
TO authenticated
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Função para enviar pedido de amizade
CREATE OR REPLACE FUNCTION public.send_friend_request(_receiver_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Buscar nome do remetente
  SELECT COALESCE(display_name, email) INTO _sender_name
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE p.id = _sender_id;

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
$$;

-- Função para responder pedido de amizade
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(_request_id UUID, _accept BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _receiver_id UUID := auth.uid();
  _sender_id UUID;
  _user_id_1 UUID;
  _user_id_2 UUID;
  _receiver_name TEXT;
BEGIN
  -- Buscar pedido e validar
  SELECT sender_id INTO _sender_id
  FROM friend_requests
  WHERE id = _request_id
    AND receiver_id = _receiver_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou inválido';
  END IF;

  -- Atualizar status do pedido
  UPDATE friend_requests
  SET status = CASE WHEN _accept THEN 'accepted' ELSE 'rejected' END,
      responded_at = NOW()
  WHERE id = _request_id;

  -- Se aceito, criar amizade
  IF _accept THEN
    -- Garantir ordem para unique constraint
    IF _sender_id < _receiver_id THEN
      _user_id_1 := _sender_id;
      _user_id_2 := _receiver_id;
    ELSE
      _user_id_1 := _receiver_id;
      _user_id_2 := _sender_id;
    END IF;

    INSERT INTO friendships (user_id_1, user_id_2)
    VALUES (_user_id_1, _user_id_2)
    ON CONFLICT DO NOTHING;

    -- Buscar nome do receiver
    SELECT COALESCE(display_name, email) INTO _receiver_name
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.id = _receiver_id;

    -- Notificar remetente
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _sender_id,
      'friend_request_accepted',
      'Pedido de amizade aceito',
      _receiver_name || ' aceitou seu pedido de amizade',
      jsonb_build_object(
        'friend_id', _receiver_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'accepted', _accept
  );
END;
$$;

-- Função para buscar amigos
CREATE OR REPLACE FUNCTION public.get_friends(_search TEXT DEFAULT NULL)
RETURNS TABLE(
  friend_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id_1 = _user_id THEN f.user_id_2
      ELSE f.user_id_1
    END as friend_id,
    COALESCE(p.display_name, u.email) as display_name,
    p.avatar_url,
    u.email
  FROM friendships f
  JOIN auth.users u ON (
    CASE 
      WHEN f.user_id_1 = _user_id THEN u.id = f.user_id_2
      ELSE u.id = f.user_id_1
    END
  )
  LEFT JOIN profiles p ON p.id = u.id
  WHERE f.user_id_1 = _user_id OR f.user_id_2 = _user_id
  AND (_search IS NULL OR COALESCE(p.display_name, u.email) ILIKE '%' || _search || '%');
END;
$$;

-- Função para buscar pedidos pendentes
CREATE OR REPLACE FUNCTION public.get_pending_friend_requests()
RETURNS TABLE(
  request_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fr.id as request_id,
    fr.sender_id,
    COALESCE(p.display_name, u.email) as sender_name,
    p.avatar_url as sender_avatar,
    fr.created_at
  FROM friend_requests fr
  JOIN auth.users u ON u.id = fr.sender_id
  LEFT JOIN profiles p ON p.id = fr.sender_id
  WHERE fr.receiver_id = auth.uid()
    AND fr.status = 'pending'
  ORDER BY fr.created_at DESC;
END;
$$;