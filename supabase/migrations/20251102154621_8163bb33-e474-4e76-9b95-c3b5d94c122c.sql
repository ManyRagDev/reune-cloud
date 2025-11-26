-- Adicionar constraint único para evitar convites duplicados
-- Primeiro, remover duplicatas se houver
DELETE FROM event_invitations a USING (
  SELECT MIN(ctid) as ctid, event_id, participant_email
  FROM event_invitations 
  GROUP BY event_id, participant_email
  HAVING COUNT(*) > 1
) b
WHERE a.event_id = b.event_id 
  AND a.participant_email = b.participant_email 
  AND a.ctid <> b.ctid;

-- Adicionar constraint único
ALTER TABLE event_invitations 
ADD CONSTRAINT event_invitations_event_email_unique 
UNIQUE (event_id, participant_email);