// Camada de API para UNE.Ai utilizando o cliente centralizado
import { lovableDb, lovableFunctions } from '@/db/lovableClient';
import type { ApiResult, Event } from '@/types/domain';

export async function listPublicEvents(): Promise<ApiResult<Event[]>> {
  if (!lovableDb) return { error: 'DB client não configurado' };
  try {
    const data = await lovableDb.get<Event[]>('/events/public');
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}

export async function invokeUneAiFunction(name: string, payload: unknown): Promise<ApiResult<unknown>> {
  if (!lovableFunctions) return { error: 'Functions client não configurado' };
  try {
    const data = await lovableFunctions.post<unknown, unknown>(`/functions/${name}`, payload);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido' };
  }
}