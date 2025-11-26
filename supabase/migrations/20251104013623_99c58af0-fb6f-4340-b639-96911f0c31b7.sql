
-- Permitir que convidados confirmados vejam participantes do evento
DROP POLICY IF EXISTS "Organizers can view participants with contacts" ON event_participants;

CREATE POLICY "Convidados confirmados podem ver participantes"
ON event_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = event_participants.event_id
    AND (
      -- Criador do evento
      table_reune.user_id = auth.uid()
      -- Organizador
      OR is_event_organizer(auth.uid(), event_participants.event_id)
      -- Convidado com convite aceito
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        WHERE ei.event_id = event_participants.event_id
        AND ei.participant_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
        AND ei.status = 'accepted'
      )
    )
  )
);

-- Permitir que convidados confirmados vejam itens do evento
DROP POLICY IF EXISTS "Usuários podem ver itens de eventos próprios ou públicos" ON event_items;

CREATE POLICY "Convidados confirmados podem ver itens"
ON event_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = event_items.event_id
    AND (
      -- Criador do evento
      table_reune.user_id = auth.uid()
      -- Evento público
      OR table_reune.is_public = true
      -- Convidado com convite aceito
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        WHERE ei.event_id = event_items.event_id
        AND ei.participant_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
        AND ei.status = 'accepted'
      )
    )
  )
);

-- Permitir que convidados confirmados criem e atualizem suas próprias atribuições
DROP POLICY IF EXISTS "Organizadores podem criar atribuições" ON item_assignments;
DROP POLICY IF EXISTS "Organizadores podem atualizar atribuições" ON item_assignments;

CREATE POLICY "Convidados confirmados podem criar atribuições"
ON item_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = item_assignments.event_id
    AND (
      -- Criador ou organizador
      table_reune.user_id = auth.uid()
      OR is_event_organizer(auth.uid(), item_assignments.event_id)
      -- Convidado confirmado (apenas para suas próprias atribuições)
      OR (
        EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = item_assignments.event_id
          AND ei.participant_email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
          AND ei.status = 'accepted'
        )
      )
    )
  )
);

CREATE POLICY "Convidados confirmados podem atualizar suas atribuições"
ON item_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = item_assignments.event_id
    AND (
      -- Criador ou organizador podem atualizar qualquer atribuição
      table_reune.user_id = auth.uid()
      OR is_event_organizer(auth.uid(), item_assignments.event_id)
      -- Convidado pode atualizar apenas suas próprias
      OR (
        EXISTS (
          SELECT 1 FROM event_invitations ei
          JOIN event_participants ep ON ep.event_id = ei.event_id 
            AND ei.participant_email IN (
              SELECT email FROM auth.users WHERE id = auth.uid()
            )
          WHERE ei.event_id = item_assignments.event_id
          AND ei.status = 'accepted'
          AND item_assignments.participant_id = ep.id
        )
      )
    )
  )
);

-- Permitir que convidados confirmados vejam as atribuições
DROP POLICY IF EXISTS "Ver atribuições de eventos acessíveis" ON item_assignments;

CREATE POLICY "Convidados confirmados podem ver atribuições"
ON item_assignments FOR SELECT
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
        AND ei.participant_email IN (
          SELECT email FROM auth.users WHERE id = auth.uid()
        )
        AND ei.status = 'accepted'
      )
    )
  )
);

-- Habilitar realtime para as tabelas relevantes
ALTER PUBLICATION supabase_realtime ADD TABLE event_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE event_items;
ALTER PUBLICATION supabase_realtime ADD TABLE item_assignments;
