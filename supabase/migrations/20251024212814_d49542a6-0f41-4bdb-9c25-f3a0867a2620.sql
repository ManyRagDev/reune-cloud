-- Adicionar campo para localização pública (mascarada) separada da localização completa
ALTER TABLE table_reune ADD COLUMN IF NOT EXISTS public_location text;

-- Criar função para mascarar localização residencial
CREATE OR REPLACE FUNCTION mask_location(full_location text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  masked_location text;
BEGIN
  -- Se contém padrões de endereço residencial, mascarar
  IF full_location ~* '(casa|residência|apt|apartamento|rua|avenida|av\.|r\.)' THEN
    -- Extrair apenas cidade/bairro se possível, ou retornar genérico
    IF full_location ~* '-\s*([^,]+)$' THEN
      masked_location := regexp_replace(full_location, '^.*-\s*([^,]+)$', 'Região: \1');
    ELSE
      masked_location := 'Local a confirmar com organizador';
    END IF;
  ELSE
    masked_location := full_location;
  END IF;
  
  RETURN masked_location;
END;
$$;

-- Atualizar função get_public_events para retornar localização mascarada
DROP FUNCTION IF EXISTS get_public_events();

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
    CASE 
      -- Se usuário é o criador, mostrar localização completa
      WHEN user_id = auth.uid() THEN location
      -- Se é evento público, mostrar localização mascarada
      WHEN is_public = true THEN COALESCE(public_location, mask_location(location))
      -- Se não é público mas tem acesso (organizador), mostrar completa
      ELSE location
    END as location,
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

-- Atualizar também a função get_event_details_safe para mascarar localização
DROP FUNCTION IF EXISTS get_event_details_safe(bigint);

CREATE OR REPLACE FUNCTION get_event_details_safe(_event_id bigint)
RETURNS TABLE(
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
    e.title,
    e.description,
    e.event_date,
    e.event_time,
    CASE 
      -- Se usuário é criador ou organizador, mostrar localização completa
      WHEN e.user_id = auth.uid() OR public.is_event_organizer(auth.uid(), _event_id) THEN e.location
      -- Se é evento público, mostrar localização mascarada
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