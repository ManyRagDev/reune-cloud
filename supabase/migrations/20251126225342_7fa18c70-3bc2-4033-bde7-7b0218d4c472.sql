-- Atualizar função de trigger com search_path (usar CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION update_secret_santa_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;