-- Migration: Marcar TODOS os usuários existentes como Founders
-- Todos os usuários que se cadastraram até agora são considerados membros fundadores
-- Data: 2025-12-07

-- Marcar TODOS os usuários existentes na tabela profiles como founders
UPDATE public.profiles
SET
  is_founder = true,
  founder_since = COALESCE(founder_since, created_at, NOW()),
  premium_until = COALESCE(premium_until, (COALESCE(created_at, NOW()) + INTERVAL '6 months')::DATE),
  storage_multiplier = 3
WHERE is_founder IS NULL OR is_founder = false;

-- Log do resultado
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM public.profiles
  WHERE is_founder = true;

  RAISE NOTICE 'Total de usuários marcados como founders: %', updated_count;
END $$;

-- Comentário
COMMENT ON TABLE public.profiles IS 'Tabela de perfis de usuários. Todos os usuários cadastrados até 07/12/2025 são membros fundadores.';
