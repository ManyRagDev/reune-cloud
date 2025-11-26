-- Recriar função get_my_email com SECURITY DEFINER (sem DROP)
-- CREATE OR REPLACE substitui a função existente sem quebrar dependências

CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text 
  FROM auth.users 
  WHERE id = auth.uid();
$$;