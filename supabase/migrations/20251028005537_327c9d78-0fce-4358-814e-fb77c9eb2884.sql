-- Tabela para armazenar mensagens da conversa
CREATE TABLE conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id BIGINT REFERENCES table_reune(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_conversation_messages_user ON conversation_messages(user_id, timestamp DESC);
CREATE INDEX idx_conversation_messages_event ON conversation_messages(evento_id);

-- Tabela para armazenar contexto conversacional
CREATE TABLE conversation_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL DEFAULT 'idle',
  evento_id BIGINT REFERENCES table_reune(id) ON DELETE SET NULL,
  collected_data JSONB DEFAULT '{}',
  missing_slots TEXT[] DEFAULT '{}',
  confidence_level NUMERIC(3,2) DEFAULT 0.5,
  last_intent TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_contexts_user ON conversation_contexts(user_id);

-- RLS para conversation_messages
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprias mensagens"
  ON conversation_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprias mensagens"
  ON conversation_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprias mensagens"
  ON conversation_messages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS para conversation_contexts
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprio contexto"
  ON conversation_contexts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprio contexto"
  ON conversation_contexts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio contexto"
  ON conversation_contexts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários deletam próprio contexto"
  ON conversation_contexts FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_conversation_contexts_updated_at
  BEFORE UPDATE ON conversation_contexts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();