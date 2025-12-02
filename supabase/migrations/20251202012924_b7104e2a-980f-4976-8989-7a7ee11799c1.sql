
-- Drop and recreate the conversation_metrics view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS conversation_metrics;

CREATE VIEW conversation_metrics 
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
FROM conversation_analytics
GROUP BY user_id, DATE_TRUNC('day', created_at);

COMMENT ON VIEW conversation_metrics IS 'Aggregated conversation metrics with SECURITY INVOKER to respect RLS policies of the querying user';
