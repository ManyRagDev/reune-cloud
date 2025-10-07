// Utilitário de Idempotência para requisições/ações no cliente
// Permite evitar duplicação de efeitos, usando header `Idempotency-Key` e cache leve

export type StorageKind = 'memory' | 'local' | 'session';

export interface IdempotencyOptions {
  key?: string;
  ttlMs?: number; // tempo de validade do cache
  storage?: StorageKind;
}

const memoryCache = new Map<string, { expiresAt: number; value: unknown }>();

export const generateIdempotencyKey = (): string => {
  const randomUUIDFn = typeof globalThis.crypto?.randomUUID === 'function' ? globalThis.crypto.randomUUID : undefined;
  if (randomUUIDFn) return randomUUIDFn();
  return `idemp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const getStore = (kind: StorageKind) => {
  if (kind === 'local') return globalThis.localStorage;
  if (kind === 'session') return globalThis.sessionStorage;
  return undefined; // memory
};

const getCacheKey = (key: string) => `UNEAI_IDEMP_${key}`;

export async function withIdempotent<T>(fn: () => Promise<T>, options: IdempotencyOptions = {}): Promise<T> {
  const {
    key = generateIdempotencyKey(),
    ttlMs = 30_000,
    storage = 'memory',
  } = options;

  const store = getStore(storage);
  const k = getCacheKey(key);

  // Tentativa de recuperar valor no cache
  try {
    if (store) {
      const raw = store.getItem(k);
      if (raw) {
        const parsed = JSON.parse(raw) as { expiresAt: number; value: unknown };
        if (Date.now() < parsed.expiresAt) return parsed.value as T;
        store.removeItem(k);
      }
    } else if (memoryCache.has(k)) {
      const entry = memoryCache.get(k)!;
      if (Date.now() < entry.expiresAt) return entry.value as T;
      memoryCache.delete(k);
    }
  } catch {
    // ignora erros de storage
  }

  // Executa função e armazena
  const result = await fn();
  const payload = { expiresAt: Date.now() + ttlMs, value: result };
  try {
    if (store) store.setItem(k, JSON.stringify(payload));
    else memoryCache.set(k, payload);
  } catch {
    // storage pode falhar por quota
  }
  return result;
}

export interface IdempotentFetchOptions extends IdempotencyOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

// Helper para fetch com cabeçalho Idempotency-Key
export async function idempotentFetch<T = unknown>(url: string, opts: IdempotentFetchOptions = {}): Promise<T> {
  const { key = generateIdempotencyKey(), ttlMs, storage, method = 'POST', body, headers } = opts;
  const fingerprintBase = `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
  const cacheKey = `${key}:${fingerprintBase}`;

  return withIdempotent(async () => {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': key,
        ...(headers || {}),
      },
      body: body != null && method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`idempotentFetch error ${res.status}: ${text || res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  }, { key: cacheKey, ttlMs, storage });
}