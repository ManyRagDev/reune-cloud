-- Garantir que a função respond_to_friend_request está funcionando corretamente
-- e que a amizade é criada ao aceitar

-- Recriar a função com melhorias
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(_request_id uuid, _accept boolean)
RETURNS jsonb
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
  _request_status TEXT;
BEGIN
  -- Buscar pedido e validar
  SELECT sender_id, status INTO _sender_id, _request_status
  FROM friend_requests
  WHERE id = _request_id
    AND receiver_id = _receiver_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou você não tem permissão';
  END IF;

  -- Verificar se já foi respondido
  IF _request_status != 'pending' THEN
    RAISE EXCEPTION 'Este pedido já foi respondido anteriormente';
  END IF;

  -- Atualizar status do pedido
  UPDATE friend_requests
  SET status = CASE WHEN _accept THEN 'accepted' ELSE 'rejected' END,
      responded_at = NOW()
  WHERE id = _request_id;

  -- Se aceito, criar amizade
  IF _accept THEN
    -- Garantir ordem para unique constraint (menor UUID primeiro)
    IF _sender_id < _receiver_id THEN
      _user_id_1 := _sender_id;
      _user_id_2 := _receiver_id;
    ELSE
      _user_id_1 := _receiver_id;
      _user_id_2 := _sender_id;
    END IF;

    -- Inserir amizade (ON CONFLICT para evitar duplicatas)
    INSERT INTO friendships (user_id_1, user_id_2)
    VALUES (_user_id_1, _user_id_2)
    ON CONFLICT (user_id_1, user_id_2) DO NOTHING;

    -- Buscar nome do receiver para notificação
    SELECT COALESCE(p.display_name, u.email) INTO _receiver_name
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = _receiver_id;

    -- Notificar remetente que o pedido foi aceito
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _sender_id,
      'friend_accepted',
      'Pedido de amizade aceito',
      _receiver_name || ' aceitou seu pedido de amizade',
      jsonb_build_object(
        'friend_id', _receiver_id,
        'request_id', _request_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'accepted', _accept,
    'friendship_created', _accept
  );
END;
$$;

-- Adicionar política RLS para permitir que a função security definer possa inserir
-- (mesmo que não seja estritamente necessário, é boa prática ter políticas explícitas)
DROP POLICY IF EXISTS "Sistema pode criar amizades via funções" ON friendships;
CREATE POLICY "Sistema pode criar amizades via funções" ON friendships
  FOR INSERT
  WITH CHECK (true);

-- Garantir que a função get_friends está otimizada
CREATE OR REPLACE FUNCTION public.get_friends(_search text DEFAULT NULL)
RETURNS TABLE(
  friend_id uuid, 
  display_name text, 
  avatar_url text, 
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

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
  JOIN auth.users u ON u.id = (
    CASE 
      WHEN f.user_id_1 = _user_id THEN f.user_id_2
      ELSE f.user_id_1
    END
  )
  LEFT JOIN profiles p ON p.id = u.id
  WHERE (f.user_id_1 = _user_id OR f.user_id_2 = _user_id)
  AND (_search IS NULL OR COALESCE(p.display_name, u.email) ILIKE '%' || _search || '%')
  ORDER BY COALESCE(p.display_name, u.email);
END;
$$;