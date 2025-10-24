-- Criar função para aceitar convite de evento
CREATE OR REPLACE FUNCTION public.accept_event_invitation(_invitation_token uuid, _user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _invitation_record RECORD;
  _event_record RECORD;
BEGIN
  -- Buscar convite pelo token
  SELECT * INTO _invitation_record
  FROM event_invitations
  WHERE invitation_token = _invitation_token
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou já utilizado';
  END IF;

  -- Buscar evento
  SELECT * INTO _event_record
  FROM table_reune
  WHERE id = _invitation_record.event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evento não encontrado';
  END IF;

  -- Se usuário está logado, vincular imediatamente
  IF _user_id IS NOT NULL THEN
    -- Verificar se email do usuário corresponde ao convite
    IF NOT EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = _user_id 
      AND email = _invitation_record.participant_email
    ) THEN
      RAISE EXCEPTION 'Email do usuário não corresponde ao convite';
    END IF;

    -- Atualizar status do convite
    UPDATE event_invitations
    SET status = 'accepted',
        responded_at = NOW()
    WHERE id = _invitation_record.id;

    -- Criar notificação para o usuário
    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _user_id,
      _event_record.id,
      'invitation_accepted',
      'Convite aceito: ' || _event_record.title,
      'Você aceitou o convite para ' || _event_record.title,
      jsonb_build_object(
        'event_id', _event_record.id,
        'invitation_id', _invitation_record.id
      )
    );
  ELSE
    -- Apenas marcar como aceito, aguardando cadastro
    UPDATE event_invitations
    SET status = 'accepted',
        responded_at = NOW()
    WHERE id = _invitation_record.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', _event_record.id,
    'event_title', _event_record.title,
    'requires_signup', _user_id IS NULL
  );
END;
$function$;

-- Atualizar trigger para vincular convites aceitos quando usuário se cadastrar
CREATE OR REPLACE FUNCTION public.link_pending_invitations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
  invitation_record RECORD;
BEGIN
  -- Buscar o email do novo usuário
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Processar convites aceitos que estavam aguardando cadastro
  FOR invitation_record IN 
    SELECT * FROM event_invitations
    WHERE participant_email = user_email
      AND status = 'accepted'
  LOOP
    -- Criar notificação sobre o evento
    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.id,
      invitation_record.event_id,
      'invitation_confirmed',
      'Bem-vindo ao evento!',
      'Seu convite foi confirmado. Veja os detalhes do evento.',
      jsonb_build_object(
        'event_id', invitation_record.event_id,
        'invitation_id', invitation_record.id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$function$;