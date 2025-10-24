-- Criar função para vincular convites pendentes ao novo usuário
CREATE OR REPLACE FUNCTION public.link_pending_invitations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Buscar o email do novo usuário
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Atualizar convites pendentes que foram enviados para este email
  -- mas ainda não tinham user_id associado
  UPDATE event_invitations
  SET 
    status = 'pending'
  WHERE participant_email = user_email
    AND status = 'pending';

  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando um perfil for criado
DROP TRIGGER IF EXISTS on_profile_created_link_invitations ON public.profiles;
CREATE TRIGGER on_profile_created_link_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_pending_invitations();