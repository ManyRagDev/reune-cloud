-- Criar função security definer para obter email do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid();
$$;

-- Adicionar política para convidados verem suas próprias invitations
CREATE POLICY "Convidados podem ver seus próprios convites"
ON public.event_invitations
FOR SELECT
TO public
USING (
  participant_email = public.get_my_email()
);

-- Recriar política de SELECT para event_items usando a função
DROP POLICY IF EXISTS "Convidados confirmados podem ver itens" ON public.event_items;
CREATE POLICY "Convidados confirmados podem ver itens"
ON public.event_items
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = event_items.event_id
    AND (
      table_reune.user_id = auth.uid()
      OR table_reune.is_public = true
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        WHERE ei.event_id = event_items.event_id
        AND ei.participant_email = public.get_my_email()
        AND ei.status = 'accepted'
      )
    )
  )
);

-- Recriar política de SELECT para item_assignments usando a função
DROP POLICY IF EXISTS "Convidados confirmados podem ver atribuições" ON public.item_assignments;
CREATE POLICY "Convidados confirmados podem ver atribuições"
ON public.item_assignments
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = item_assignments.event_id
    AND (
      table_reune.user_id = auth.uid()
      OR table_reune.is_public = true
      OR is_event_organizer(auth.uid(), item_assignments.event_id)
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        WHERE ei.event_id = item_assignments.event_id
        AND ei.participant_email = public.get_my_email()
        AND ei.status = 'accepted'
      )
    )
  )
);

-- Recriar política de INSERT para item_assignments usando a função
DROP POLICY IF EXISTS "Convidados confirmados podem criar atribuições" ON public.item_assignments;
CREATE POLICY "Convidados confirmados podem criar atribuições"
ON public.item_assignments
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = item_assignments.event_id
    AND (
      table_reune.user_id = auth.uid()
      OR is_event_organizer(auth.uid(), item_assignments.event_id)
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        WHERE ei.event_id = item_assignments.event_id
        AND ei.participant_email = public.get_my_email()
        AND ei.status = 'accepted'
      )
    )
  )
);

-- Recriar política de UPDATE para item_assignments usando a função
DROP POLICY IF EXISTS "Convidados confirmados podem atualizar suas atribuições" ON public.item_assignments;
CREATE POLICY "Convidados confirmados podem atualizar suas atribuições"
ON public.item_assignments
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = item_assignments.event_id
    AND (
      table_reune.user_id = auth.uid()
      OR is_event_organizer(auth.uid(), item_assignments.event_id)
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        JOIN event_participants ep ON ep.event_id = ei.event_id 
          AND ei.participant_email = public.get_my_email()
        WHERE ei.event_id = item_assignments.event_id
        AND ei.status = 'accepted'
        AND item_assignments.participant_id = ep.id
      )
    )
  )
);