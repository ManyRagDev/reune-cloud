-- Migration: Garantir que todos os auth.users tenham um profile
-- E criar trigger para criar profiles automaticamente
-- Data: 2025-12-07

-- ============================================
-- PARTE 1: Criar profiles para usuários sem profile
-- ============================================

-- Função para criar profiles para todos os auth.users que não têm profile
CREATE OR REPLACE FUNCTION create_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  profiles_created INT := 0;
BEGIN
  -- Iterar sobre todos os usuários de auth.users
  FOR user_record IN
    SELECT id, email, created_at, raw_user_meta_data
    FROM auth.users
  LOOP
    -- Verificar se já existe profile para este usuário
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_record.id) THEN
      -- Criar profile
      INSERT INTO public.profiles (id, created_at)
      VALUES (user_record.id, user_record.created_at)
      ON CONFLICT (id) DO NOTHING;

      profiles_created := profiles_created + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Profiles criados: %', profiles_created;
END;
$$;

-- Executar a função para criar profiles faltantes
SELECT create_missing_profiles();

-- ============================================
-- PARTE 2: Trigger para criar profile automaticamente
-- ============================================

-- Função que cria profile quando um novo usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Trigger que roda APÓS inserir um novo usuário em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- PARTE 3: Marcar todos os profiles existentes como founders
-- ============================================

-- Atualizar todos os profiles para serem founders
UPDATE public.profiles
SET
  is_founder = true,
  founder_since = COALESCE(founder_since, created_at, NOW()),
  premium_until = COALESCE(premium_until, (COALESCE(created_at, NOW()) + INTERVAL '6 months')::DATE),
  storage_multiplier = 3
WHERE is_founder IS NULL OR is_founder = false;

-- Log
DO $$
DECLARE
  total_founders INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_founders
  FROM public.profiles
  WHERE is_founder = true;

  RAISE NOTICE '✅ Total de founders: %', total_founders;
END $$;

-- ============================================
-- RESUMO
-- ============================================

-- Esta migration:
-- ✅ Cria profiles para TODOS os auth.users que não têm profile
-- ✅ Cria trigger para criar profile automaticamente para novos usuários
-- ✅ Marca TODOS os profiles existentes como founders
