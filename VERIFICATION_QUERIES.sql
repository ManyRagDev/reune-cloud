-- ============================================
-- QUERIES DE VERIFICAÇÃO - Execute no Lovable SQL Editor
-- ============================================

-- 1. Verificar se TODOS os auth.users têm profiles
-- Deve retornar 0 (zero) se tudo estiver correto
SELECT COUNT(*) as usuarios_sem_profile
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 2. Verificar quantos usuários são founders
SELECT
  COUNT(*) FILTER (WHERE is_founder = true) as total_founders,
  COUNT(*) FILTER (WHERE is_founder = false OR is_founder IS NULL) as total_nao_founders,
  COUNT(*) as total_usuarios
FROM public.profiles;

-- 3. Verificar se o trigger foi criado
SELECT
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname IN ('on_auth_user_created', 'trigger_check_founder_on_signup');

-- 4. Verificar se a função handle_new_user existe
SELECT
  proname as function_name,
  prosrc as function_code_preview
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 5. Listar todos os usuários com status de founder
SELECT
  p.id,
  COALESCE(u.email, 'Email não encontrado') as email,
  p.is_founder,
  p.founder_since,
  p.premium_until,
  p.storage_multiplier,
  p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 20;

-- 6. Verificar total de auth.users vs profiles
SELECT
  (SELECT COUNT(*) FROM auth.users) as total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.profiles) as diferenca;

-- 7. Verificar email logs (últimos 10)
SELECT
  el.id,
  el.lead_email,
  el.template_name,
  el.status,
  el.sent_at,
  el.metadata->>'recipient_type' as recipient_type
FROM public.email_logs el
ORDER BY el.sent_at DESC
LIMIT 10;

-- ============================================
-- RESULTADOS ESPERADOS:
-- ============================================
-- Query 1: Deve retornar 0 (todos os users têm profile)
-- Query 2: Todos os usuários devem ser founders (is_founder = true)
-- Query 3: Deve mostrar os triggers criados
-- Query 4: Deve mostrar a função handle_new_user
-- Query 5: Todos devem ter is_founder = true, premium_until e storage_multiplier = 3
-- Query 6: diferenca deve ser 0 (mesmo número de auth.users e profiles)
-- Query 7: Deve mostrar os logs de emails enviados
