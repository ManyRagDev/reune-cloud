import { lovableDb } from '@/db/lovableClient';
import { TBL } from '@/db/schema';
import type { Event, EventStatus } from '@/types/domain';

type Opts = { signal?: AbortSignal; idempotencyKey?: string };

const ensureClient = () => {
  if (!lovableDb) throw new Error('Lovable DB client não configurado (VITE_LOVABLE_DB_URL)');
  return lovableDb;
};

// Observação: Ajuste os caminhos conforme a API REST da Lovable/Supabase que você expõe via Functions.
// Aqui assumimos endpoints RESTful por coleção.

export async function findDraftEventByUser(usuario_id: string, opts?: { signal?: AbortSignal }): Promise<Event | null> {
  const client = ensureClient();
  const statusList: EventStatus[] = ['collecting_core', 'itens_pendentes_confirmacao', 'distrib_pendente_confirmacao'];
  const params = new URLSearchParams({ usuario_id });
  statusList.forEach((s) => params.append('status', s));

  const path = `${TBL.EVENTOS}?${params.toString()}&order=updated_at.desc&limit=1`;
  console.debug(`[DB] ${TBL.EVENTOS} findDraftEventByUser`, { usuario_id });
  const res = await client.get<Event[] | null>(path, undefined);
  if (!res || (Array.isArray(res) && res.length === 0)) return null;
  return Array.isArray(res) ? res[0] : null;
}

export async function upsertEvent(
  event: Partial<Event> & { usuario_id: string },
  opts?: Opts,
): Promise<Event> {
  const client = ensureClient();
  const headers: Record<string, string> = {};
  if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  // Preferir upsert nativo: on conflict (id) do update
  // Se tiver id, PATCH no recurso; senão POST com defaults
  const payload: Partial<Event> = {
    status: event.status ?? 'collecting_core',
    ...event,
  };

  console.debug(`[DB] ${TBL.EVENTOS} upsertEvent`, { hasId: !!event.id });
  if (event.id) {
    const path = `${TBL.EVENTOS}/${event.id}`;
    const res = await client.patch<Event, Partial<Event>>(path, payload, headers);
    return res as Event;
  }
  const res = await client.post<Event, Partial<Event>>(TBL.EVENTOS, payload, headers);
  return res as Event;
}

export async function setEventStatus(
  evento_id: string,
  status: EventStatus,
  opts?: Opts,
): Promise<void> {
  const client = ensureClient();
  const headers: Record<string, string> = {};
  if (opts?.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;
  console.debug(`[DB] ${TBL.EVENTOS} setEventStatus`, { evento_id, status });
  await client.patch(`${TBL.EVENTOS}/${evento_id}`, { status }, headers);
}

export async function getEventById(evento_id: string, opts?: { signal?: AbortSignal }): Promise<Event | null> {
  const client = ensureClient();
  console.debug(`[DB] ${TBL.EVENTOS} getEventById`, { evento_id });
  const res = await client.get<Event | null>(`${TBL.EVENTOS}/${evento_id}`, undefined);
  return res ?? null;
}