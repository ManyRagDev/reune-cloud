-- Corrigir a função get_friends para lidar com o tipo correto do email
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
    COALESCE(p.display_name, u.email::text) as display_name,
    p.avatar_url,
    u.email::text as email  -- Cast explícito para text
  FROM friendships f
  JOIN auth.users u ON u.id = (
    CASE 
      WHEN f.user_id_1 = _user_id THEN f.user_id_2
      ELSE f.user_id_1
    END
  )
  LEFT JOIN profiles p ON p.id = u.id
  WHERE (f.user_id_1 = _user_id OR f.user_id_2 = _user_id)
  AND (_search IS NULL OR COALESCE(p.display_name, u.email::text) ILIKE '%' || _search || '%')
  ORDER BY COALESCE(p.display_name, u.email::text);
END;
$$;