-- Criar tabela de endereços de usuários
CREATE TABLE public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Policies: usuários só veem seus próprios endereços
CREATE POLICY "Usuários veem próprios endereços"
  ON public.user_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprios endereços"
  ON public.user_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprios endereços"
  ON public.user_addresses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprios endereços"
  ON public.user_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- Índice para consultas por usuário
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Índice para endereço principal
CREATE INDEX idx_user_addresses_primary ON public.user_addresses(user_id, is_primary) WHERE is_primary = true;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para garantir apenas um endereço principal por usuário
CREATE OR REPLACE FUNCTION public.ensure_single_primary_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o endereço está sendo marcado como principal
  IF NEW.is_primary = true THEN
    -- Desmarcar outros endereços principais do mesmo usuário
    UPDATE public.user_addresses
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para garantir apenas um endereço principal
CREATE TRIGGER ensure_single_primary_address_trigger
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_address();