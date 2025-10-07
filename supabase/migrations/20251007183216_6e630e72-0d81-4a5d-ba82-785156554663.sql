-- Adicionar campos para armazenar informações do evento durante coleta
ALTER TABLE public.table_reune
ADD COLUMN IF NOT EXISTS tipo_evento TEXT,
ADD COLUMN IF NOT EXISTS qtd_pessoas INTEGER;

-- Criar índice para buscar drafts do usuário mais rapidamente
CREATE INDEX IF NOT EXISTS idx_table_reune_user_status ON public.table_reune(user_id, status, updated_at DESC);