import { supabase } from '@/integrations/supabase/client';
import type { Item, Participant, DistributionRow, Event } from '@/types/domain';

type Opts = { signal?: AbortSignal; idempotencyKey?: string };

async function participants_bulk_upsert(
  evento_id: string,
  participantes: Participant[],
  opts?: Opts,
): Promise<Participant[]> {
  const eventoId = String(evento_id);
  console.debug('[RPC] participants_bulk_upsert', { evento_id: eventoId, count: participantes.length });
  const { data, error } = await supabase.rpc('participants_bulk_upsert', {
    evento_id: eventoId,
    participantes: participantes as any // SDK serializa para JSONB
  });
  if (error) {
    console.error('[RPC] Erro em participants_bulk_upsert:', error);
    throw new Error(`Erro ao chamar participants_bulk_upsert: ${error.message}`);
  }
  return data as unknown as Participant[];
}

async function items_replace_for_event(evento_id: string, itens: Item[], opts?: Opts): Promise<Item[]> {
  const eventoId = String(evento_id);
  console.debug('[RPC] items_replace_for_event', { evento_id: eventoId, count: itens.length });

  // Validação preventiva: garantir que itens é array
  if (!Array.isArray(itens)) {
    throw new Error(`items_replace_for_event: payload não é array (recebido: ${typeof itens})`);
  }

  const { data, error } = await supabase.rpc('items_replace_for_event', {
    evento_id: eventoId,
    itens: itens as any // SDK serializa para JSONB
  });
  if (error) {
    console.error('[RPC] Erro em items_replace_for_event:', error);
    throw new Error(`Erro ao chamar items_replace_for_event: ${error.message}`);
  }
  return data as unknown as Item[];
}

async function distribution_bulk_upsert(
  evento_id: string,
  rows: DistributionRow[],
  opts?: Opts,
): Promise<DistributionRow[]> {
  const eventoId = String(evento_id);
  console.debug('[RPC] distribution_bulk_upsert', { evento_id: eventoId, count: rows.length });
  const { data, error } = await supabase.rpc('distribution_bulk_upsert', {
    evento_id: eventoId,
    rows: rows as any // SDK serializa para JSONB
  });
  if (error) {
    console.error('[RPC] Erro em distribution_bulk_upsert:', error);
    throw new Error(`Erro ao chamar distribution_bulk_upsert: ${error.message}`);
  }
  return data as unknown as DistributionRow[];
}

async function get_event_plan(evento_id: string, opts?: Opts): Promise<{
  evento: Event;
  itens: Item[];
  participantes: Participant[];
  distribuicao: DistributionRow[];
}> {
  const eventoId = String(evento_id);
  console.debug('[RPC] get_event_plan', { evento_id: eventoId });
  const { data, error } = await supabase.rpc('get_event_plan', { evento_id: eventoId });
  if (error) {
    console.error('[RPC] Erro em get_event_plan:', error);
    throw new Error(`Erro ao chamar get_event_plan: ${error.message}`);
  }
  return data as unknown as {
    evento: Event;
    itens: Item[];
    participantes: Participant[];
    distribuicao: DistributionRow[];
  };
}

async function get_distribution_summary(evento_id: string, opts?: Opts): Promise<{
  porParticipante: { participante_id: string; total: number }[];
  custoTotal: number;
}> {
  const eventoId = String(evento_id);
  console.debug('[RPC] get_distribution_summary', { evento_id: eventoId });
  const { data, error } = await supabase.rpc('get_distribution_summary', { evento_id: eventoId });
  if (error) {
    console.error('[RPC] Erro em get_distribution_summary:', error);
    throw new Error(`Erro ao chamar get_distribution_summary: ${error.message}`);
  }
  return data as unknown as {
    porParticipante: { participante_id: string; total: number }[];
    custoTotal: number;
  };
}

async function get_holiday_date_by_name(search_term: string): Promise<{ date: string; name: string } | null> {
  const { supabase } = await import('@/integrations/supabase/client');

  console.log('[RPC] get_holiday_date_by_name', { search_term });

  const { data, error } = await supabase.rpc('get_holiday_date_by_name', { search_term });

  if (error) {
    console.error('[RPC] Erro em get_holiday_date_by_name:', error);
    return null;
  }

  if (!data) return null;

  const result = data as any;
  if (Array.isArray(result) && result.length > 0) {
    return result[0] as { date: string; name: string };
  }
  return null;
}

export async function get_all_user_events(userId: string, opts?: { signal?: AbortSignal }): Promise<any[]> {
  const { supabase } = await import('@/integrations/supabase/client');

  console.log('[RPC] get_all_user_events', { userId });

  const { data, error } = await supabase.rpc('get_all_user_events', {
    user_id: userId,
    signal: opts?.signal
  });

  if (error) {
    console.error('[RPC] Erro em get_all_user_events:', error);
    return [];
  }

  if (!data) return [];

  return data as any[] || [];
}

export const rpc = {
  participants_bulk_upsert,
  items_replace_for_event,
  distribution_bulk_upsert,
  get_event_plan,
  get_distribution_summary,
  get_holiday_date_by_name,
  get_all_user_events,
};