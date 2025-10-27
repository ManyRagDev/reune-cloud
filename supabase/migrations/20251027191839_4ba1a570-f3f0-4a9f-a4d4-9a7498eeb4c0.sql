-- Criar tabela para lista de espera do ReUNE
CREATE TABLE public.waitlist_reune (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.waitlist_reune ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (sem autenticação necessária)
CREATE POLICY "Qualquer pessoa pode se inscrever na lista de espera"
ON public.waitlist_reune
FOR INSERT
WITH CHECK (true);

-- Índice para email
CREATE INDEX idx_waitlist_reune_email ON public.waitlist_reune(email);

-- Índice para created_at
CREATE INDEX idx_waitlist_reune_created_at ON public.waitlist_reune(created_at DESC);