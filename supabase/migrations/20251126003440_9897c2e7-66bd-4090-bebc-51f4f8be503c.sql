-- Corrigir permissões da função get_my_email
-- A função precisa de SECURITY DEFINER para acessar auth.users

-- Recriar a função com as configurações corretas
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN (
    SELECT email::text 
    FROM auth.users 
    WHERE id = auth.uid()
  );
END;
$$;

-- Garantir que a função possa ser executada por usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_my_email() TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_my_email() IS 'Retorna o email do usuário autenticado atual. Usa SECURITY DEFINER para acessar auth.users.';