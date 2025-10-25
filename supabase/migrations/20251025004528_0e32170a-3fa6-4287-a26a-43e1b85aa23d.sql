-- Adicionar novos campos à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Brasil',
ADD COLUMN IF NOT EXISTS favorite_event_type TEXT,
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR',
ADD COLUMN IF NOT EXISTS allow_search_by_username BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS accept_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Adicionar constraint para username (apenas letras minúsculas e números)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'username_format'
  ) THEN
    ALTER TABLE public.profiles
    ADD CONSTRAINT username_format CHECK (username ~ '^[a-z0-9]{3,20}$');
  END IF;
END $$;

-- Criar índice para busca rápida por username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Criar função para verificar disponibilidade de username
CREATE OR REPLACE FUNCTION public.check_username_available(desired_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE username = lower(desired_username)
    AND id != auth.uid()
  );
END;
$$;

-- Criar função para calcular completude do perfil
CREATE OR REPLACE FUNCTION public.get_profile_completion()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_fields INTEGER := 10;
  filled_fields INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record
  FROM profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Contar campos preenchidos
  IF profile_record.display_name IS NOT NULL AND profile_record.display_name != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.username IS NOT NULL AND profile_record.username != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.city IS NOT NULL AND profile_record.city != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.state IS NOT NULL AND profile_record.state != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.country IS NOT NULL AND profile_record.country != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.favorite_event_type IS NOT NULL AND profile_record.favorite_event_type != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  IF profile_record.terms_accepted_at IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;

  RETURN (filled_fields * 100) / total_fields;
END;
$$;

-- Criar storage bucket para avatares se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Avatars são publicamente acessíveis" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de seus avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus avatares" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus avatares" ON storage.objects;

-- Criar políticas de storage para avatares
CREATE POLICY "Avatars são publicamente acessíveis"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de seus avatares"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem atualizar seus avatares"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar seus avatares"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);