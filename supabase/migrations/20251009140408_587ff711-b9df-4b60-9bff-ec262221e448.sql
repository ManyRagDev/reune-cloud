-- Adicionar novos campos hierárquicos ao evento
ALTER TABLE public.table_reune 
ADD COLUMN IF NOT EXISTS categoria_evento TEXT,
ADD COLUMN IF NOT EXISTS subtipo_evento TEXT,
ADD COLUMN IF NOT EXISTS finalidade_evento TEXT,
ADD COLUMN IF NOT EXISTS menu TEXT,
ADD COLUMN IF NOT EXISTS event_time TIME,
ADD COLUMN IF NOT EXISTS inclui_bebidas BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inclui_entradas BOOLEAN DEFAULT true;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.table_reune.categoria_evento IS 'Forma social do encontro: almoço, jantar, lanche, piquenique';
COMMENT ON COLUMN public.table_reune.subtipo_evento IS 'Estilo culinário ou ritual: churrasco, feijoada, pizza, fondue';
COMMENT ON COLUMN public.table_reune.finalidade_evento IS 'Motivo ou contexto emocional: aniversário, encontro de amigos, confraternização';
COMMENT ON COLUMN public.table_reune.menu IS 'Prato principal ou conceito gastronômico';
COMMENT ON COLUMN public.table_reune.event_time IS 'Horário do evento';