import { supabase } from '@/integrations/supabase/client';
import { UUID } from '@/types/domain';

export interface ConversationContext {
  id: string;
  user_id: UUID;
  state: string;
  evento_id?: number;
  collected_data: Record<string, unknown>;
  missing_slots: string[];
  confidence_level: number;
  last_intent?: string;
  summary?: string;
  created_at: string;
  updated_at: string;
}

export class ConversationContextsRepository {
  /**
   * Busca o contexto conversacional do usuário
   */
  async getByUserId(userId: UUID): Promise<ConversationContext | null> {
    const { data, error } = await supabase
      .from('conversation_contexts')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Nenhum registro encontrado, retornar null
        return null;
      }
      console.error('[ConversationContexts] Erro ao buscar contexto:', error);
      return null;
    }

    return data ? {
      ...data,
      collected_data: data.collected_data as Record<string, unknown>,
    } as ConversationContext : null;
  }

  /**
   * Cria ou atualiza o contexto conversacional do usuário
   */
  async upsert(
    userId: UUID,
    state: string,
    collectedData: Record<string, unknown>,
    missingSlots: string[],
    confidenceLevel: number,
    lastIntent?: string,
    eventoId?: number,
    summary?: string
  ): Promise<ConversationContext | null> {
    const { data, error } = await supabase
      .from('conversation_contexts')
      .upsert(
        {
          user_id: userId,
          state,
          evento_id: eventoId,
          collected_data: collectedData as any,
          missing_slots: missingSlots,
          confidence_level: confidenceLevel,
          last_intent: lastIntent,
          summary,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[ConversationContexts] Erro ao upsert contexto:', error);
      return null;
    }

    return data ? {
      ...data,
      collected_data: data.collected_data as Record<string, unknown>,
    } as ConversationContext : null;
  }

  /**
   * Remove o contexto conversacional do usuário
   */
  async delete(userId: UUID): Promise<boolean> {
    const { error } = await supabase
      .from('conversation_contexts')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[ConversationContexts] Erro ao deletar contexto:', error);
      return false;
    }

    return true;
  }

  /**
   * Cria um contexto inicial vazio
   */
  async createInitial(userId: UUID): Promise<ConversationContext | null> {
    return this.upsert(userId, 'idle', {}, [], 0.5);
  }
}
