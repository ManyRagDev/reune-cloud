-- Dropar triggers primeiro
DROP TRIGGER IF EXISTS update_table_reune_updated_at ON public.table_reune;
DROP TRIGGER IF EXISTS update_event_confirmations_updated_at ON public.event_confirmations;

-- Dropar e recriar função com search_path correto
DROP FUNCTION IF EXISTS public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- Recriar triggers
CREATE TRIGGER update_table_reune_updated_at
  BEFORE UPDATE ON public.table_reune
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_confirmations_updated_at
  BEFORE UPDATE ON public.event_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();