-- Adicionar campo para controlar exibição do popup de perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hide_profile_prompt BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.profiles.hide_profile_prompt IS 'Indica se o usuário optou por não ver mais o popup de convite para completar o perfil';