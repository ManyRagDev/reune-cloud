-- Catalogo global de itens e tipos de evento

CREATE TABLE IF NOT EXISTS public.event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  categoria TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_type_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL UNIQUE,
  event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.table_reune
  ADD COLUMN IF NOT EXISTS event_type_id UUID REFERENCES public.event_types(id);

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  nome_normalizado TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'geral',
  source TEXT NOT NULL DEFAULT 'ai',
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_items_normalized
  ON public.catalog_items (nome_normalizado, categoria);

CREATE TABLE IF NOT EXISTS public.catalog_item_event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id UUID NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  event_type_id UUID NOT NULL REFERENCES public.event_types(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (catalog_item_id, event_type_id)
);

CREATE OR REPLACE FUNCTION public.normalize_catalog_name(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $function$
DECLARE
  normalized TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  normalized := lower(trim(input_text));
  normalized := regexp_replace(normalized, '\s+', ' ', 'g');
  RETURN normalized;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_event_type_id(label TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $function$
DECLARE
  normalized TEXT;
  slugified TEXT;
  existing_id UUID;
BEGIN
  IF label IS NULL OR trim(label) = '' THEN
    RETURN NULL;
  END IF;

  normalized := lower(trim(label));

  SELECT event_type_id INTO existing_id
  FROM public.event_type_aliases
  WHERE alias = normalized
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  SELECT id INTO existing_id
  FROM public.event_types
  WHERE slug = normalized
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  slugified := regexp_replace(normalized, '\s+', '-', 'g');
  slugified := regexp_replace(slugified, '[^a-z0-9\\-]', '', 'g');

  INSERT INTO public.event_types (slug, nome)
  VALUES (slugified, label)
  RETURNING id INTO existing_id;

  RETURN existing_id;
END;
$function$;

INSERT INTO public.event_types (slug, nome, categoria)
VALUES ('reveillon', 'Reveillon', 'celebracao')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.event_type_aliases (alias, event_type_id)
SELECT alias, et.id
FROM (VALUES ('ano novo'), ('ano-novo')) AS aliases(alias)
JOIN public.event_types et ON et.slug = 'reveillon'
ON CONFLICT (alias) DO NOTHING;

CREATE OR REPLACE FUNCTION public.items_replace_for_event(evento_id text, itens jsonb)
RETURNS SETOF jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item JSONB;
  result_row JSONB;
  event_row RECORD;
  event_type_ref UUID;
  catalog_item_id UUID;
  catalog_name TEXT;
  catalog_category TEXT;
  normalized_name TEXT;
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM table_reune WHERE id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_organizers WHERE event_id = evento_id::bigint AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM event_confirmations WHERE event_id = evento_id::bigint AND user_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Sem permissao para editar itens deste evento';
  END IF;

  SELECT id, finalidade_evento, tipo_evento
  INTO event_row
  FROM table_reune
  WHERE id = evento_id::bigint;

  event_type_ref := public.resolve_event_type_id(COALESCE(event_row.finalidade_evento, event_row.tipo_evento));

  IF event_type_ref IS NOT NULL THEN
    UPDATE table_reune
    SET event_type_id = event_type_ref
    WHERE id = event_row.id
      AND event_type_id IS NULL;
  END IF;

  DELETE FROM event_items WHERE event_id = evento_id::bigint;

  FOR item IN SELECT * FROM jsonb_array_elements(itens)
  LOOP
    INSERT INTO event_items (
      event_id, nome_item, quantidade, unidade, valor_estimado, categoria, prioridade
    ) VALUES (
      evento_id::bigint,
      item->>'nome_item',
      COALESCE((item->>'quantidade')::numeric, 1),
      COALESCE(item->>'unidade', 'un'),
      COALESCE((item->>'valor_estimado')::numeric, 0),
      COALESCE(item->>'categoria', 'geral'),
      COALESCE(item->>'prioridade', 'C')
    )
    RETURNING jsonb_build_object(
      'id', id,
      'event_id', event_id,
      'nome_item', nome_item,
      'quantidade', quantidade,
      'unidade', unidade,
      'valor_estimado', valor_estimado,
      'categoria', categoria,
      'prioridade', prioridade
    ) INTO result_row;

    catalog_name := COALESCE(item->>'nome_item', '');
    catalog_category := COALESCE(item->>'categoria', 'geral');
    normalized_name := public.normalize_catalog_name(catalog_name);

    IF normalized_name IS NOT NULL AND normalized_name <> '' THEN
      SELECT id INTO catalog_item_id
      FROM public.catalog_items
      WHERE nome_normalizado = normalized_name
        AND categoria = catalog_category
      LIMIT 1;

      IF catalog_item_id IS NULL THEN
        INSERT INTO public.catalog_items (
          nome, nome_normalizado, categoria, source, usage_count, last_used_at
        ) VALUES (
          catalog_name, normalized_name, catalog_category, 'ai', 1, now()
        )
        RETURNING id INTO catalog_item_id;
      ELSE
        UPDATE public.catalog_items
        SET nome = catalog_name,
            usage_count = usage_count + 1,
            last_used_at = now(),
            updated_at = now()
        WHERE id = catalog_item_id;
      END IF;

      IF event_type_ref IS NOT NULL THEN
        INSERT INTO public.catalog_item_event_types (
          catalog_item_id, event_type_id, usage_count, last_used_at
        ) VALUES (
          catalog_item_id, event_type_ref, 1, now()
        )
        ON CONFLICT (catalog_item_id, event_type_id)
        DO UPDATE SET
          usage_count = catalog_item_event_types.usage_count + 1,
          last_used_at = now();
      END IF;
    END IF;

    RETURN NEXT result_row;
  END LOOP;

  RETURN;
END;
$function$;
