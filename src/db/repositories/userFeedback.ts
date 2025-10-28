import { supabase } from '@/integrations/supabase/client';
import { UUID } from '@/types/domain';

export type FeedbackType = 'thumbs_up' | 'thumbs_down' | 'report' | 'suggestion';

export interface UserFeedback {
  id: string;
  user_id: UUID;
  evento_id?: number;
  message_id?: string;
  feedback_type: FeedbackType;
  rating?: number;
  comment?: string;
  created_at: string;
}

export class UserFeedbackRepository {
  /**
   * Registra feedback do usuário sobre uma mensagem
   */
  async submitFeedback(
    userId: UUID,
    feedbackType: FeedbackType,
    options: {
      eventoId?: number;
      messageId?: string;
      rating?: number;
      comment?: string;
    } = {}
  ): Promise<UserFeedback | null> {
    const { data, error } = await supabase
      .from('user_feedback')
      .insert([{
        user_id: userId,
        evento_id: options.eventoId,
        message_id: options.messageId,
        feedback_type: feedbackType,
      rating: options.rating,
      comment: options.comment,
    }])
      .select()
      .single();

    if (error) {
      console.error('[Feedback] Erro ao registrar feedback:', error);
      return null;
    }

    return data ? {
      ...data,
      feedback_type: data.feedback_type as FeedbackType,
    } as UserFeedback : null;
  }

  /**
   * Busca feedback do usuário
   */
  async getUserFeedback(userId: UUID, limit = 50): Promise<UserFeedback[]> {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Feedback] Erro ao buscar feedback:', error);
      return [];
    }

    return (data || []).map(d => ({
      ...d,
      feedback_type: d.feedback_type as FeedbackType,
    })) as UserFeedback[];
  }

  /**
   * Busca feedback por tipo
   */
  async getFeedbackByType(
    userId: UUID,
    feedbackType: FeedbackType
  ): Promise<UserFeedback[]> {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('feedback_type', feedbackType)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Feedback] Erro ao buscar feedback por tipo:', error);
      return [];
    }

    return (data || []).map(d => ({
      ...d,
      feedback_type: d.feedback_type as FeedbackType,
    })) as UserFeedback[];
  }

  /**
   * Conta feedback positivo vs negativo
   */
  async getFeedbackStats(userId: UUID): Promise<{
    positive: number;
    negative: number;
    total: number;
  }> {
    const { data, error } = await supabase
      .from('user_feedback')
      .select('feedback_type')
      .eq('user_id', userId);

    if (error) {
      console.error('[Feedback] Erro ao buscar estatísticas:', error);
      return { positive: 0, negative: 0, total: 0 };
    }

    const positive = (data || []).filter(
      (f) => f.feedback_type === 'thumbs_up'
    ).length;
    const negative = (data || []).filter(
      (f) => f.feedback_type === 'thumbs_down'
    ).length;

    return {
      positive,
      negative,
      total: (data || []).length,
    };
  }
}
