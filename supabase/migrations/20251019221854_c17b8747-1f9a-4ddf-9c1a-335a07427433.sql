-- Adicionar coluna para identificar origem da criação do evento
ALTER TABLE public.table_reune 
ADD COLUMN created_by_ai BOOLEAN DEFAULT false;

-- Comentário explicativo
COMMENT ON COLUMN public.table_reune.created_by_ai IS 'Indica se o evento foi criado pelo assistente de IA (true) ou manualmente pelo usuário (false)';