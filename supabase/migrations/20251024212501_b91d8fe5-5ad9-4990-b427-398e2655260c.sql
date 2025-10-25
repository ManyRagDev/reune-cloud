-- Remover a view com security definer e criar função segura para acessar eventos públicos
DROP VIEW IF EXISTS public_events;

-- Criar função para obter eventos públicos sem expor user_id
CREATE OR REPLACE FUNCTION get_public_events()
RETURNS TABLE (
  id bigint,
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
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    title,
    description,
    event_date,
    event_time,
    location,
    is_public,
    status,
    max_attendees,
    tipo_evento,
    categoria_evento,
    subtipo_evento,
    finalidade_evento,
    menu,
    inclui_entradas,
    inclui_bebidas,
    qtd_pessoas,
    created_at,
    updated_at
  FROM table_reune
  WHERE is_public = true OR user_id = auth.uid();
$$;