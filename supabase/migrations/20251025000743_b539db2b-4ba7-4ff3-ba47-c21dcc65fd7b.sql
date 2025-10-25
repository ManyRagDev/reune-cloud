-- Fix: Restrict public event access to authenticated users only
-- This prevents anonymous users from viewing home addresses and private event details

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Usuários podem ver eventos públicos ou próprios" ON public.table_reune;

-- Create new restrictive policy: require authentication to view any events
CREATE POLICY "Authenticated users can view public events or own events"
ON public.table_reune
FOR SELECT
TO authenticated
USING (
  is_public = true 
  OR user_id = auth.uid() 
  OR is_event_organizer(auth.uid(), id)
);

-- Additional policy: Allow unauthenticated users to view ONLY basic info via the safe function
-- This ensures they use get_public_events() which masks sensitive data
-- Direct table access is blocked for unauthenticated users