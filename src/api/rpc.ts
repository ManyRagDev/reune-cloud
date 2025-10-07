import { supabase } from '@/integrations/supabase/client';
import type { Item, Participant, DistributionRow, Event } from '@/types/domain';

type Opts = { signal?: AbortSignal; idempotencyKey?: string };

async function participants_bulk_upsert(
  evento_id: string,
  participantes: Participant[],
  opts?: Opts,
): Promise<Participant[]> {
  console.debug('[RPC] participants_bulk_upsert', { evento_id, count: participantes.length });
  const { data, error } = await supabase.rpc('participants_bulk_upsert', { 
    evento_id: evento_id, 
    participantes: JSON.stringify(participantes) 
  });
  if (error) {
    console.error('[RPC] Erro em participants_bulk_upsert:', error);
    throw new Error(`Erro ao chamar participants_bulk_upsert: ${error.message}`);
  }
  return data as unknown as Participant[];
}

async function items_replace_for_event(evento_id: string, itens: Item[], opts?: Opts): Promise<Item[]> {
  console.debug('[RPC] items_replace_for_event', { evento_id, count: itens.length });
  const { data, error } = await supabase.rpc('items_replace_for_event', { 
    evento_id: evento_id, 
    itens: JSON.stringify(itens) 
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
  console.debug('[RPC] distribution_bulk_upsert', { evento_id, count: rows.length });
  const { data, error } = await supabase.rpc('distribution_bulk_upsert', { 
    evento_id: evento_id, 
    rows: JSON.stringify(rows) 
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
  console.debug('[RPC] get_event_plan', { evento_id });
  const { data, error } = await supabase.rpc('get_event_plan', { evento_id: evento_id });
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
  console.debug('[RPC] get_distribution_summary', { evento_id });
  const { data, error } = await supabase.rpc('get_distribution_summary', { evento_id: evento_id });
  if (error) {
    console.error('[RPC] Erro em get_distribution_summary:', error);
    throw new Error(`Erro ao chamar get_distribution_summary: ${error.message}`);
  }
  return data as unknown as {
    porParticipante: { participante_id: string; total: number }[];
    custoTotal: number;
  };
}

export const rpc = {
  participants_bulk_upsert,
  items_replace_for_event,
  distribution_bulk_upsert,
  get_event_plan,
  get_distribution_summary,
};