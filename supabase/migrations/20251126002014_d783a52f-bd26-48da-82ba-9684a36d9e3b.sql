-- Atualizar políticas RLS para event_items
-- Permitir que convidados confirmados possam editar itens

-- 1. Drop das políticas antigas de UPDATE, DELETE e INSERT
DROP POLICY IF EXISTS "Usuários podem atualizar itens de eventos próprios" ON event_items;
DROP POLICY IF EXISTS "Usuários podem deletar itens de eventos próprios" ON event_items;
DROP POLICY IF EXISTS "Usuários podem inserir itens em eventos próprios" ON event_items;

-- 2. Criar novas políticas que incluem convidados confirmados

-- INSERT: Organizadores e convidados confirmados podem adicionar itens
CREATE POLICY "Organizadores e convidados podem inserir itens"
ON event_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM table_reune
    WHERE table_reune.id = event_items.event_id
    AND (
      table_reune.user_id = auth.uid()
      OR is_event_organizer(auth.uid(), event_items.event_id)
      OR EXISTS (
        SELECT 1 FROM event_invitations ei
        WHERE ei.event_id = event_items.event_id
        AND ei.participant_email = get_my_email()
        AND ei.status = 'accepted'
      )
    )
  )
);

-- UPDATE: Organizadores e convidados confirmados podem atualizar itens
CREATE POLICY "Organizadores e convidados podem atualizar itens"
ON event_items
FOR UPDATE
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
        AND ei.participant_email = get_my_email()
        AND ei.status = 'accepted'
      )
    )
  )
);

-- DELETE: Organizadores e convidados confirmados podem deletar itens
CREATE POLICY "Organizadores e convidados podem deletar itens"
ON event_items
FOR DELETE
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
        AND ei.participant_email = get_my_email()
        AND ei.status = 'accepted'
      )
    )
  )
);