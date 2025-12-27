-- Phase 1: consent, privacy, and UI/backend alignment

-- 1) Disable auto-accept of event invitations on friendship creation
DROP TRIGGER IF EXISTS on_friendship_created ON public.friendships;

CREATE OR REPLACE FUNCTION public.update_pending_invites_on_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- No side effects: invitations are never auto-accepted.
  RETURN NEW;
END;
$$;

-- 2) Allow invite by user_id (email resolved server-side)
DROP FUNCTION IF EXISTS public.process_invitation(bigint, text, text, boolean);
CREATE OR REPLACE FUNCTION public.process_invitation(
  _event_id bigint,
  _invitee_email text,
  _invitee_name text,
  _is_organizer boolean DEFAULT false,
  _invitee_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _inviter_id uuid := auth.uid();
  _existing_user_id uuid;
  _event_record record;
  _invitation_id uuid;
  _invitation_token uuid;
  _resolved_email text;
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE id = _event_id AND user_id = _inviter_id
    ) OR is_event_organizer(_inviter_id, _event_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissao para convidar pessoas';
  END IF;

  SELECT * INTO _event_record
  FROM table_reune
  WHERE id = _event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evento nao encontrado';
  END IF;

  IF _invitee_user_id IS NOT NULL THEN
    SELECT email INTO _resolved_email
    FROM auth.users
    WHERE id = _invitee_user_id
    LIMIT 1;

    IF _resolved_email IS NULL THEN
      RAISE EXCEPTION 'Usuario nao encontrado';
    END IF;

    _existing_user_id := _invitee_user_id;
  ELSE
    _resolved_email := NULLIF(TRIM(_invitee_email), '');
    IF _resolved_email IS NULL THEN
      RAISE EXCEPTION 'Email do convidado e obrigatorio';
    END IF;

    SELECT id INTO _existing_user_id
    FROM auth.users
    WHERE LOWER(email) = LOWER(_resolved_email)
    LIMIT 1;
  END IF;

  _invitation_token := gen_random_uuid();

  INSERT INTO event_invitations (
    event_id,
    participant_email,
    participant_name,
    invitation_token,
    status
  ) VALUES (
    _event_id,
    _resolved_email,
    _invitee_name,
    _invitation_token,
    'pending'
  )
  ON CONFLICT (event_id, participant_email)
  DO UPDATE SET
    participant_name = EXCLUDED.participant_name,
    invitation_token = EXCLUDED.invitation_token,
    status = 'pending',
    created_at = NOW()
  RETURNING id INTO _invitation_id;

  IF _existing_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _existing_user_id,
      _event_id,
      CASE WHEN _is_organizer THEN 'organizer_invite' ELSE 'event_invite' END,
      'Novo Convite: ' || _event_record.title,
      'Voce foi convidado(a) como ' ||
      CASE WHEN _is_organizer THEN 'organizador(a)' ELSE 'participante' END ||
      ' do evento ' || _event_record.title,
      jsonb_build_object(
        'invitation_id', _invitation_id,
        'is_organizer', _is_organizer,
        'event_date', _event_record.event_date,
        'event_time', _event_record.event_time
      )
    )
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
      'user_exists', true,
      'message', 'Convite enviado via notificacao in-app',
      'invitation_id', _invitation_id
    );
  ELSE
    RETURN jsonb_build_object(
      'user_exists', false,
      'message', 'Email precisa ser enviado',
      'invitation_id', _invitation_id,
      'invitation_token', _invitation_token,
      'event_data', jsonb_build_object(
        'title', _event_record.title,
        'date', _event_record.event_date,
        'time', _event_record.event_time
      )
    );
  END IF;
END;
$$;

-- 3) Avoid exposing email on user search
CREATE OR REPLACE FUNCTION public.search_user_by_identifier(_identifier text)
RETURNS TABLE(id uuid, display_name text, username text, avatar_url text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _normalized_identifier text;
BEGIN
  _normalized_identifier := LOWER(TRIM(_identifier));
  _normalized_identifier := REGEXP_REPLACE(_normalized_identifier, '^@', '');

  IF _normalized_identifier ~ '@' THEN
    RETURN QUERY
    SELECT
      u.id,
      p.display_name,
      p.username,
      p.avatar_url,
      NULL::text as email
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE LOWER(u.email) = _normalized_identifier
    LIMIT 1;
  ELSE
    RETURN QUERY
    SELECT
      p.id,
      p.display_name,
      p.username,
      p.avatar_url,
      NULL::text as email
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.username) = _normalized_identifier
    LIMIT 1;
  END IF;
END;
$$;

-- 4) Remove email from friends list output
DROP FUNCTION IF EXISTS public.get_friends(text);
CREATE OR REPLACE FUNCTION public.get_friends(_search text DEFAULT NULL)
RETURNS TABLE(
  friend_id uuid,
  display_name text,
  username text,
  avatar_url text
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
    RAISE EXCEPTION 'Usuario nao autenticado';
  END IF;

  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id_1 = _user_id THEN f.user_id_2
      ELSE f.user_id_1
    END as friend_id,
    COALESCE(p.display_name, p.username, 'Usuario') as display_name,
    p.username,
    p.avatar_url
  FROM friendships f
  JOIN auth.users u ON u.id = (
    CASE
      WHEN f.user_id_1 = _user_id THEN f.user_id_2
      ELSE f.user_id_1
    END
  )
  LEFT JOIN profiles p ON p.id = u.id
  WHERE (f.user_id_1 = _user_id OR f.user_id_2 = _user_id)
  AND (_search IS NULL OR COALESCE(p.display_name, p.username, '') ILIKE '%' || _search || '%')
  ORDER BY COALESCE(p.display_name, p.username, '');
END;
$$;

-- 5) Restrict event_items visibility to owner/organizer/accepted invite
DROP POLICY IF EXISTS "Convidados confirmados podem ver itens" ON public.event_items;
CREATE POLICY "Convidados confirmados podem ver itens"
  ON public.event_items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_items.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_items.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_items.event_id
          AND ei.participant_email = public.get_my_email()
          AND ei.status = 'accepted'
        )
      )
    )
  );

-- 6) Tighten event_confirmations access
DROP POLICY IF EXISTS "Usuarios podem ver confirmacoes de eventos publicos ou seus proprios" ON public.event_confirmations;
DROP POLICY IF EXISTS "Usuários podem ver confirmações de eventos públicos ou seus próprios" ON public.event_confirmations;
CREATE POLICY "Usuarios podem ver confirmacoes de eventos proprios ou organizados"
  ON public.event_confirmations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_confirmations.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_confirmations.event_id)
      )
    )
  );

DROP POLICY IF EXISTS "Usuarios podem criar suas proprias confirmacoes" ON public.event_confirmations;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias confirmações" ON public.event_confirmations;
CREATE POLICY "Usuarios podem criar suas proprias confirmacoes"
  ON public.event_confirmations FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_confirmations.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_confirmations.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_confirmations.event_id
          AND ei.participant_email = public.get_my_email()
          AND ei.status IN ('pending', 'accepted')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Usuarios podem atualizar suas proprias confirmacoes" ON public.event_confirmations;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias confirmações" ON public.event_confirmations;
CREATE POLICY "Usuarios podem atualizar suas proprias confirmacoes"
  ON public.event_confirmations FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_confirmations.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_confirmations.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_confirmations.event_id
          AND ei.participant_email = public.get_my_email()
          AND ei.status IN ('pending', 'accepted')
        )
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Usuarios podem deletar suas proprias confirmacoes" ON public.event_confirmations;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias confirmações" ON public.event_confirmations;
CREATE POLICY "Usuarios podem deletar suas proprias confirmacoes"
  ON public.event_confirmations FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_confirmations.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_confirmations.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_confirmations.event_id
          AND ei.participant_email = public.get_my_email()
          AND ei.status IN ('pending', 'accepted')
        )
      )
    )
  );

-- 7) Allow organizers to read invitations (email protected by RLS)
DROP POLICY IF EXISTS "Apenas criador do evento pode ver convites com emails" ON public.event_invitations;
CREATE POLICY "Criadores e organizadores podem ver convites com emails"
  ON public.event_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_invitations.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_invitations.event_id)
      )
    )
  );

-- 8) Accept invitation when presence is explicitly confirmed
CREATE OR REPLACE FUNCTION public.accept_event_invitation_on_presence_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_email text;
BEGIN
  IF NEW.presence_confirmed IS TRUE AND (
    TG_OP = 'INSERT' OR (OLD.presence_confirmed IS DISTINCT FROM NEW.presence_confirmed)
  ) THEN
    SELECT email INTO _user_email
    FROM auth.users
    WHERE id = NEW.user_id;

    IF _user_email IS NOT NULL THEN
      UPDATE event_invitations
      SET status = 'accepted',
          responded_at = NOW()
      WHERE event_id = NEW.event_id
        AND participant_email = _user_email
        AND status = 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_presence_confirmed ON public.event_confirmations;
CREATE TRIGGER on_presence_confirmed
  AFTER INSERT OR UPDATE ON public.event_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.accept_event_invitation_on_presence_confirmed();

-- 9) Allow invited users to view event details safely (masked location)
CREATE OR REPLACE FUNCTION public.get_event_details_safe(_event_id bigint)
RETURNS TABLE(
  id bigint,
  user_id uuid,
  title text,
  description text,
  event_date date,
  event_time text,
  location text,
  is_public boolean,
  status text,
  max_attendees integer,
  tipo_evento text,
  categoria_evento text,
  subtipo_evento text,
  finalidade_evento text,
  menu text,
  inclui_entradas boolean,
  inclui_bebidas boolean,
  qtd_pessoas integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  creator_display_name text,
  creator_avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.user_id,
    e.title,
    e.description,
    e.event_date,
    e.event_time,
    CASE
      WHEN e.user_id = auth.uid()
        OR public.is_event_organizer(auth.uid(), _event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = e.id
            AND ei.participant_email = public.get_my_email()
            AND ei.status = 'accepted'
        )
      THEN e.location
      WHEN e.is_public = true
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = e.id
            AND ei.participant_email = public.get_my_email()
            AND ei.status = 'pending'
        )
      THEN COALESCE(e.public_location, public.mask_location(e.location))
      ELSE COALESCE(e.public_location, public.mask_location(e.location))
    END as location,
    e.is_public,
    e.status,
    e.max_attendees,
    e.tipo_evento,
    e.categoria_evento,
    e.subtipo_evento,
    e.finalidade_evento,
    e.menu,
    e.inclui_entradas,
    e.inclui_bebidas,
    e.qtd_pessoas,
    e.created_at,
    e.updated_at,
    p.display_name as creator_display_name,
    p.avatar_url as creator_avatar_url
  FROM table_reune e
  LEFT JOIN profiles p ON p.id = e.user_id
  WHERE e.id = _event_id
    AND (
      e.is_public = true
      OR e.user_id = auth.uid()
      OR public.is_event_organizer(auth.uid(), _event_id)
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        WHERE ei.event_id = e.id
          AND ei.participant_email = public.get_my_email()
          AND ei.status IN ('pending', 'accepted')
      )
    );
END;
$$;
