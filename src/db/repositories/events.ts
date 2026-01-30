import { supabase } from '@/integrations/supabase/client';
import { UUID } from '@/types/domain';
import { Tables } from '@/integrations/supabase/types';

export interface EventData {
  id: number;
  user_id: string;
  title: string;
  tipo_evento: string;
  subtipo_evento: string | null;
  categoria_evento: string | null;
  event_date: string;
  event_time: string;
  qtd_pessoas: number | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface RecentEvent {
  id: number;
  title: string;
  tipo_evento: string;
  event_date: string; // Formatado como 'dd/mm'
  status: string;
  qtd_pessoas: number;
}

export class EventsRepository {
  /**
   * Busca os últimos 3 eventos em aberto do usuário
   * Status considerados "em aberto": draft, collecting_core, aguardando_data, aguardando_preferencia_menu, itens_pendentes_confirmacao
   */
  async getRecentOpenEvents(userId: UUID, limit = 3): Promise<RecentEvent[]> {
    const openStatuses = [
      'draft',
      'created'
    ];

    const { data, error } = await supabase
      .from('table_reune')
      .select('*')
      .eq('user_id', userId)
      .in('status', openStatuses)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[EventsRepository] Erro ao buscar eventos recentes:', error);
      return [];
    }

    return (data || []).map((event) => {
      const typedEvent = event as Tables<'table_reune'>;
      return {
        id: typedEvent.id,
        title: typedEvent.title || typedEvent.tipo_evento || 'Evento',
        tipo_evento: typedEvent.tipo_evento || '',
        event_date: this.formatDate(typedEvent.event_date),
        status: typedEvent.status || 'draft',
        qtd_pessoas: typedEvent.qtd_pessoas || 0
      };
    }) as RecentEvent[];
  }

  /**
   * Busca todos os eventos do usuário que NÃO estão finalizados
   * (draft, created, cancelled, etc - exceto finalized)
   */
  async getAllOpenEvents(userId: UUID): Promise<RecentEvent[]> {
    const { data, error } = await supabase
      .from('table_reune')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'finalized')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[EventsRepository] Erro ao buscar eventos em aberto:', error);
      return [];
    }

    return (data || []).map((event) => {
      const typedEvent = event as Tables<'table_reune'>;
      return {
        id: typedEvent.id,
        title: typedEvent.title || typedEvent.tipo_evento || 'Evento',
        tipo_evento: typedEvent.tipo_evento || '',
        event_date: this.formatDate(typedEvent.event_date),
        status: typedEvent.status || 'draft',
        qtd_pessoas: typedEvent.qtd_pessoas || 0
      };
    }) as RecentEvent[];
  }

  /**
   * Busca um evento específico por ID
   */
  async getById(eventoId: number): Promise<EventData | null> {
    const { data, error } = await supabase
      .from('table_reune')
      .select('*')
      .eq('id', eventoId)
      .single();

    if (error) {
      console.error('[EventsRepository] Erro ao buscar evento:', error);
      return null;
    }

    return data as EventData;
  }

  /**
   * Formata data de evento para 'dd/mm'
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch (error) {
      console.error('[EventsRepository] Erro ao formatar data:', error);
      return dateString;
    }
  }
}
