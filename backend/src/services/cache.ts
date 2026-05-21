/**
 * Simple in-memory TTL cache backed by node-cache.
 * Each API service uses a named cache with its own TTL.
 */
import NodeCache from 'node-cache';

const caches: Map<string, NodeCache> = new Map();

export function getCache(name: string, ttlSeconds: number): NodeCache {
  if (!caches.has(name)) {
    caches.set(name, new NodeCache({ stdTTL: ttlSeconds, checkperiod: Math.ceil(ttlSeconds / 2) }));
  }
  return caches.get(name)!;
}

export async function withCache<T>(
  cache: NodeCache,
  key: string,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;
  const fresh = await fetcher();
  cache.set(key, fresh);
  return fresh;
}
