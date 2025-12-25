-- =============================================
-- SCHEMA COMPLETO - ReUNE Cloud
-- Consolidado de todas as migrations do Supabase
-- Gerado em: 2025-12-12
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- TYPES AND ENUMS
-- =============================================

-- (Nenhum tipo customizado definido nos arquivos)

-- =============================================
-- TABLES
-- =============================================

-- Tabela: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  phone TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  favorite_event_type TEXT,
  language TEXT DEFAULT 'pt-BR',
  allow_search_by_username BOOLEAN DEFAULT true,
  accept_notifications BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  bio TEXT,
  hide_profile_prompt BOOLEAN DEFAULT false,
  is_founder BOOLEAN DEFAULT false,
  founder_since TIMESTAMP WITH TIME ZONE,
  premium_until DATE,
  storage_multiplier INTEGER DEFAULT 1 CHECK (storage_multiplier >= 1 AND storage_multiplier <= 10),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-z0-9]{3,20}$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_is_founder ON public.profiles(is_founder);
CREATE INDEX IF NOT EXISTS idx_profiles_premium_until ON public.profiles(premium_until);

COMMENT ON TABLE public.profiles IS 'Tabela de perfis de usuários. Todos os usuários cadastrados até 07/12/2025 são membros fundadores.';
COMMENT ON COLUMN public.profiles.is_founder IS 'Indica se o usuário é membro fundador (estava na waitlist)';
COMMENT ON COLUMN public.profiles.founder_since IS 'Data em que o usuário foi marcado como fundador';
COMMENT ON COLUMN public.profiles.premium_until IS 'Data até a qual o usuário tem Premium grátis (6 meses para founders)';
COMMENT ON COLUMN public.profiles.storage_multiplier IS 'Multiplicador de limites de storage (3x para founders, 1x para usuários normais)';

-- Tabela: table_reune (eventos)
CREATE TABLE IF NOT EXISTS public.table_reune (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_time TEXT NOT NULL DEFAULT '12:00',
  location TEXT,
  public_location TEXT,
  max_attendees INTEGER,
  is_public BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  tipo_evento TEXT,
  qtd_pessoas INTEGER,
  categoria_evento TEXT,
  subtipo_evento TEXT,
  finalidade_evento TEXT,
  menu TEXT,
  inclui_bebidas BOOLEAN DEFAULT true,
  inclui_entradas BOOLEAN DEFAULT true,
  created_by_ai BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_table_reune_user_id ON public.table_reune(user_id);
CREATE INDEX IF NOT EXISTS idx_table_reune_event_date ON public.table_reune(event_date);
CREATE INDEX IF NOT EXISTS idx_table_reune_user_status ON public.table_reune(user_id, status, updated_at DESC);

COMMENT ON COLUMN public.table_reune.categoria_evento IS 'Forma social do encontro: almoço, jantar, lanche, piquenique';
COMMENT ON COLUMN public.table_reune.subtipo_evento IS 'Estilo culinário ou ritual: churrasco, feijoada, pizza, fondue';
COMMENT ON COLUMN public.table_reune.finalidade_evento IS 'Motivo ou contexto emocional: aniversário, encontro de amigos, confraternização';
COMMENT ON COLUMN public.table_reune.menu IS 'Prato principal ou conceito gastronômico';
COMMENT ON COLUMN public.table_reune.created_by_ai IS 'Indica se o evento foi criado pelo assistente de IA (true) ou manualmente pelo usuário (false)';

-- Tabela: event_organizers
CREATE TABLE IF NOT EXISTS public.event_organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT REFERENCES public.table_reune(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  added_by UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id ON public.event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_user_id ON public.event_organizers(user_id);

-- Tabela: event_confirmations
CREATE TABLE IF NOT EXISTS public.event_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date_confirmed BOOLEAN DEFAULT false,
  time_confirmed BOOLEAN DEFAULT false,
  location_confirmed BOOLEAN DEFAULT false,
  presence_confirmed BOOLEAN DEFAULT false,
  alternative_date DATE,
  alternative_time TIME WITHOUT TIME ZONE,
  alternative_location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_confirmations_event_id ON public.event_confirmations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_confirmations_user_id ON public.event_confirmations(user_id);

-- Tabela: event_items
CREATE TABLE IF NOT EXISTS public.event_items (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  nome_item TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'un',
  valor_estimado NUMERIC NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'geral',
  prioridade TEXT NOT NULL DEFAULT 'B' CHECK (prioridade IN ('A', 'B', 'C')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela: event_participants
CREATE TABLE IF NOT EXISTS public.event_participants (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  nome_participante TEXT NOT NULL,
  contato TEXT,
  status_convite TEXT NOT NULL DEFAULT 'pendente' CHECK (status_convite IN ('pendente', 'confirmado', 'recusado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, contato)
);

-- Tabela: event_invitations
CREATE TABLE IF NOT EXISTS public.event_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  participant_email TEXT NOT NULL,
  participant_name TEXT,
  invitation_token UUID DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT event_invitations_event_email_unique UNIQUE (event_id, participant_email)
);

-- Tabela: item_assignments
CREATE TABLE IF NOT EXISTS public.item_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  item_id BIGINT REFERENCES public.event_items(id) ON DELETE CASCADE,
  participant_id BIGINT REFERENCES public.event_participants(id) ON DELETE CASCADE,
  quantidade_atribuida NUMERIC NOT NULL,
  valor_rateado NUMERIC NOT NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id BIGINT REFERENCES public.table_reune(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'friend_request',
    'friend_accepted',
    'friend_request_accepted',
    'event_invite',
    'organizer_invite',
    'invitation_confirmed',
    'invitation_accepted',
    'suggestion_accepted',
    'suggestion_rejected',
    'friendship_invite_activated',
    'secret_santa_draw'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);

-- Tabela: friend_requests
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invitation_token UUID DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(sender_id, receiver_email)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver_email ON public.friend_requests(receiver_email);

-- Tabela: friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CHECK (user_id_1 < user_id_2),
  UNIQUE(user_id_1, user_id_2)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON public.friendships(user_id_1);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON public.friendships(user_id_2);

-- Tabela: user_addresses
CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Brasil',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_primary ON public.user_addresses(user_id, is_primary) WHERE is_primary = true;

-- Tabelas UNE.Ai domain

-- Tabela: eventos (UNE.Ai)
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  nome_evento TEXT NOT NULL,
  tipo_evento TEXT NOT NULL,
  data_evento TIMESTAMPTZ NOT NULL,
  qtd_pessoas INTEGER NOT NULL,
  orcamento_total NUMERIC NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_usuario_id ON public.eventos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON public.eventos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_data_evento ON public.eventos(data_evento);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itens_evento_evento_id ON public.itens_evento(evento_id);

-- Tabela: participantes_evento
CREATE TABLE IF NOT EXISTS public.participantes_evento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
  nome_participante TEXT NOT NULL,
  contato TEXT NULL,
  status_convite TEXT NOT NULL CHECK (status_convite IN ('pendente','confirmado','recusado')),
  preferencias JSONB NULL,
  valor_responsavel NUMERIC NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participantes_evento_evento_id ON public.participantes_evento(evento_id);

-- Tabela: distribuicao_itens
CREATE TABLE IF NOT EXISTS public.distribuicao_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.itens_evento(id) ON DELETE CASCADE,
  participante_id UUID NOT NULL REFERENCES public.participantes_evento(id) ON DELETE CASCADE,
  quantidade_atribuida NUMERIC NOT NULL,
  valor_rateado NUMERIC NOT NULL,
  observacoes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, participante_id)
);

CREATE INDEX IF NOT EXISTS idx_distribuicao_itens_item_id ON public.distribuicao_itens(item_id);
CREATE INDEX IF NOT EXISTS idx_distribuicao_itens_participante_id ON public.distribuicao_itens(participante_id);

-- Tabela: preferencias_usuario
CREATE TABLE IF NOT EXISTS public.preferencias_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  restricoes JSONB NULL,
  bebidas_favoritas JSONB NULL,
  carnes_favoritas JSONB NULL,
  budget_preferido NUMERIC NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prefs_usuario_id ON public.preferencias_usuario(usuario_id);

-- Tabelas de conversação

-- Tabela: conversation_messages
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id BIGINT REFERENCES public.table_reune(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_user ON public.conversation_messages(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_event ON public.conversation_messages(evento_id);

-- Tabela: conversation_contexts
CREATE TABLE IF NOT EXISTS public.conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'idle',
  evento_id BIGINT REFERENCES public.table_reune(id) ON DELETE SET NULL,
  collected_data JSONB DEFAULT '{}'::jsonb,
  missing_slots TEXT[] DEFAULT '{}',
  confidence_level NUMERIC(3,2) DEFAULT 0.5,
  last_intent TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user ON public.conversation_contexts(user_id);

-- Tabela: conversation_analytics
CREATE TABLE IF NOT EXISTS public.conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id BIGINT REFERENCES public.table_reune(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
  intent TEXT NOT NULL,
  confidence_level NUMERIC(3,2) NOT NULL,
  response_type TEXT,
  user_corrected BOOLEAN DEFAULT false,
  user_confused BOOLEAN DEFAULT false,
  clarification_needed BOOLEAN DEFAULT false,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_analytics_user ON public.conversation_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_intent ON public.conversation_analytics(intent);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_confidence ON public.conversation_analytics(confidence_level);
CREATE INDEX IF NOT EXISTS idx_conversation_analytics_evento ON public.conversation_analytics(evento_id);

-- Tabela: user_feedback
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id BIGINT REFERENCES public.table_reune(id) ON DELETE SET NULL,
  message_id UUID REFERENCES public.conversation_messages(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'report', 'suggestion')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_feedback_user ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_type ON public.user_feedback(feedback_type);

-- Tabela: waitlist_reune
CREATE TABLE IF NOT EXISTS public.waitlist_reune (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  origin TEXT DEFAULT 'unknown',
  welcome_email_sent BOOLEAN DEFAULT false,
  welcome_email_sent_at TIMESTAMP WITH TIME ZONE,
  is_founder BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_reune_email ON public.waitlist_reune(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_created_at ON public.waitlist_reune(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_name ON public.waitlist_reune(name);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_origin ON public.waitlist_reune(origin);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_welcome_sent ON public.waitlist_reune(welcome_email_sent);
CREATE INDEX IF NOT EXISTS idx_waitlist_reune_is_founder ON public.waitlist_reune(is_founder);

COMMENT ON COLUMN public.waitlist_reune.name IS 'Nome do lead (opcional, pode ser NULL para dados históricos)';
COMMENT ON COLUMN public.waitlist_reune.origin IS 'Origem do cadastro: landing, launch, amigosecreto, invite, etc';
COMMENT ON COLUMN public.waitlist_reune.welcome_email_sent IS 'Indica se o lead já recebeu e-mail de boas-vindas';
COMMENT ON COLUMN public.waitlist_reune.welcome_email_sent_at IS 'Data/hora do envio do e-mail de boas-vindas';
COMMENT ON COLUMN public.waitlist_reune.is_founder IS 'Indica se o lead da waitlist deve receber benefícios de fundador';

-- Tabela: email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON public.email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON public.email_templates(is_active);

COMMENT ON TABLE public.email_templates IS 'Templates de e-mail editáveis pelo admin';
COMMENT ON COLUMN public.email_templates.name IS 'Nome único do template (slug)';
COMMENT ON COLUMN public.email_templates.subject IS 'Assunto do e-mail';
COMMENT ON COLUMN public.email_templates.html_content IS 'HTML do template com suporte a variáveis {{nome}}, {{email}}, etc';
COMMENT ON COLUMN public.email_templates.variables IS 'Array JSON com nomes das variáveis disponíveis: ["nome", "email"]';

-- Tabela: email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.waitlist_reune(id) ON DELETE SET NULL,
  lead_email TEXT NOT NULL,
  template_name TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_lead_id ON public.email_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_lead_email ON public.email_logs(lead_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON public.email_logs(template_name);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

COMMENT ON TABLE public.email_logs IS 'Histórico completo de envios de e-mail do admin';
COMMENT ON COLUMN public.email_logs.lead_id IS 'ID do lead (nullable caso lead seja deletado)';
COMMENT ON COLUMN public.email_logs.lead_email IS 'Email do destinatário (guardado para referência mesmo se lead for deletado)';
COMMENT ON COLUMN public.email_logs.template_name IS 'Nome do template usado';
COMMENT ON COLUMN public.email_logs.sent_at IS 'Data/hora do envio';
COMMENT ON COLUMN public.email_logs.status IS 'Status: success, failed ou pending';
COMMENT ON COLUMN public.email_logs.error_message IS 'Mensagem de erro se status = failed';
COMMENT ON COLUMN public.email_logs.metadata IS 'Dados extras: resend_message_id, variables usadas, etc';

-- Tabela: admin_settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

COMMENT ON TABLE public.admin_settings IS 'Configurações do painel admin';
COMMENT ON COLUMN public.admin_settings.key IS 'Chave única da configuração';
COMMENT ON COLUMN public.admin_settings.value IS 'Valor em formato JSON';
COMMENT ON COLUMN public.admin_settings.description IS 'Descrição da configuração';

-- Tabela: bug_reports
CREATE TABLE IF NOT EXISTS public.bug_reports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'fixed', 'rejected')),
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS bug_reports_user_id_idx ON public.bug_reports(user_id);
CREATE INDEX IF NOT EXISTS bug_reports_status_idx ON public.bug_reports(status);
CREATE INDEX IF NOT EXISTS bug_reports_created_at_idx ON public.bug_reports(created_at DESC);

COMMENT ON TABLE public.bug_reports IS 'Stores user-reported bugs with bonus incentive system';

-- Tabelas de Amigo Secreto (Secret Santa)

-- Tabela: event_dynamics
CREATE TABLE IF NOT EXISTS public.event_dynamics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('secret_santa')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Tabela: event_secret_santa
CREATE TABLE IF NOT EXISTS public.event_secret_santa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL REFERENCES public.table_reune(id) ON DELETE CASCADE,
  min_value NUMERIC,
  max_value NUMERIC,
  draw_date TIMESTAMP WITH TIME ZONE,
  rules_json JSONB DEFAULT '{}'::jsonb,
  has_drawn BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(event_id)
);

-- Tabela: event_secret_santa_participants
CREATE TABLE IF NOT EXISTS public.event_secret_santa_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_santa_id UUID NOT NULL REFERENCES public.event_secret_santa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed')),
  wishlist_text TEXT,
  wishlist_link TEXT,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(secret_santa_id, user_id)
);

-- Tabela: event_secret_santa_pairs
CREATE TABLE IF NOT EXISTS public.event_secret_santa_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_santa_id UUID NOT NULL REFERENCES public.event_secret_santa(id) ON DELETE CASCADE,
  giver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(secret_santa_id, giver_id)
);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Função: update_updated_at_column
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

-- Função: mask_location
CREATE OR REPLACE FUNCTION public.mask_location(full_location text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  masked_location text;
BEGIN
  IF full_location ~* '(casa|residência|apt|apartamento|rua|avenida|av\.|r\.)' THEN
    IF full_location ~* '-\s*([^,]+)$' THEN
      masked_location := regexp_replace(full_location, '^.*-\s*([^,]+)$', 'Região: \1');
    ELSE
      masked_location := 'Local a confirmar com organizador';
    END IF;
  ELSE
    masked_location := full_location;
  END IF;

  RETURN masked_location;
END;
$$;

-- Função: is_event_organizer
CREATE OR REPLACE FUNCTION public.is_event_organizer(_user_id UUID, _event_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM event_organizers
    WHERE event_id = _event_id
    AND user_id = _user_id
  );
END;
$$;

-- Função: get_my_email
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT email::text
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$;

-- Função: check_username_available
CREATE OR REPLACE FUNCTION public.check_username_available(desired_username TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE username = lower(desired_username)
    AND id != auth.uid()
  );
END;
$$;

-- Função: get_profile_completion
CREATE OR REPLACE FUNCTION public.get_profile_completion()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_fields INTEGER := 10;
  filled_fields INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record
  FROM profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  IF profile_record.display_name IS NOT NULL AND profile_record.display_name != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.username IS NOT NULL AND profile_record.username != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.city IS NOT NULL AND profile_record.city != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.state IS NOT NULL AND profile_record.state != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.country IS NOT NULL AND profile_record.country != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.favorite_event_type IS NOT NULL AND profile_record.favorite_event_type != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    filled_fields := filled_fields + 1;
  END IF;

  IF profile_record.terms_accepted_at IS NOT NULL THEN
    filled_fields := filled_fields + 1;
  END IF;

  RETURN (filled_fields * 100) / total_fields;
END;
$$;

-- Função: ensure_single_primary_address
CREATE OR REPLACE FUNCTION public.ensure_single_primary_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.user_addresses
    SET is_primary = false
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;

  RETURN NEW;
END;
$$;

-- Função: link_pending_invitations
CREATE OR REPLACE FUNCTION public.link_pending_invitations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  invitation_record RECORD;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.id;

  FOR invitation_record IN
    SELECT * FROM event_invitations
    WHERE participant_email = user_email
      AND status = 'accepted'
  LOOP
    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      NEW.id,
      invitation_record.event_id,
      'invitation_confirmed',
      'Bem-vindo ao evento!',
      'Seu convite foi confirmado. Veja os detalhes do evento.',
      jsonb_build_object(
        'event_id', invitation_record.event_id,
        'invitation_id', invitation_record.id
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Função: accept_event_invitation
CREATE OR REPLACE FUNCTION public.accept_event_invitation(_invitation_token uuid, _user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _invitation_record RECORD;
  _event_record RECORD;
BEGIN
  SELECT * INTO _invitation_record
  FROM event_invitations
  WHERE invitation_token = _invitation_token
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou já utilizado';
  END IF;

  SELECT * INTO _event_record
  FROM table_reune
  WHERE id = _invitation_record.event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evento não encontrado';
  END IF;

  IF _user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = _user_id
      AND email = _invitation_record.participant_email
    ) THEN
      RAISE EXCEPTION 'Email do usuário não corresponde ao convite';
    END IF;

    UPDATE event_invitations
    SET status = 'accepted',
        responded_at = NOW()
    WHERE id = _invitation_record.id;

    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _user_id,
      _event_record.id,
      'invitation_accepted',
      'Convite aceito: ' || _event_record.title,
      'Você aceitou o convite para ' || _event_record.title,
      jsonb_build_object(
        'event_id', _event_record.id,
        'invitation_id', _invitation_record.id
      )
    );
  ELSE
    UPDATE event_invitations
    SET status = 'accepted',
        responded_at = NOW()
    WHERE id = _invitation_record.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', _event_record.id,
    'event_title', _event_record.title,
    'requires_signup', _user_id IS NULL
  );
END;
$$;

-- Função: process_invitation
CREATE OR REPLACE FUNCTION public.process_invitation(_event_id bigint, _invitee_email text, _invitee_name text, _is_organizer boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _inviter_id uuid := auth.uid();
  _existing_user_id uuid;
  _event_record record;
  _invitation_id uuid;
  _invitation_token uuid;
BEGIN
  IF NOT (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE id = _event_id AND user_id = _inviter_id
    ) OR is_event_organizer(_inviter_id, _event_id)
  ) THEN
    RAISE EXCEPTION 'Sem permissão para convidar pessoas';
  END IF;

  SELECT * INTO _event_record
  FROM table_reune
  WHERE id = _event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Evento não encontrado';
  END IF;

  SELECT id INTO _existing_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(_invitee_email)
  LIMIT 1;

  _invitation_token := gen_random_uuid();

  INSERT INTO event_invitations (
    event_id,
    participant_email,
    participant_name,
    invitation_token,
    status
  ) VALUES (
    _event_id,
    _invitee_email,
    _invitee_name,
    _invitation_token,
    'pending'
  )
  ON CONFLICT (event_id, participant_email)
  DO UPDATE SET
    participant_name = EXCLUDED.participant_name,
    invitation_token = EXCLUDED.invitation_token,
    status = 'pending',
    created_at = NOW()
  RETURNING id INTO _invitation_id;

  IF _existing_user_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      event_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _existing_user_id,
      _event_id,
      CASE WHEN _is_organizer THEN 'organizer_invite' ELSE 'event_invite' END,
      'Novo Convite: ' || _event_record.title,
      'Você foi convidado(a) como ' ||
      CASE WHEN _is_organizer THEN 'organizador(a)' ELSE 'participante' END ||
      ' do evento ' || _event_record.title,
      jsonb_build_object(
        'invitation_id', _invitation_id,
        'is_organizer', _is_organizer,
        'event_date', _event_record.event_date,
        'event_time', _event_record.event_time
      )
    )
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object(
      'user_exists', true,
      'message', 'Convite enviado via notificação in-app',
      'invitation_id', _invitation_id
    );
  ELSE
    RETURN jsonb_build_object(
      'user_exists', false,
      'message', 'Email precisa ser enviado',
      'invitation_id', _invitation_id,
      'invitation_token', _invitation_token,
      'event_data', jsonb_build_object(
        'title', _event_record.title,
        'date', _event_record.event_date,
        'time', _event_record.event_time
      )
    );
  END IF;
END;
$$;

-- Função: send_friend_request
CREATE OR REPLACE FUNCTION public.send_friend_request(_receiver_identifier text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _sender_id UUID := auth.uid();
  _receiver_id UUID;
  _receiver_email TEXT;
  _request_id UUID;
  _invitation_token UUID;
  _sender_name TEXT;
  _already_friends BOOLEAN;
  _pending_request BOOLEAN;
  _is_email BOOLEAN;
BEGIN
  _receiver_identifier := LOWER(TRIM(_receiver_identifier));

  _is_email := _receiver_identifier ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

  IF _is_email THEN
    _receiver_email := _receiver_identifier;

    SELECT id INTO _receiver_id
    FROM auth.users
    WHERE LOWER(email) = _receiver_email
    LIMIT 1;
  ELSE
    _receiver_identifier := REGEXP_REPLACE(_receiver_identifier, '^@', '');

    SELECT p.id, u.email INTO _receiver_id, _receiver_email
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.username) = _receiver_identifier
    LIMIT 1;

    IF _receiver_id IS NULL THEN
      RAISE EXCEPTION 'Usuário não encontrado';
    END IF;
  END IF;

  IF _receiver_id = _sender_id OR (_receiver_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = _sender_id AND LOWER(email) = _receiver_email
  )) THEN
    RAISE EXCEPTION 'Você não pode enviar solicitação de amizade para si mesmo';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id_1 = _sender_id AND user_id_2 = _receiver_id)
       OR (user_id_2 = _sender_id AND user_id_1 = _receiver_id)
  ) INTO _already_friends;

  IF _already_friends THEN
    RAISE EXCEPTION 'Vocês já são amigos';
  END IF;

  IF _receiver_email IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM friend_requests
      WHERE sender_id = _sender_id
      AND LOWER(receiver_email) = _receiver_email
      AND status = 'pending'
    ) INTO _pending_request;

    IF _pending_request THEN
      RAISE EXCEPTION 'Já existe uma solicitação pendente para este usuário';
    END IF;
  END IF;

  SELECT COALESCE(p.display_name, u.email) INTO _sender_name
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE u.id = _sender_id;

  INSERT INTO friend_requests (sender_id, receiver_id, receiver_email)
  VALUES (_sender_id, _receiver_id, _receiver_email)
  ON CONFLICT (sender_id, receiver_email)
  DO UPDATE SET created_at = NOW(), status = 'pending'
  RETURNING id, invitation_token INTO _request_id, _invitation_token;

  IF _receiver_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _receiver_id,
      'friend_request',
      'Nova solicitação de amizade',
      _sender_name || ' quer ser seu amigo',
      jsonb_build_object(
        'request_id', _request_id,
        'sender_id', _sender_id
      )
    );

    RETURN jsonb_build_object(
      'success', true,
      'user_exists', true,
      'request_id', _request_id
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'user_exists', false,
      'request_id', _request_id,
      'invitation_token', _invitation_token,
      'sender_name', _sender_name
    );
  END IF;
END;
$$;

-- Função: respond_to_friend_request
CREATE OR REPLACE FUNCTION public.respond_to_friend_request(_request_id uuid, _accept boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _receiver_id UUID := auth.uid();
  _sender_id UUID;
  _user_id_1 UUID;
  _user_id_2 UUID;
  _receiver_name TEXT;
  _request_status TEXT;
BEGIN
  SELECT sender_id, status INTO _sender_id, _request_status
  FROM friend_requests
  WHERE id = _request_id
    AND receiver_id = _receiver_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido não encontrado ou você não tem permissão';
  END IF;

  IF _request_status != 'pending' THEN
    RAISE EXCEPTION 'Este pedido já foi respondido anteriormente';
  END IF;

  UPDATE friend_requests
  SET status = CASE WHEN _accept THEN 'accepted' ELSE 'rejected' END,
      responded_at = NOW()
  WHERE id = _request_id;

  IF _accept THEN
    IF _sender_id < _receiver_id THEN
      _user_id_1 := _sender_id;
      _user_id_2 := _receiver_id;
    ELSE
      _user_id_1 := _receiver_id;
      _user_id_2 := _sender_id;
    END IF;

    INSERT INTO friendships (user_id_1, user_id_2)
    VALUES (_user_id_1, _user_id_2)
    ON CONFLICT (user_id_1, user_id_2) DO NOTHING;

    SELECT COALESCE(p.display_name, u.email) INTO _receiver_name
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = _receiver_id;

    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata
    ) VALUES (
      _sender_id,
      'friend_accepted',
      'Pedido de amizade aceito',
      _receiver_name || ' aceitou seu pedido de amizade',
      jsonb_build_object(
        'friend_id', _receiver_id,
        'request_id', _request_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'accepted', _accept,
    'friendship_created', _accept
  );
END;
$$;

-- Função: get_friends
CREATE OR REPLACE FUNCTION public.get_friends(_search text DEFAULT NULL)
RETURNS TABLE(
  friend_id uuid,
  display_name text,
  avatar_url text,
  email text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  RETURN QUERY
  SELECT
    CASE
      WHEN f.user_id_1 = _user_id THEN f.user_id_2
      ELSE f.user_id_1
    END as friend_id,
    COALESCE(p.display_name, u.email::text) as display_name,
    p.avatar_url,
    u.email::text as email
  FROM friendships f
  JOIN auth.users u ON u.id = (
    CASE
      WHEN f.user_id_1 = _user_id THEN f.user_id_2
      ELSE f.user_id_1
    END
  )
  LEFT JOIN profiles p ON p.id = u.id
  WHERE (f.user_id_1 = _user_id OR f.user_id_2 = _user_id)
  AND (_search IS NULL OR COALESCE(p.display_name, u.email::text) ILIKE '%' || _search || '%')
  ORDER BY COALESCE(p.display_name, u.email::text);
END;
$$;

-- Função: get_pending_friend_requests
CREATE OR REPLACE FUNCTION public.get_pending_friend_requests()
RETURNS TABLE(
  request_id UUID,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fr.id as request_id,
    fr.sender_id,
    COALESCE(p.display_name, u.email) as sender_name,
    p.avatar_url as sender_avatar,
    fr.created_at
  FROM friend_requests fr
  JOIN auth.users u ON u.id = fr.sender_id
  LEFT JOIN profiles p ON p.id = fr.sender_id
  WHERE fr.receiver_id = auth.uid()
    AND fr.status = 'pending'
  ORDER BY fr.created_at DESC;
END;
$$;

-- Função: update_pending_invites_on_friendship
CREATE OR REPLACE FUNCTION public.update_pending_invites_on_friendship()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _friend_id UUID;
  _user_id UUID;
BEGIN
  _friend_id := NEW.user_id_1;
  _user_id := NEW.user_id_2;

  UPDATE event_invitations ei
  SET status = 'accepted'
  WHERE ei.participant_email IN (
    SELECT email FROM auth.users WHERE id = _user_id
  )
  AND ei.status = 'pending'
  AND ei.event_id IN (
    SELECT id FROM table_reune WHERE user_id = _friend_id
  );

  UPDATE event_invitations ei
  SET status = 'accepted'
  WHERE ei.participant_email IN (
    SELECT email FROM auth.users WHERE id = _friend_id
  )
  AND ei.status = 'pending'
  AND ei.event_id IN (
    SELECT id FROM table_reune WHERE user_id = _user_id
  );

  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT
    _user_id,
    'friendship_invite_activated',
    'Convites de eventos ativados',
    'Seus convites pendentes foram ativados após aceitar a amizade',
    jsonb_build_object('friend_id', _friend_id)
  WHERE EXISTS (
    SELECT 1 FROM event_invitations ei
    WHERE ei.participant_email IN (
      SELECT email FROM auth.users WHERE id = _user_id
    )
    AND ei.status = 'accepted'
    AND ei.event_id IN (
      SELECT id FROM table_reune WHERE user_id = _friend_id
    )
  );

  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT
    _friend_id,
    'friendship_invite_activated',
    'Convites de eventos ativados',
    'Seus convites pendentes foram ativados após aceitar a amizade',
    jsonb_build_object('friend_id', _user_id)
  WHERE EXISTS (
    SELECT 1 FROM event_invitations ei
    WHERE ei.participant_email IN (
      SELECT email FROM auth.users WHERE id = _friend_id
    )
    AND ei.status = 'accepted'
    AND ei.event_id IN (
      SELECT id FROM table_reune WHERE user_id = _user_id
    )
  );

  RETURN NEW;
END;
$$;

-- Função: search_user_by_identifier
CREATE OR REPLACE FUNCTION public.search_user_by_identifier(_identifier text)
RETURNS TABLE(id uuid, display_name text, username text, avatar_url text, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _normalized_identifier text;
BEGIN
  _normalized_identifier := LOWER(TRIM(_identifier));
  _normalized_identifier := REGEXP_REPLACE(_normalized_identifier, '^@', '');

  IF _normalized_identifier ~ '@' THEN
    RETURN QUERY
    SELECT
      u.id,
      p.display_name,
      p.username,
      p.avatar_url,
      u.email::text
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE LOWER(u.email) = _normalized_identifier
    LIMIT 1;
  ELSE
    RETURN QUERY
    SELECT
      p.id,
      p.display_name,
      p.username,
      p.avatar_url,
      u.email::text
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE LOWER(p.username) = _normalized_identifier
    LIMIT 1;
  END IF;
END;
$$;

-- Função: get_public_events
CREATE OR REPLACE FUNCTION public.get_public_events()
RETURNS TABLE (
  id bigint,
  title text,
  description text,
  event_date date,
  event_time text,
  location text,
  is_public boolean,
  status text,
  max_attendees integer,
  tipo_evento text,
  categoria_evento text,
  subtipo_evento text,
  finalidade_evento text,
  menu text,
  inclui_entradas boolean,
  inclui_bebidas boolean,
  qtd_pessoas integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    title,
    description,
    event_date,
    event_time,
    CASE
      WHEN user_id = auth.uid() THEN location
      WHEN is_public = true THEN COALESCE(public_location, mask_location(location))
      ELSE location
    END as location,
    is_public,
    status,
    max_attendees,
    tipo_evento,
    categoria_evento,
    subtipo_evento,
    finalidade_evento,
    menu,
    inclui_entradas,
    inclui_bebidas,
    qtd_pessoas,
    created_at,
    updated_at
  FROM table_reune
  WHERE is_public = true OR user_id = auth.uid();
$$;

-- Função: get_event_details_safe
CREATE OR REPLACE FUNCTION public.get_event_details_safe(_event_id bigint)
RETURNS TABLE(
  id bigint,
  title text,
  description text,
  event_date date,
  event_time text,
  location text,
  is_public boolean,
  status text,
  max_attendees integer,
  tipo_evento text,
  categoria_evento text,
  subtipo_evento text,
  finalidade_evento text,
  menu text,
  inclui_entradas boolean,
  inclui_bebidas boolean,
  qtd_pessoas integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  creator_display_name text,
  creator_avatar_url text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.event_date,
    e.event_time,
    CASE
      WHEN e.user_id = auth.uid() OR public.is_event_organizer(auth.uid(), _event_id) THEN e.location
      WHEN e.is_public = true THEN COALESCE(e.public_location, public.mask_location(e.location))
      ELSE e.location
    END as location,
    e.is_public,
    e.status,
    e.max_attendees,
    e.tipo_evento,
    e.categoria_evento,
    e.subtipo_evento,
    e.finalidade_evento,
    e.menu,
    e.inclui_entradas,
    e.inclui_bebidas,
    e.qtd_pessoas,
    e.created_at,
    e.updated_at,
    COALESCE(p.display_name, 'Organizador') as creator_display_name,
    p.avatar_url as creator_avatar_url
  FROM table_reune e
  LEFT JOIN profiles p ON e.user_id = p.id
  WHERE e.id = _event_id
  AND (e.is_public = true OR e.user_id = auth.uid() OR public.is_event_organizer(auth.uid(), _event_id));
END;
$$;

-- Funções RPC para UNE.Ai

-- Função: participants_bulk_upsert
CREATE OR REPLACE FUNCTION public.participants_bulk_upsert(
  evento_id uuid,
  participantes jsonb
)
RETURNS SETOF public.participantes_evento
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
  out_row public.participantes_evento%rowtype;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eventos e WHERE e.id = participants_bulk_upsert.evento_id AND e.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for event %', participants_bulk_upsert.evento_id USING errcode = '42501';
  END IF;

  FOR rec IN
    SELECT * FROM jsonb_to_recordset(participantes) AS (
      id uuid,
      nome_participante text,
      contato text,
      status_convite text,
      preferencias jsonb,
      valor_responsavel numeric
    )
  LOOP
    INSERT INTO public.participantes_evento AS p (
      id, evento_id, nome_participante, contato, status_convite, preferencias, valor_responsavel
    ) VALUES (
      COALESCE(rec.id, gen_random_uuid()),
      evento_id,
      rec.nome_participante,
      rec.contato,
      COALESCE(rec.status_convite, 'pendente'),
      rec.preferencias,
      rec.valor_responsavel
    )
    ON CONFLICT (id) DO UPDATE SET
      nome_participante = EXCLUDED.nome_participante,
      contato = EXCLUDED.contato,
      status_convite = EXCLUDED.status_convite,
      preferencias = EXCLUDED.preferencias,
      valor_responsavel = EXCLUDED.valor_responsavel
    RETURNING * INTO out_row;

    RETURN NEXT out_row;
  END LOOP;
  RETURN;
END;
$$;

-- Função: items_replace_for_event
CREATE OR REPLACE FUNCTION public.items_replace_for_event(
  evento_id uuid,
  itens jsonb
)
RETURNS SETOF public.itens_evento
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  out_row public.itens_evento%rowtype;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eventos e WHERE e.id = items_replace_for_event.evento_id AND e.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for event %', items_replace_for_event.evento_id USING errcode = '42501';
  END IF;

  DELETE FROM public.itens_evento WHERE evento_id = items_replace_for_event.evento_id;

  INSERT INTO public.itens_evento (
    id, evento_id, nome_item, quantidade, unidade, valor_estimado, categoria, prioridade
  )
  SELECT
    COALESCE(i.id, gen_random_uuid()) as id,
    items_replace_for_event.evento_id as evento_id,
    i.nome_item,
    i.quantidade,
    i.unidade,
    i.valor_estimado,
    i.categoria,
    i.prioridade
  FROM jsonb_to_recordset(itens) AS i(
    id uuid,
    nome_item text,
    quantidade numeric,
    unidade text,
    valor_estimado numeric,
    categoria text,
    prioridade text
  );

  FOR out_row IN
    SELECT * FROM public.itens_evento WHERE evento_id = items_replace_for_event.evento_id ORDER BY updated_at DESC
  LOOP
    RETURN NEXT out_row;
  END LOOP;
  RETURN;
END;
$$;

-- Função: distribution_bulk_upsert
CREATE OR REPLACE FUNCTION public.distribution_bulk_upsert(
  evento_id uuid,
  rows jsonb
)
RETURNS SETOF public.distribuicao_itens
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec record;
  out_row public.distribuicao_itens%rowtype;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eventos e WHERE e.id = distribution_bulk_upsert.evento_id AND e.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for event %', distribution_bulk_upsert.evento_id USING errcode = '42501';
  END IF;

  FOR rec IN
    SELECT * FROM jsonb_to_recordset(rows) AS (
      id uuid,
      item_id uuid,
      participante_id uuid,
      quantidade_atribuida numeric,
      valor_rateado numeric,
      observacoes text
    )
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.itens_evento i WHERE i.id = rec.item_id AND i.evento_id = distribution_bulk_upsert.evento_id
    ) THEN
      RAISE EXCEPTION 'item % does not belong to event %', rec.item_id, distribution_bulk_upsert.evento_id USING errcode = '23503';
    END IF;

    INSERT INTO public.distribuicao_itens AS d (
      id, item_id, participante_id, quantidade_atribuida, valor_rateado, observacoes
    ) VALUES (
      COALESCE(rec.id, gen_random_uuid()),
      rec.item_id,
      rec.participante_id,
      rec.quantidade_atribuida,
      rec.valor_rateado,
      rec.observacoes
    )
    ON CONFLICT (item_id, participante_id) DO UPDATE SET
      quantidade_atribuida = EXCLUDED.quantidade_atribuida,
      valor_rateado = EXCLUDED.valor_rateado,
      observacoes = EXCLUDED.observacoes
    RETURNING * INTO out_row;

    RETURN NEXT out_row;
  END LOOP;
  RETURN;
END;
$$;

-- Função: events_plan
CREATE OR REPLACE FUNCTION public.events_plan(evento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ev jsonb;
  it jsonb;
  pa jsonb;
  di jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eventos e WHERE e.id = events_plan.evento_id AND e.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for event %', events_plan.evento_id USING errcode = '42501';
  END IF;

  SELECT to_jsonb(e) INTO ev FROM public.eventos e WHERE e.id = events_plan.evento_id;
  SELECT COALESCE(jsonb_agg(to_jsonb(i)), '[]'::jsonb) INTO it FROM public.itens_evento i WHERE i.evento_id = events_plan.evento_id;
  SELECT COALESCE(jsonb_agg(to_jsonb(p)), '[]'::jsonb) INTO pa FROM public.participantes_evento p WHERE p.evento_id = events_plan.evento_id;
  SELECT COALESCE(jsonb_agg(to_jsonb(d)), '[]'::jsonb) INTO di FROM public.distribuicao_itens d
    JOIN public.itens_evento i ON i.id = d.item_id
    WHERE i.evento_id = events_plan.evento_id;

  RETURN jsonb_build_object('evento', ev, 'itens', it, 'participantes', pa, 'distribuicao', di);
END;
$$;

-- Função: events_distribution_summary
CREATE OR REPLACE FUNCTION public.events_distribution_summary(evento_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  por_participante jsonb;
  total numeric;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.eventos e WHERE e.id = events_distribution_summary.evento_id AND e.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorized for event %', events_distribution_summary.evento_id USING errcode = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(x)), '[]'::jsonb) INTO por_participante
  FROM (
    SELECT d.participante_id, sum(d.valor_rateado) as total
    FROM public.distribuicao_itens d
    JOIN public.itens_evento i ON i.id = d.item_id
    WHERE i.evento_id = events_distribution_summary.evento_id
    GROUP BY d.participante_id
  ) x;

  SELECT COALESCE(sum(d.valor_rateado), 0) INTO total
  FROM public.distribuicao_itens d
  JOIN public.itens_evento i ON i.id = d.item_id
  WHERE i.evento_id = events_distribution_summary.evento_id;

  RETURN jsonb_build_object('porParticipante', por_participante, 'custoTotal', total);
END;
$$;

-- Função: notify_secret_santa_draw
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

-- Função: update_secret_santa_updated_at
CREATE OR REPLACE FUNCTION public.update_secret_santa_updated_at()
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

-- Função: check_and_mark_founder
CREATE OR REPLACE FUNCTION public.check_and_mark_founder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _user_email TEXT;
  _is_in_waitlist BOOLEAN;
BEGIN
  SELECT email INTO _user_email
  FROM auth.users
  WHERE id = NEW.id;

  SELECT EXISTS (
    SELECT 1
    FROM public.waitlist_reune
    WHERE LOWER(email) = LOWER(_user_email)
    AND is_founder = true
  ) INTO _is_in_waitlist;

  IF _is_in_waitlist THEN
    NEW.is_founder := true;
    NEW.founder_since := NOW();
    NEW.premium_until := (NOW() + INTERVAL '6 months')::DATE;
    NEW.storage_multiplier := 3;
  END IF;

  RETURN NEW;
END;
$$;

-- Função: has_active_premium
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

  RETURN _premium_until IS NOT NULL AND _premium_until >= CURRENT_DATE;
END;
$$;

-- Função: get_storage_multiplier
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

-- Função: create_missing_profiles
CREATE OR REPLACE FUNCTION public.create_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  profiles_created INT := 0;
BEGIN
  FOR user_record IN
    SELECT id, email, created_at, raw_user_meta_data
    FROM auth.users
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_record.id) THEN
      INSERT INTO public.profiles (id, created_at)
      VALUES (user_record.id, user_record.created_at)
      ON CONFLICT (id) DO NOTHING;
      profiles_created := profiles_created + 1;
    END IF;
  END LOOP;
  RAISE NOTICE 'Profiles criados: %', profiles_created;
END;
$$;

-- Função: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at)
  VALUES (NEW.id, NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger: update_table_reune_updated_at
CREATE TRIGGER update_table_reune_updated_at
  BEFORE UPDATE ON public.table_reune
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_event_confirmations_updated_at
CREATE TRIGGER update_event_confirmations_updated_at
  BEFORE UPDATE ON public.event_confirmations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_user_addresses_updated_at
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: ensure_single_primary_address_trigger
CREATE TRIGGER ensure_single_primary_address_trigger
  BEFORE INSERT OR UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_address();

-- Trigger: update_eventos_updated_at
CREATE TRIGGER update_eventos_updated_at
  BEFORE UPDATE ON public.eventos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_itens_evento_updated_at
CREATE TRIGGER update_itens_evento_updated_at
  BEFORE UPDATE ON public.itens_evento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_participantes_evento_updated_at
CREATE TRIGGER update_participantes_evento_updated_at
  BEFORE UPDATE ON public.participantes_evento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_distribuicao_itens_updated_at
CREATE TRIGGER update_distribuicao_itens_updated_at
  BEFORE UPDATE ON public.distribuicao_itens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_preferencias_usuario_updated_at
CREATE TRIGGER update_preferencias_usuario_updated_at
  BEFORE UPDATE ON public.preferencias_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_conversation_contexts_updated_at
CREATE TRIGGER update_conversation_contexts_updated_at
  BEFORE UPDATE ON public.conversation_contexts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: on_profile_created_link_invitations
CREATE TRIGGER on_profile_created_link_invitations
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_pending_invitations();

-- Trigger: on_friendship_created
CREATE TRIGGER on_friendship_created
  AFTER INSERT ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pending_invites_on_friendship();

-- Trigger: update_email_templates_updated_at
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_admin_settings_updated_at
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_event_dynamics_updated_at
CREATE TRIGGER update_event_dynamics_updated_at
  BEFORE UPDATE ON public.event_dynamics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_secret_santa_updated_at();

-- Trigger: update_event_secret_santa_updated_at
CREATE TRIGGER update_event_secret_santa_updated_at
  BEFORE UPDATE ON public.event_secret_santa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_secret_santa_updated_at();

-- Trigger: update_event_secret_santa_participants_updated_at
CREATE TRIGGER update_event_secret_santa_participants_updated_at
  BEFORE UPDATE ON public.event_secret_santa_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_secret_santa_updated_at();

-- Trigger: trigger_check_founder_on_signup
CREATE TRIGGER trigger_check_founder_on_signup
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_mark_founder();

-- Trigger: on_auth_user_created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- VIEWS
-- =============================================

-- View: conversation_metrics
CREATE VIEW public.conversation_metrics
WITH (security_invoker = true)
AS
SELECT
  user_id,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_interactions,
  AVG(confidence_level) as avg_confidence,
  SUM(CASE WHEN user_corrected THEN 1 ELSE 0 END) as correction_count,
  SUM(CASE WHEN clarification_needed THEN 1 ELSE 0 END) as clarification_count,
  AVG(response_time_ms) as avg_response_time_ms,
  COUNT(DISTINCT intent) as unique_intents,
  COUNT(DISTINCT evento_id) as events_touched
FROM public.conversation_analytics
GROUP BY user_id, DATE_TRUNC('day', created_at);

COMMENT ON VIEW public.conversation_metrics IS 'Aggregated conversation metrics with SECURITY INVOKER to respect RLS policies of the querying user';

-- View: founder_members
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

COMMENT ON VIEW public.founder_members IS 'Lista de todos os membros fundadores com seus benefícios';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_reune ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_reune ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_dynamics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_secret_santa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_secret_santa_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_secret_santa_pairs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- Policies for profiles
CREATE POLICY "Perfis visíveis apenas para usuários autenticados"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Policies for table_reune
CREATE POLICY "Authenticated users can view public events or own events"
  ON public.table_reune FOR SELECT
  TO authenticated
  USING (
    is_public = true
    OR user_id = auth.uid()
    OR is_event_organizer(auth.uid(), id)
  );

CREATE POLICY "Usuários podem criar eventos"
  ON public.table_reune FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar próprios eventos"
  ON public.table_reune FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar próprios eventos"
  ON public.table_reune FOR DELETE
  USING (user_id = auth.uid());

-- Policies for event_organizers
CREATE POLICY "Todos podem ver organizadores de eventos públicos"
  ON public.event_organizers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE id = event_organizers.event_id
      AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Criadores de eventos podem adicionar organizadores"
  ON public.event_organizers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE id = event_organizers.event_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Criadores podem remover organizadores"
  ON public.event_organizers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE id = event_organizers.event_id
      AND user_id = auth.uid()
    )
  );

-- Policies for event_confirmations
CREATE POLICY "Usuários podem ver confirmações de eventos públicos ou seus próprios"
  ON public.event_confirmations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_confirmations.event_id
      AND (table_reune.is_public = true OR table_reune.user_id = auth.uid())
    )
  );

CREATE POLICY "Usuários podem criar suas próprias confirmações"
  ON public.event_confirmations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias confirmações"
  ON public.event_confirmations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias confirmações"
  ON public.event_confirmations FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for event_items
CREATE POLICY "Convidados confirmados podem ver itens"
  ON public.event_items FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_items.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR table_reune.is_public = true
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_items.event_id
          AND ei.participant_email = public.get_my_email()
          AND ei.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Organizadores e convidados podem inserir itens"
  ON public.event_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_items.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_items.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_items.event_id
          AND ei.participant_email = get_my_email()
          AND ei.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Organizadores e convidados podem atualizar itens"
  ON public.event_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_items.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_items.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_items.event_id
          AND ei.participant_email = get_my_email()
          AND ei.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Organizadores e convidados podem deletar itens"
  ON public.event_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_items.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_items.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_items.event_id
          AND ei.participant_email = get_my_email()
          AND ei.status = 'accepted'
        )
      )
    )
  );

-- Policies for event_participants
CREATE POLICY "Convidados confirmados podem ver participantes"
  ON public.event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_participants.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), event_participants.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = event_participants.event_id
          AND ei.participant_email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
          )
          AND ei.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Usuários podem inserir participantes em eventos próprios"
  ON public.event_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_participants.event_id
      AND table_reune.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar participantes de eventos próprios"
  ON public.event_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_participants.event_id
      AND table_reune.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar participantes de eventos próprios"
  ON public.event_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_participants.event_id
      AND table_reune.user_id = auth.uid()
    )
  );

-- Policies for event_invitations
CREATE POLICY "Apenas criador do evento pode ver convites com emails"
  ON public.event_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = event_invitations.event_id
      AND table_reune.user_id = auth.uid()
    )
  );

CREATE POLICY "Convidados podem ver seus próprios convites"
  ON public.event_invitations FOR SELECT
  TO public
  USING (
    participant_email = public.get_my_email()
  );

-- Policies for item_assignments
CREATE POLICY "Convidados confirmados podem ver atribuições"
  ON public.item_assignments FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = item_assignments.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR table_reune.is_public = true
        OR is_event_organizer(auth.uid(), item_assignments.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = item_assignments.event_id
          AND ei.participant_email = public.get_my_email()
          AND ei.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Convidados confirmados podem criar atribuições"
  ON public.item_assignments FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = item_assignments.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), item_assignments.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          WHERE ei.event_id = item_assignments.event_id
          AND ei.participant_email = public.get_my_email()
          AND ei.status = 'accepted'
        )
      )
    )
  );

CREATE POLICY "Convidados confirmados podem atualizar suas atribuições"
  ON public.item_assignments FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM table_reune
      WHERE table_reune.id = item_assignments.event_id
      AND (
        table_reune.user_id = auth.uid()
        OR is_event_organizer(auth.uid(), item_assignments.event_id)
        OR EXISTS (
          SELECT 1 FROM event_invitations ei
          JOIN event_participants ep ON ep.event_id = ei.event_id
            AND ei.participant_email = public.get_my_email()
          WHERE ei.event_id = item_assignments.event_id
          AND ei.status = 'accepted'
          AND item_assignments.participant_id = ep.id
        )
      )
    )
  );

-- Policies for notifications
CREATE POLICY "Usuários veem próprias notificações"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprias notificações"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for friend_requests
CREATE POLICY "Usuários podem criar pedidos de amizade"
  ON public.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Remetentes podem ver pedidos enviados"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Destinatários podem ver pedidos recebidos com email"
  ON public.friend_requests FOR SELECT
  USING (auth.uid() = receiver_id);

CREATE POLICY "Destinatários podem atualizar pedidos recebidos"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Remetentes podem deletar pedidos pendentes"
  ON public.friend_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id AND status = 'pending');

-- Policies for friendships
CREATE POLICY "Usuários podem ver suas próprias amizades"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "Usuários podem deletar próprias amizades"
  ON public.friendships FOR DELETE
  USING (
    auth.uid() = user_id_1 OR auth.uid() = user_id_2
  );

CREATE POLICY "Sistema pode criar amizades via funções"
  ON public.friendships FOR INSERT
  WITH CHECK (true);

-- Policies for user_addresses
CREATE POLICY "Usuários veem próprios endereços"
  ON public.user_addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprios endereços"
  ON public.user_addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprios endereços"
  ON public.user_addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprios endereços"
  ON public.user_addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for conversation_messages
CREATE POLICY "Usuários veem próprias mensagens"
  ON public.conversation_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprias mensagens"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias mensagens"
  ON public.conversation_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for conversation_contexts
CREATE POLICY "Usuários veem próprio contexto"
  ON public.conversation_contexts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprio contexto"
  ON public.conversation_contexts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio contexto"
  ON public.conversation_contexts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprio contexto"
  ON public.conversation_contexts FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for conversation_analytics
CREATE POLICY "Usuários veem próprios analytics"
  ON public.conversation_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema cria analytics"
  ON public.conversation_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policies for user_feedback
CREATE POLICY "Usuários veem próprio feedback"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprio feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio feedback"
  ON public.user_feedback FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for waitlist_reune
CREATE POLICY "Qualquer pessoa pode se inscrever na lista de espera"
  ON public.waitlist_reune FOR INSERT
  WITH CHECK (true);

-- Policies for email_templates
CREATE POLICY "Service role tem acesso total a templates"
  ON public.email_templates
  USING (false);

-- Policies for email_logs
CREATE POLICY "Service role tem acesso total a logs"
  ON public.email_logs
  USING (false);

-- Policies for admin_settings
CREATE POLICY "Service role tem acesso total a settings"
  ON public.admin_settings
  USING (false);

-- Policies for bug_reports
CREATE POLICY "Users can insert their own bug reports"
  ON public.bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bug reports"
  ON public.bug_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for event_dynamics
CREATE POLICY "Usuários podem ver dinâmicas de eventos acessíveis"
  ON public.event_dynamics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_dynamics.event_id
      AND (table_reune.user_id = auth.uid() OR table_reune.is_public = true OR is_event_organizer(auth.uid(), event_dynamics.event_id))
    )
  );

CREATE POLICY "Organizadores podem criar dinâmicas"
  ON public.event_dynamics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_dynamics.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_dynamics.event_id))
    )
  );

CREATE POLICY "Organizadores podem deletar dinâmicas"
  ON public.event_dynamics FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_dynamics.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_dynamics.event_id))
    )
  );

-- Policies for event_secret_santa
CREATE POLICY "Usuários podem ver amigo secreto de eventos acessíveis"
  ON public.event_secret_santa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_secret_santa.event_id
      AND (table_reune.user_id = auth.uid() OR table_reune.is_public = true OR is_event_organizer(auth.uid(), event_secret_santa.event_id))
    )
  );

CREATE POLICY "Organizadores podem criar amigo secreto"
  ON public.event_secret_santa FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_secret_santa.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_secret_santa.event_id))
    )
  );

CREATE POLICY "Organizadores podem atualizar amigo secreto"
  ON public.event_secret_santa FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.table_reune
      WHERE table_reune.id = event_secret_santa.event_id
      AND (table_reune.user_id = auth.uid() OR is_event_organizer(auth.uid(), event_secret_santa.event_id))
    )
  );

-- Policies for event_secret_santa_participants
CREATE POLICY "Usuários podem ver participantes de amigo secreto acessível"
  ON public.event_secret_santa_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_participants.secret_santa_id
      AND (tr.user_id = auth.uid() OR tr.is_public = true OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

CREATE POLICY "Organizadores podem adicionar participantes"
  ON public.event_secret_santa_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_participants.secret_santa_id
      AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

CREATE POLICY "Participantes podem atualizar próprio perfil"
  ON public.event_secret_santa_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Organizadores podem remover participantes"
  ON public.event_secret_santa_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM event_secret_santa ess
      JOIN table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_participants.secret_santa_id
      AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

-- Policies for event_secret_santa_pairs
CREATE POLICY "Participantes veem apenas seu par"
  ON public.event_secret_santa_pairs FOR SELECT
  USING (
    giver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_pairs.secret_santa_id
      AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

CREATE POLICY "Sistema pode criar pares durante sorteio"
  ON public.event_secret_santa_pairs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.event_secret_santa ess
      JOIN public.table_reune tr ON tr.id = ess.event_id
      WHERE ess.id = event_secret_santa_pairs.secret_santa_id
      AND (tr.user_id = auth.uid() OR is_event_organizer(auth.uid(), ess.event_id))
    )
  );

-- =============================================
-- STORAGE BUCKETS AND POLICIES
-- =============================================

-- Bucket: avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatars são publicamente acessíveis"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Usuários podem fazer upload de seus avatares"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem atualizar seus avatares"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuários podem deletar seus avatares"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Bucket: screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'screenshots',
  'screenshots',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Qualquer um pode fazer upload de screenshots"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'screenshots');

CREATE POLICY "Screenshots são públicos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'screenshots');

CREATE POLICY "Usuários podem deletar seus screenshots"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'screenshots');

-- =============================================
-- GRANTS
-- =============================================

GRANT EXECUTE ON FUNCTION public.get_my_email() TO authenticated;

-- =============================================
-- SCHEMA COMPLETO FINALIZADO
-- =============================================
