-- Função para atualizar convites pendentes quando amizade é aceita
CREATE OR REPLACE FUNCTION public.update_pending_invites_on_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _friend_id UUID;
  _user_id UUID;
BEGIN
  -- Determinar os IDs dos amigos
  _friend_id := NEW.user_id_1;
  _user_id := NEW.user_id_2;
  
  -- Atualizar convites onde user_id_1 criou eventos e convidou user_id_2
  UPDATE event_invitations ei
  SET status = 'accepted'
  WHERE ei.participant_email IN (
    SELECT email FROM auth.users WHERE id = _user_id
  )
  AND ei.status = 'pending'
  AND ei.event_id IN (
    SELECT id FROM table_reune WHERE user_id = _friend_id
  );
  
  -- Atualizar convites onde user_id_2 criou eventos e convidou user_id_1
  UPDATE event_invitations ei
  SET status = 'accepted'
  WHERE ei.participant_email IN (
    SELECT email FROM auth.users WHERE id = _friend_id
  )
  AND ei.status = 'pending'
  AND ei.event_id IN (
    SELECT id FROM table_reune WHERE user_id = _user_id
  );
  
  -- Criar notificações para ambos sobre convites ativados
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT 
    _user_id,
    'friendship_invite_activated',
    'Convites de eventos ativados',
    'Seus convites pendentes foram ativados após aceitar a amizade',
    jsonb_build_object('friend_id', _friend_id)
  WHERE EXISTS (
    SELECT 1 FROM event_invitations ei
    WHERE ei.participant_email IN (
      SELECT email FROM auth.users WHERE id = _user_id
    )
    AND ei.status = 'accepted'
    AND ei.event_id IN (
      SELECT id FROM table_reune WHERE user_id = _friend_id
    )
  );
  
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT 
    _friend_id,
    'friendship_invite_activated',
    'Convites de eventos ativados',
    'Seus convites pendentes foram ativados após aceitar a amizade',
    jsonb_build_object('friend_id', _user_id)
  WHERE EXISTS (
    SELECT 1 FROM event_invitations ei
    WHERE ei.participant_email IN (
      SELECT email FROM auth.users WHERE id = _friend_id
    )
    AND ei.status = 'accepted'
    AND ei.event_id IN (
      SELECT id FROM table_reune WHERE user_id = _user_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando uma amizade é criada
DROP TRIGGER IF EXISTS on_friendship_created ON public.friendships;

CREATE TRIGGER on_friendship_created
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pending_invites_on_friendship();

COMMENT ON FUNCTION public.update_pending_invites_on_friendship() IS 
'Atualiza automaticamente o status de convites pendentes para "accepted" quando uma nova amizade é criada. Também cria notificações para ambos os usuários sobre convites ativados.';