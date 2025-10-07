import { supabase } from '@/integrations/supabase/client';
import type { Item, Participant, DistributionRow, Event } from '@/types/domain';

type Opts = { signal?: AbortSignal; idempotencyKey?: string };

const callRpc = async (name: string, params: unknown, opts?: Opts) => {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    console.error(`[RPC] Erro em ${name}:`, error);
    throw new Error(`Erro ao chamar a função ${name}: ${error.message}`);
  }
  return data;
};

async function participants_bulk_upsert(
  evento_id: string,
  participantes: Participant[],
  opts?: Opts,
): Promise<Participant[]> {
  console.debug('[RPC] participants_bulk_upsert', { evento_id, count: participantes.length });
  return await callRpc('participants_bulk_upsert', { evento_id: evento_id, participantes: JSON.stringify(participantes) });
}

async function items_replace_for_event(evento_id: string, itens: Item[], opts?: Opts): Promise<Item[]> {
  console.debug('[RPC] items_replace_for_event', { evento_id, count: itens.length });
  return await callRpc('items_replace_for_event', { evento_id: evento_id, itens: JSON.stringify(itens) });
}

async function distribution_bulk_upsert(
  evento_id: string,
  rows: DistributionRow[],
  opts?: Opts,
): Promise<DistributionRow[]> {
  console.debug('[RPC] distribution_bulk_upsert', { evento_id, count: rows.length });
  return await callRpc('distribution_bulk_upsert', { evento_id: evento_id, rows: JSON.stringify(rows) });
}

async function get_event_plan(evento_id: string, opts?: Opts): Promise<{
  evento: Event;
  itens: Item[];
  participantes: Participant[];
  distribuicao: DistributionRow[];
}> {
  console.debug('[RPC] get_event_plan', { evento_id });
  return await callRpc('get_event_plan', { evento_id: evento_id });
}

async function get_distribution_summary(evento_id: string, opts?: Opts): Promise<{
  porParticipante: { participante_id: string; total: number }[];
  custoTotal: number;
}> {
  console.debug('[RPC] get_distribution_summary', { evento_id });
  return await callRpc('get_distribution_summary', { evento_id: evento_id });
}

export const rpc = {
  participants_bulk_upsert,
  items_replace_for_event,
  distribution_bulk_upsert,
  get_event_plan,
  get_distribution_summary,
};