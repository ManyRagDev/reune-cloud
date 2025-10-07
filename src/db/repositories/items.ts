import { lovableDb } from '@/db/lovableClient';
import { TBL } from '@/db/schema';
import type { Item } from '@/types/domain';

type Opts = { signal?: AbortSignal; idempotencyKey?: string };

const ensureClient = () => {
  if (!lovableDb) throw new Error('Lovable DB client não configurado (VITE_LOVABLE_DB_URL)');
  return lovableDb;
};

export async function listItemsByEvent(evento_id: string, opts?: { signal?: AbortSignal }): Promise<Item[]> {
  const client = ensureClient();
  const path = `${TBL.ITENS}?evento_id=${encodeURIComponent(evento_id)}&order=updated_at.desc`;
  console.debug(`[DB] ${TBL.ITENS} listItemsByEvent`, { evento_id });
  const res = await client.get<Item[]>(path, undefined);
  return Array.isArray(res) ? res : [];
}

export async function bulkUpsertItems(
  evento_id: string,
  itens: Item[],
  opts?: Opts,
): Promise<Item[]> {
  const client = ensureClient();
  const headers: Record<string, string> = {};
  if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  // Garantir evento_id em todos os itens
  const payload = itens.map((it) => ({ ...it, evento_id }));

  console.debug(`[DB] ${TBL.ITENS} bulkUpsertItems`, { evento_id, count: payload.length });
  // Preferência: endpoint batch com upsert por id (on conflict do update)
  const res = await client.post<Item[], Item[]>(`${TBL.ITENS}/bulk-upsert`, payload, headers);
  return Array.isArray(res) ? res : [];
}

export async function replaceItems(
  evento_id: string,
  itens: Item[],
  opts?: Opts,
): Promise<Item[]> {
  const client = ensureClient();
  const headers: Record<string, string> = {};
  if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  // Estratégia preferida: endpoint transacional único
  console.debug(`[DB] ${TBL.ITENS} replaceItems`, { evento_id, count: itens.length });
  const payload = { evento_id, itens };
  const res = await client.post<Item[], typeof payload>(`${TBL.ITENS}/replace`, payload, headers);
  return Array.isArray(res) ? res : [];
}