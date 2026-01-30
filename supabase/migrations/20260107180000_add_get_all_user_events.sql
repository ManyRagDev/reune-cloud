-- Migration: Add get_all_user_events RPC function
-- Date: 2026-01-07
-- Description: Creates the function required by the List Events feature in ChatWidget.

CREATE OR REPLACE FUNCTION public.get_all_user_events(userid uuid)
RETURNS TABLE (
  id bigint,
  title text,
  tipo_evento text,
  event_date date,
  status text,
  qtd_pessoas integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.tipo_evento,
    e.event_date,
    e.status,
    e.qtd_pessoas
  FROM
    public.table_reune e
  WHERE
    e.user_id = userid
    AND e.status NOT IN ('finalizado', 'cancelled', 'deleted')
  ORDER BY
    e.updated_at DESC;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_all_user_events(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_events(uuid) TO service_role;
