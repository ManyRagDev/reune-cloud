-- Tabela para registrar analytics de interações
CREATE TABLE conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id BIGINT REFERENCES table_reune(id) ON DELETE SET NULL,
  message_id UUID REFERENCES conversation_messages(id) ON DELETE CASCADE,
  
  -- Dados da interação
  intent TEXT NOT NULL,
  confidence_level NUMERIC(3,2) NOT NULL,
  response_type TEXT, -- 'template', 'llm', 'hybrid'
  
  -- Feedback implícito
  user_corrected BOOLEAN DEFAULT false,
  user_confused BOOLEAN DEFAULT false,
  clarification_needed BOOLEAN DEFAULT false,
  
  -- Métricas
  response_time_ms INTEGER,
  tokens_used INTEGER,
  
  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_analytics_user ON conversation_analytics(user_id);
CREATE INDEX idx_conversation_analytics_intent ON conversation_analytics(intent);
CREATE INDEX idx_conversation_analytics_confidence ON conversation_analytics(confidence_level);
CREATE INDEX idx_conversation_analytics_evento ON conversation_analytics(evento_id);

-- Tabela para feedback explícito do usuário
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id BIGINT REFERENCES table_reune(id) ON DELETE SET NULL,
  message_id UUID REFERENCES conversation_messages(id) ON DELETE CASCADE,
  
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'report', 'suggestion')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_feedback_user ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_type ON user_feedback(feedback_type);

-- View para métricas agregadas
CREATE OR REPLACE VIEW conversation_metrics AS
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
FROM conversation_analytics
GROUP BY user_id, DATE_TRUNC('day', created_at);

-- RLS para conversation_analytics
ALTER TABLE conversation_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprios analytics"
  ON conversation_analytics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema cria analytics"
  ON conversation_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS para user_feedback
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários veem próprio feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários criam próprio feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários atualizam próprio feedback"
  ON user_feedback FOR UPDATE
  USING (auth.uid() = user_id);