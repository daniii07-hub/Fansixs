import type {
  CachedRouteEntry,
  RouteEngineSuccess,
} from "./types";

const cache = new Map<
  string,
  CachedRouteEntry
>();

const DEFAULT_TTL_MS =
  1000 * 60 * 30;

export function createRouteCacheKey(
  value: unknown,
) {
  return JSON.stringify(value);
}

export function getCachedRoute(
  key: string,
): RouteEngineSuccess | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (
    new Date(entry.expiresAt).getTime() <
    Date.now()
  ) {
    cache.delete(key);
    return null;
  }

  return entry.result;
}

export function setCachedRoute(
  key: string,
  result: RouteEngineSuccess,
  ttlMs = DEFAULT_TTL_MS,
) {
  cache.set(key, {
    key,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(
      Date.now() + ttlMs,
    ).toISOString(),
    result: {
      ...result,
      cacheHit: true,
    },
  });
}

export function clearRouteCache() {
  cache.clear();
}

export function pruneRouteCache() {
  const now = Date.now();

  for (const [key, entry] of cache) {
    if (
      new Date(
        entry.expiresAt,
      ).getTime() < now
    ) {
      cache.delete(key);
    }
  }
}

export function getRouteCacheSize() {
  return cache.size;
}