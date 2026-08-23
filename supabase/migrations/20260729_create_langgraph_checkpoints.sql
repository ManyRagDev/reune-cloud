-- Migration: Create langgraph_checkpoints table for persistent LangGraph state
-- Applied via Supabase MCP on 2026-07-29

CREATE TABLE IF NOT EXISTS public.langgraph_checkpoints (
  thread_id TEXT NOT NULL PRIMARY KEY,
  checkpoint JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_langgraph_checkpoints_thread_id 
ON public.langgraph_checkpoints(thread_id);

ALTER TABLE public.langgraph_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own checkpoints" 
ON public.langgraph_checkpoints
FOR ALL 
USING (auth.uid()::text = (metadata->>'user_id') OR auth.role() = 'service_role')
WITH CHECK (auth.uid()::text = (metadata->>'user_id') OR auth.role() = 'service_role');
