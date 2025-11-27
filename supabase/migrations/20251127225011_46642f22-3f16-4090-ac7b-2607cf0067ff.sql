-- Permitir que organizadores possam deletar participantes do Amigo Secreto
CREATE POLICY "Organizadores podem remover participantes"
ON public.event_secret_santa_participants
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM event_secret_santa ess
    JOIN table_reune tr ON tr.id = ess.event_id
    WHERE ess.id = event_secret_santa_participants.secret_santa_id
    AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
  )
);