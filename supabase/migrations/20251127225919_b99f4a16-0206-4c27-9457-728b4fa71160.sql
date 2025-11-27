-- Função para criar notificações do Amigo Secreto (bypass RLS)
CREATE OR REPLACE FUNCTION public.notify_secret_santa_draw(
  _event_id bigint,
  _secret_santa_id uuid,
  _participant_user_ids uuid[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, event_id, type, title, message, metadata)
  SELECT 
    unnest(_participant_user_ids),
    _event_id,
    'secret_santa_draw',
    'Sorteio do Amigo Secreto realizado! 🎁',
    'O sorteio foi feito! Entre no evento para descobrir quem você tirou.',
    jsonb_build_object('secret_santa_id', _secret_santa_id);
END;
$$;