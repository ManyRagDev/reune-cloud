import { supabase } from '@/integrations/supabase/client';
import { UUID } from '@/types/domain';
import { LlmMessage } from '@/types/llm';

export interface ConversationMessage {
  id: string;
  user_id: UUID;
  evento_id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class ConversationMessagesRepository {
  /**
   * Busca histórico de mensagens do usuário, ordenadas por timestamp (mais antigas primeiro)
   */
  async getByUserId(userId: UUID, limit = 50): Promise<ConversationMessage[]> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[ConversationMessages] Erro ao buscar mensagens:', error);
      return [];
    }

    return (data || []).map(m => ({
      ...m,
      metadata: m.metadata as Record<string, unknown>,
    })) as ConversationMessage[];
  }

  /**
   * Adiciona uma nova mensagem ao histórico
   */
  async addMessage(
    userId: UUID,
    role: 'user' | 'assistant' | 'system',
    content: string,
    eventoId?: number,
    metadata?: Record<string, unknown>
  ): Promise<ConversationMessage | null> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .insert([{
        user_id: userId,
        evento_id: eventoId,
        role,
        content,
        metadata: (metadata || {}) as any,
      }])
      .select()
      .single();

    if (error) {
      console.error('[ConversationMessages] Erro ao adicionar mensagem:', error);
      return null;
    }

    return data ? {
      ...data,
      metadata: data.metadata as Record<string, unknown>,
    } as ConversationMessage : null;
  }

  /**
   * Limpa histórico de mensagens do usuário
   */
  async clearHistory(userId: UUID): Promise<boolean> {
    const { error } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[ConversationMessages] Erro ao limpar histórico:', error);
      return false;
    }

    return true;
  }

  /**
   * Converte mensagens do banco para formato LlmMessage
   */
  toLlmMessages(messages: ConversationMessage[]): LlmMessage[] {
    return messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
  }

  /**
   * Busca apenas mensagens relacionadas a um evento específico
   */
  async getByEventId(eventoId: number): Promise<ConversationMessage[]> {
    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('evento_id', eventoId)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('[ConversationMessages] Erro ao buscar mensagens do evento:', error);
      return [];
    }

    return (data || []).map(m => ({
      ...m,
      metadata: m.metadata as Record<string, unknown>,
    })) as ConversationMessage[];
  }
}
