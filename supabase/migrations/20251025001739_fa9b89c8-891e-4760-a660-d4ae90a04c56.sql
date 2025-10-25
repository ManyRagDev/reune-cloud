-- Fix participant contact access patterns
-- Ensure contacts are only visible to organizers via RLS

-- Drop existing policy that allowed non-organizers to see participants
DROP POLICY IF EXISTS "Ver participantes apenas de eventos com acesso" ON public.event_participants;

-- Create new policy: only organizers can see full participant details including contacts
CREATE POLICY "Organizers can view participants with contacts"
ON public.event_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.table_reune
    WHERE id = event_participants.event_id
    AND (user_id = auth.uid() OR is_event_organizer(auth.uid(), event_participants.event_id))
  )
);

-- Create additional policy: participants can see other participants but WITHOUT contact info
-- This is handled at the application layer by using get_event_participants_safe function
-- which masks the contato field for non-organizers