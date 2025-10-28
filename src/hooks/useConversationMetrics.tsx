import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { FeedbackManager } from '@/core/orchestrator/feedbackManager';

export interface PerformanceMetrics {
  summary: {
    total_interactions: number;
    avg_confidence: number;
    success_rate: number;
    clarification_rate: number;
  };
  feedback: {
    positive: number;
    negative: number;
    total: number;
  };
  recent_low_confidence: Array<{
    intent: string;
    confidence_level: number;
    created_at: string;
  }>;
  frequent_errors: Array<{
    intent: string;
    error_count: number;
    avg_confidence: number;
  }>;
}

/**
 * Hook para acessar métricas de performance do UNE.AI
 */
export function useConversationMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const feedbackManager = new FeedbackManager();
      const data = await feedbackManager.getPerformanceMetrics(user.id);
      setMetrics(data as PerformanceMetrics);
    } catch (err) {
      console.error('[useConversationMetrics] Erro ao carregar métricas:', err);
      setError('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [user?.id]);

  return {
    metrics,
    loading,
    error,
    refresh: loadMetrics,
  };
}
