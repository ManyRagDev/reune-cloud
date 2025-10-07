-- UNE.Ai domain collections for Lovable Cloud (Supabase/Postgres)
-- Using UUID primary keys and server-managed timestamps

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela: eventos
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  nome_evento TEXT NOT NULL,
  tipo_evento TEXT NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL,
  qtd_pessoas INTEGER NOT NULL,
  orcamento_total NUMERIC NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices mínimos para eventos
CREATE INDEX IF NOT EXISTS idx_eventos_usuario_id ON public.eventos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON public.eventos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_data_evento ON public.eventos(data_evento);

-- Trigger para updated_at
CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: itens_evento
CREATE TABLE IF NOT EXISTS public.itens_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nome_item TEXT NOT NULL,
  quantidade NUMERIC NOT NULL,
  unidade TEXT NOT NULL,
  valor_estimado NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  prioridade TEXT NOT NULL CHECK (prioridade IN ('A','B','C')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para itens_evento
CREATE INDEX IF NOT EXISTS idx_itens_evento_evento_id ON public.itens_evento(evento_id);

CREATE TRIGGER update_itens_evento_updated_at
  BEFORE UPDATE ON public.itens_evento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: participantes_evento
CREATE TABLE IF NOT EXISTS public.participantes_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nome_participante TEXT NOT NULL,
  contato TEXT NULL,
  status_convite TEXT NOT NULL CHECK (status_convite IN ('pendente','confirmado','recusado')),
  preferencias JSONB NULL,
  valor_responsavel NUMERIC NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para participantes_evento
CREATE INDEX IF NOT EXISTS idx_participantes_evento_evento_id ON public.participantes_evento(evento_id);

CREATE TRIGGER update_participantes_evento_updated_at
  BEFORE UPDATE ON public.participantes_evento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: distribuicao_itens
CREATE TABLE IF NOT EXISTS public.distribuicao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.itens_evento(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.participantes_evento(id) ON DELETE CASCADE,
  quantidade_atribuida NUMERIC NOT NULL,
  valor_rateado NUMERIC NOT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(item_id, participante_id)
);

-- Índices para distribuicao_itens
CREATE INDEX IF NOT EXISTS idx_distribuicao_itens_item_id ON public.distribuicao_itens(item_id);
CREATE INDEX IF NOT EXISTS idx_distribuicao_itens_participante_id ON public.distribuicao_itens(participante_id);

CREATE TRIGGER update_distribuicao_itens_updated_at
  BEFORE UPDATE ON public.distribuicao_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela: preferencias_usuario
CREATE TABLE IF NOT EXISTS public.preferencias_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  restricoes JSONB NULL,
  bebidas_favoritas JSONB NULL,
  carnes_favoritas JSONB NULL,
  budget_preferido NUMERIC NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para preferencias_usuario
CREATE INDEX IF NOT EXISTS idx_prefs_usuario_id ON public.preferencias_usuario(usuario_id);

CREATE TRIGGER update_preferencias_usuario_updated_at
  BEFORE UPDATE ON public.preferencias_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Opcional: constraints e checks adicionais podem ser adicionados conforme necessidades futuras