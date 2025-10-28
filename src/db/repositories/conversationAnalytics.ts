import { supabase } from '@/integrations/supabase/client';
import { UUID } from '@/types/domain';

export interface ConversationAnalytic {
  id: string;
  user_id: UUID;
  evento_id?: number;
  message_id?: string;
  intent: string;
  confidence_level: number;
  response_type?: 'template' | 'llm' | 'hybrid';
  user_corrected: boolean;
  user_confused: boolean;
  clarification_needed: boolean;
  response_time_ms?: number;
  tokens_used?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ConversationMetric {
  user_id: UUID;
  date: string;
  total_interactions: number;
  avg_confidence: number;
  correction_count: number;
  clarification_count: number;
  avg_response_time_ms: number;
  unique_intents: number;
  events_touched: number;
}

export class ConversationAnalyticsRepository {
  /**
   * Registra uma nova interação para analytics
   */
  async logInteraction(
    userId: UUID,
    intent: string,
    confidenceLevel: number,
    responseType: 'template' | 'llm' | 'hybrid',
    options: {
      eventoId?: number;
      messageId?: string;
      userCorrected?: boolean;
      userConfused?: boolean;
      clarificationNeeded?: boolean;
      responseTimeMs?: number;
      tokensUsed?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<ConversationAnalytic | null> {
    const startTime = Date.now();

    const { data, error } = await supabase
      .from('conversation_analytics')
      .insert([{
        user_id: userId,
        evento_id: options.eventoId,
        message_id: options.messageId,
        intent,
        confidence_level: confidenceLevel,
        response_type: responseType,
        user_corrected: options.userCorrected || false,
        user_confused: options.userConfused || false,
        clarification_needed: options.clarificationNeeded || false,
        response_time_ms: options.responseTimeMs || (Date.now() - startTime),
        tokens_used: options.tokensUsed,
        metadata: options.metadata as any || {},
      }])
      .select()
      .single();

    if (error) {
      console.error('[Analytics] Erro ao registrar interação:', error);
      return null;
    }

    return data ? {
      ...data,
      metadata: data.metadata as Record<string, unknown>,
    } as ConversationAnalytic : null;
  }

  /**
   * Marca uma interação como tendo sido corrigida pelo usuário
   */
  async markAsCorrected(analyticId: string): Promise<boolean> {
    const { error } = await supabase
      .from('conversation_analytics')
      .update({ user_corrected: true })
      .eq('id', analyticId);

    if (error) {
      console.error('[Analytics] Erro ao marcar correção:', error);
      return false;
    }

    return true;
  }

  /**
   * Marca uma interação como tendo gerado confusão
   */
  async markAsConfused(analyticId: string): Promise<boolean> {
    const { error } = await supabase
      .from('conversation_analytics')
      .update({ user_confused: true })
      .eq('id', analyticId);

    if (error) {
      console.error('[Analytics] Erro ao marcar confusão:', error);
      return false;
    }

    return true;
  }

  /**
   * Busca métricas agregadas do usuário
   */
  async getMetrics(userId: UUID, days = 30): Promise<ConversationMetric[]> {
    const { data, error } = await supabase
      .from('conversation_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (error) {
      console.error('[Analytics] Erro ao buscar métricas:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Busca interações com baixa confiança para análise
   */
  async getLowConfidenceInteractions(
    userId: UUID,
    threshold = 0.6,
    limit = 50
  ): Promise<ConversationAnalytic[]> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('*')
      .eq('user_id', userId)
      .lte('confidence_level', threshold)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Analytics] Erro ao buscar interações de baixa confiança:', error);
      return [];
    }

    return (data || []).map(d => ({
      ...d,
      metadata: d.metadata as Record<string, unknown>,
    })) as ConversationAnalytic[];
  }

  /**
   * Busca padrões de erro frequentes
   */
  async getFrequentErrors(userId: UUID, days = 30): Promise<{
    intent: string;
    error_count: number;
    avg_confidence: number;
  }[]> {
    const { data, error } = await supabase
      .from('conversation_analytics')
      .select('intent, user_corrected, user_confused, confidence_level')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('[Analytics] Erro ao buscar erros frequentes:', error);
      return [];
    }

    // Agregar manualmente no cliente
    const grouped = (data || []).reduce((acc, row) => {
      if (row.user_corrected || row.user_confused) {
        if (!acc[row.intent]) {
          acc[row.intent] = { count: 0, totalConfidence: 0, items: 0 };
        }
        acc[row.intent].count++;
        acc[row.intent].totalConfidence += row.confidence_level;
        acc[row.intent].items++;
      }
      return acc;
    }, {} as Record<string, { count: number; totalConfidence: number; items: number }>);

    return Object.entries(grouped).map(([intent, stats]) => ({
      intent,
      error_count: stats.count,
      avg_confidence: stats.totalConfidence / stats.items,
    })).sort((a, b) => b.error_count - a.error_count);
  }
}
