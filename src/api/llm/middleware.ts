type CacheEntry = { content: string; toolCalls?: Array<{ name: string; arguments: Record<string, unknown> | unknown[] }>; ts: number };

const cache = new Map<string, CacheEntry>();
const rateWindowMs = 60_000;
const rateLimitPerUser = 10;
const userHits = new Map<string, number[]>();

export function maskPII(text: string): string {
  // Simples: remove e-mails e telefones
  return text
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b\+?\d{2,3}[\s-]?\d{3,5}[\s-]?\d{4,6}\b/g, '[phone]');
}

export function checkRateLimit(userId: string): { ok: boolean } {
  const now = Date.now();
  const arr = userHits.get(userId) || [];
  const recent = arr.filter((t) => now - t < rateWindowMs);
  recent.push(now);
  userHits.set(userId, recent);
  return { ok: recent.length <= rateLimitPerUser };
}

export function getIdempotent(key?: string): CacheEntry | undefined {
  if (!key) return undefined;
  const ent = cache.get(key);
  if (!ent) return undefined;
  if (Date.now() - ent.ts > 60_000) {
    cache.delete(key);
    return undefined;
  }
  return ent;
}

export function setIdempotent(key: string, value: CacheEntry) {
  cache.set(key, { ...value, ts: Date.now() });
}