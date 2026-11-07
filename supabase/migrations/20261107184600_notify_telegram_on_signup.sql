-- Habilitar pg_net para chamadas HTTP assíncronas
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Função que chama a Edge Function notify-telegram-signup
CREATE OR REPLACE FUNCTION public.trigger_notify_telegram_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://tjihfzitkehyaiznpjnc.supabase.co/functions/v1/notify-telegram-signup',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'profiles',
      'schema', 'public',
      'record', jsonb_build_object(
        'id', NEW.id,
        'created_at', NEW.created_at
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fallback de segurança: falhas no webhook nunca bloqueiam o cadastro de usuários
  RAISE WARNING 'Falha ao despachar notificação para o Telegram: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Trigger disparado após a criação do perfil
DROP TRIGGER IF EXISTS on_profile_created_telegram_notify ON public.profiles;
CREATE TRIGGER on_profile_created_telegram_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_notify_telegram_signup();
