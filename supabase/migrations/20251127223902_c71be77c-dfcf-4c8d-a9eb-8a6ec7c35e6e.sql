-- Atualizar função search_user_by_identifier para usar LEFT JOIN
-- Isso permite encontrar usuários mesmo sem perfil criado
CREATE OR REPLACE FUNCTION public.search_user_by_identifier(_identifier text)
 RETURNS TABLE(id uuid, display_name text, username text, avatar_url text, email text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _normalized_identifier text;
BEGIN
  -- Normalizar identificador (remover @ e converter para minúsculas)
  _normalized_identifier := LOWER(TRIM(_identifier));
  _normalized_identifier := REGEXP_REPLACE(_normalized_identifier, '^@', '');

  -- Se contém @, é email
  IF _normalized_identifier ~ '@' THEN
    RETURN QUERY
    SELECT
      u.id,
      p.display_name,
      p.username,
      p.avatar_url,
      u.email::text
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE LOWER(u.email) = _normalized_identifier
    LIMIT 1;
  ELSE
    -- É username - aqui precisa ter perfil com username
    RETURN QUERY
    SELECT
      p.id,
      p.display_name,
      p.username,
      p.avatar_url,
      u.email::text
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.username) = _normalized_identifier
    LIMIT 1;
  END IF;
END;
$function$;