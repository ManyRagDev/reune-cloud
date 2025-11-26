-- Corrigir o search_path da função get_my_email para resolver o warning de segurança

CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT email::text 
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$;