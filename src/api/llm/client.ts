import { lovableFunctions } from '@/db/lovableClient';
import { supabase } from '@/integrations/supabase/client';
import type { LlmMessage, LlmChatResponse } from '@/types/llm';

type PostInput = {
  messages: Array<LlmMessage>;
  systemPrompt?: string;
  temperature?: number;
  idempotencyKey?: string;
};

type Opts = { signal?: AbortSignal };

export class LlmHttpError extends Error {
  status?: number;
  code: 'unauthorized' | 'forbidden' | 'rate_limit' | 'server_error' | 'bad_request' | 'network_error' | 'unknown';
  constructor(message: string, code: LlmHttpError['code'], status?: number) {
    super(message);
    this.name = 'LlmHttpError';
    this.code = code;
    this.status = status;
  }
}

async function getAuthToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new LlmHttpError(`Auth error: ${error.message}`, 'unauthorized');
  const token = data.session?.access_token;
  if (!token) throw new LlmHttpError('Usuário não autenticado (token ausente)', 'unauthorized', 401);
  return token;
}

export async function postLlmChat(input: PostInput, opts?: Opts): Promise<LlmChatResponse> {
  const started = performance.now();
  const baseUrl = import.meta.env.VITE_LOVABLE_FUNCTIONS_URL as string | undefined;
  if (!baseUrl) throw new LlmHttpError('VITE_LOVABLE_FUNCTIONS_URL não configurado', 'bad_request');

  const urlPath = '/llm-chat';
  const token = await getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  if (input.idempotencyKey) headers['Idempotency-Key'] = input.idempotencyKey;

  const body = {
    messages: input.messages,
    systemPrompt: input.systemPrompt,
    temperature: input.temperature ?? 0.2,
  };

  try {
    console.debug('[LLM] POST /llm-chat', { url: `${baseUrl.replace(/\/$/, '')}${urlPath}`, idempotencyKey: input.idempotencyKey });
    // Preferir cliente centralizado se disponível
    const client = lovableFunctions;
    let response: LlmChatResponse;
    if (client) {
      response = await client.post<LlmChatResponse, typeof body>(urlPath, body, headers);
    } else {
      const fullUrl = `${baseUrl.replace(/\/$/, '')}${urlPath}`;
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: opts?.signal,
      });
      if (!res.ok) {
        let msg = '';
        let code: LlmHttpError['code'] = 'unknown';
        try {
          const json = await res.json();
          if (json && json.error) {
            msg = json.error.message || res.statusText;
            const serverCode = String(json.error.code || '').toLowerCase();
            if (serverCode === 'unauthorized') code = 'unauthorized';
            else if (serverCode === 'forbidden') code = 'forbidden';
            else if (serverCode === 'rate_limit') code = 'rate_limit';
            else if (serverCode === 'bad_request') code = 'bad_request';
            else if (serverCode === 'server_error') code = 'server_error';
          } else {
            msg = json?.message || res.statusText;
          }
        } catch {
          const text = await res.text().catch(() => '');
          msg = text || res.statusText;
        }
        if (res.status === 401) throw new LlmHttpError(`Não autorizado: ${msg}`, 'unauthorized', 401);
        if (res.status === 403) throw new LlmHttpError(`Acesso negado: ${msg}`, 'forbidden', 403);
        if (res.status === 429) throw new LlmHttpError(`Rate limit excedido: ${msg}`, 'rate_limit', 429);
        if (res.status >= 500) throw new LlmHttpError(`Erro no servidor: ${msg}`, 'server_error', res.status);
        throw new LlmHttpError(`Erro HTTP ${res.status}: ${msg}`, code !== 'unknown' ? code : 'unknown', res.status);
      }
      response = (await res.json()) as LlmChatResponse;
    }
    const duration = Math.round(performance.now() - started);
    console.debug('[LLM] ok', { route: '/llm-chat', duration_ms: duration, idempotencyKey: input.idempotencyKey });
    return response;
  } catch (e) {
    const duration = Math.round(performance.now() - started);
    console.debug('[LLM] fail', { route: '/llm-chat', duration_ms: duration, idempotencyKey: input.idempotencyKey });
    if (e instanceof LlmHttpError) throw e;
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new LlmHttpError('Requisição abortada', 'network_error');
    }
    if (e instanceof Error) {
      // Mapear mensagens comuns
      const msg = e.message || 'Erro desconhecido';
      if (/401|unauthorized/i.test(msg)) throw new LlmHttpError(msg, 'unauthorized', 401);
      if (/403|forbidden/i.test(msg)) throw new LlmHttpError(msg, 'forbidden', 403);
      if (/429|rate limit/i.test(msg)) throw new LlmHttpError(msg, 'rate_limit', 429);
      if (/5\d\d|server/i.test(msg)) throw new LlmHttpError(msg, 'server_error');
      throw new LlmHttpError(msg, 'unknown');
    }
    throw new LlmHttpError('Erro de rede ao chamar LLM', 'network_error');
  }
}