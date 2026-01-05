-- Migration to fix get_event_details_safe function not returning user_id
-- This allows the frontend to correctly identify the event creator

-- Drop the existing function first to allow changing the return type
-- IMPORTANT: This does NOT delete any data. It only removes the "reading logic" temporarily.
DROP FUNCTION IF EXISTS public.get_event_details_safe(bigint);

-- Recreate the function with the correct return type including user_id
CREATE OR REPLACE FUNCTION public.get_event_details_safe(_event_id bigint)
RETURNS TABLE(
  id bigint,
  user_id uuid, -- Added user_id field
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
    e.user_id, -- Added user_id selection
    e.title,
    e.description,
    e.event_date,
    e.event_time,
    CASE
      WHEN e.user_id = auth.uid() OR public.is_event_organizer(auth.uid(), _event_id) THEN e.location
      WHEN e.is_public = true THEN COALESCE(e.public_location, public.mask_location(e.location))
      ELSE e.location
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
    COALESCE(p.display_name, 'Organizador') as creator_display_name,
    p.avatar_url as creator_avatar_url
  FROM table_reune e
  LEFT JOIN profiles p ON e.user_id = p.id
  WHERE e.id = _event_id
  AND (e.is_public = true OR e.user_id = auth.uid() OR public.is_event_organizer(auth.uid(), _event_id));
END;
$$;
