-- Adicionar colunas para armazenar info do participante no momento da adição
ALTER TABLE public.event_secret_santa_participants 
ADD COLUMN IF NOT EXISTS display_name text,
ADD COLUMN IF NOT EXISTS email text;