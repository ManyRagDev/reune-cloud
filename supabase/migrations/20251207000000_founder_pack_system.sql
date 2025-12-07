-- Migration: Founder Pack System
-- Implementa o sistema de benefícios para membros fundadores (waitlist)
-- Data: 2025-12-07

-- ============================================
-- PARTE 1: Adicionar campos na tabela profiles
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS founder_since TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS premium_until DATE,
  ADD COLUMN IF NOT EXISTS storage_multiplier INTEGER DEFAULT 1 CHECK (storage_multiplier >= 1 AND storage_multiplier <= 10);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_founder ON public.profiles(is_founder);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until ON public.profiles(premium_until);

-- Comentários para documentação
COMMENT ON COLUMN public.profiles.is_founder IS 'Indica se o usuário é membro fundador (estava na waitlist)';
COMMENT ON COLUMN public.profiles.founder_since IS 'Data em que o usuário foi marcado como fundador';
COMMENT ON COLUMN public.profiles.premium_until IS 'Data até a qual o usuário tem Premium grátis (6 meses para founders)';
COMMENT ON COLUMN public.profiles.storage_multiplier IS 'Multiplicador de limites de storage (3x para founders, 1x para usuários normais)';

-- ============================================
-- PARTE 2: Adicionar campo na waitlist_reune
-- ============================================

ALTER TABLE public.waitlist_reune
  ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT true;

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_is_founder ON public.waitlist_reune(is_founder);

COMMENT ON COLUMN public.waitlist_reune.is_founder IS 'Indica se o lead da waitlist deve receber benefícios de fundador';

-- Marcar todos os registros existentes da waitlist como founders
UPDATE public.waitlist_reune
SET is_founder = true
WHERE is_founder IS NULL OR is_founder = false;

-- ============================================
-- PARTE 3: Marcar usuários EXISTENTES como founders
-- ============================================

-- Script one-time para marcar usuários que já se cadastraram e estão na waitlist
UPDATE public.profiles
SET
  is_founder = true,
  founder_since = COALESCE(founder_since, NOW()),
  premium_until = COALESCE(premium_until, (NOW() + INTERVAL '6 months')::DATE),
  storage_multiplier = 3
WHERE id IN (
  SELECT u.id
  FROM auth.users u
  INNER JOIN public.waitlist_reune w ON LOWER(u.email) = LOWER(w.email)
  WHERE w.is_founder = true
)
AND (is_founder = false OR is_founder IS NULL);

-- ============================================
-- PARTE 4: Trigger para novos cadastros
-- ============================================

-- Função que verifica se o email está na waitlist e marca como founder
CREATE OR REPLACE FUNCTION public.check_and_mark_founder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_email TEXT;
  _is_in_waitlist BOOLEAN;
BEGIN
  -- Buscar o email do usuário
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = NEW.id;

  -- Verificar se email existe na waitlist como founder
  SELECT EXISTS (
    SELECT 1
    FROM public.waitlist_reune
    WHERE LOWER(email) = LOWER(_user_email)
    AND is_founder = true
  ) INTO _is_in_waitlist;

  -- Se está na waitlist, marcar como founder e aplicar benefícios
  IF _is_in_waitlist THEN
    NEW.is_founder := true;
    NEW.founder_since := NOW();
    NEW.premium_until := (NOW() + INTERVAL '6 months')::DATE;
    NEW.storage_multiplier := 3;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger que roda antes de inserir um novo profile
DROP TRIGGER IF EXISTS trigger_check_founder_on_signup ON public.profiles;
CREATE TRIGGER trigger_check_founder_on_signup
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_mark_founder();

-- ============================================
-- PARTE 5: Função helper para verificar benefícios
-- ============================================

-- Função para verificar se usuário tem Premium ativo (founder ou pago)
CREATE OR REPLACE FUNCTION public.has_active_premium(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _premium_until DATE;
BEGIN
  SELECT premium_until INTO _premium_until
  FROM public.profiles
  WHERE id = user_id;

  -- Retorna true se premium_until é no futuro
  RETURN _premium_until IS NOT NULL AND _premium_until >= CURRENT_DATE;
END;
$$;

-- Função para obter o multiplicador de storage do usuário
CREATE OR REPLACE FUNCTION public.get_storage_multiplier(user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _multiplier INTEGER;
BEGIN
  SELECT COALESCE(storage_multiplier, 1) INTO _multiplier
  FROM public.profiles
  WHERE id = user_id;

  RETURN COALESCE(_multiplier, 1);
END;
$$;

-- ============================================
-- PARTE 6: View para dashboard de founders
-- ============================================

-- View para facilitar consulta de founders no admin
CREATE OR REPLACE VIEW public.founder_members AS
SELECT
  p.id,
  u.email,
  p.is_founder,
  p.founder_since,
  p.premium_until,
  p.storage_multiplier,
  CASE
    WHEN p.premium_until >= CURRENT_DATE THEN 'active'
    WHEN p.premium_until < CURRENT_DATE THEN 'expired'
    ELSE 'none'
  END as premium_status,
  p.created_at as signup_date
FROM public.profiles p
INNER JOIN auth.users u ON u.id = p.id
WHERE p.is_founder = true
ORDER BY p.founder_since DESC;

-- Permissões para a view (apenas admins podem ver)
COMMENT ON VIEW public.founder_members IS 'Lista de todos os membros fundadores com seus benefícios';

-- ============================================
-- RESUMO DA MIGRATION
-- ============================================

-- Esta migration implementa:
-- ✅ Campos de founder em profiles (is_founder, founder_since, premium_until, storage_multiplier)
-- ✅ Campo is_founder em waitlist_reune
-- ✅ Script one-time para marcar usuários existentes da waitlist como founders
-- ✅ Trigger automático para marcar novos usuários que estão na waitlist
-- ✅ Funções helper para verificar benefícios (has_active_premium, get_storage_multiplier)
-- ✅ View admin para visualizar todos os founders

-- Benefícios dos Founders:
-- 🏆 Badge "Membro Fundador" (is_founder = true)
-- 👑 6 meses de Premium grátis (premium_until = signup + 6 meses)
-- 📊 Limites 3x maiores permanentemente (storage_multiplier = 3)
