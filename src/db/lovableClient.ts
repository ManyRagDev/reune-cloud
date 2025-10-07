// Centralizado: cliente HTTP para Lovable Cloud (DB e Functions)
// Observação: em ambiente Vite, variáveis devem ser prefixadas com VITE_
// Ex.: VITE_LOVABLE_DB_URL, VITE_LOVABLE_FUNCTIONS_URL

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface LovableClientOptions {
  baseUrl: string;
  apiKey?: string;
  defaultHeaders?: Record<string, string>;
}

export interface RequestOptions<TBody = unknown> {
  path: string;
  method?: HttpMethod;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export const createLovableClient = (opts: LovableClientOptions) => {
  const { baseUrl, apiKey, defaultHeaders } = opts;

  if (!baseUrl) {
    throw new Error('LovableClient: baseUrl é obrigatório. Configure VITE_LOVABLE_* no .env');
  }

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(defaultHeaders || {}),
  };
  if (apiKey) baseHeaders['Authorization'] = `Bearer ${apiKey}`;

  const request = async <TResponse = unknown, TBody = unknown>(options: RequestOptions<TBody>): Promise<TResponse> => {
    const { path, method = 'GET', body, headers, signal } = options;
    const url = path.startsWith('http') ? path : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    const res = await fetch(url, {
      method,
      headers: { ...baseHeaders, ...(headers || {}) },
      body: body != null && method !== 'GET' ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`LovableClient error ${res.status}: ${text || res.statusText}`);
    }

    // Tentar parsear JSON; se falhar, retornar texto
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as TResponse;
    }
    return (await res.text()) as unknown as TResponse;
  };

  return {
    request,
    get: <TResponse = unknown>(path: string, headers?: Record<string, string>) =>
      request<TResponse>({ path, method: 'GET', headers }),
    post: <TResponse = unknown, TBody = unknown>(path: string, body?: TBody, headers?: Record<string, string>) =>
      request<TResponse, TBody>({ path, method: 'POST', body, headers }),
    put: <TResponse = unknown, TBody = unknown>(path: string, body?: TBody, headers?: Record<string, string>) =>
      request<TResponse, TBody>({ path, method: 'PUT', body, headers }),
    patch: <TResponse = unknown, TBody = unknown>(path: string, body?: TBody, headers?: Record<string, string>) =>
      request<TResponse, TBody>({ path, method: 'PATCH', body, headers }),
    delete: <TResponse = unknown>(path: string, headers?: Record<string, string>) =>
      request<TResponse>({ path, method: 'DELETE', headers }),
  };
};

// Instâncias padrão com variáveis de ambiente (prefixo VITE_)
const DB_URL = import.meta.env.VITE_LOVABLE_DB_URL as string | undefined;
const FUNCTIONS_URL = import.meta.env.VITE_LOVABLE_FUNCTIONS_URL as string | undefined;
const APP_ENV = (import.meta.env.VITE_APP_ENV as string | undefined) || 'dev';

export const lovableDb = DB_URL
  ? createLovableClient({ baseUrl: DB_URL })
  : undefined;

export const lovableFunctions = FUNCTIONS_URL
  ? createLovableClient({ baseUrl: FUNCTIONS_URL })
  : undefined;

export const isProd = APP_ENV === 'prod';