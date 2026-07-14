import type { DetectedType, VerificationResult } from "@/lib/types";

const TTL_MS = 60 * 60 * 1000; // 1 hour

interface CacheEntry {
  data: VerificationResult;
  expiresAt: number;
}

/**
 * Module-level singleton Map.
 * In Next.js App Router each worker process keeps this alive across requests
 * for the lifetime of the server process (good enough for a stateless MVP).
 */
const store = new Map<string, CacheEntry>();

/** Evict all expired entries (called lazily on every read) */
function evictExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

/** Build the canonical cache key */
export function cacheKey(type: DetectedType, normalizedInput: string): string {
  return `${type}:${normalizedInput}`;
}

/** Return the cached result, or undefined if absent / expired */
export function getCached(key: string): VerificationResult | undefined {
  evictExpired(); // lazy cleanup
  const entry = store.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.data;
}

/**
 * Store a successful verification result.
 * Only call this when the lookup succeeded — don't cache errors or "not found".
 */
export function setCached(key: string, data: VerificationResult): void {
  store.set(key, { data, expiresAt: Date.now() + TTL_MS });
}

/** Manually flush the entire cache (useful for testing) */
export function clearCache(): void {
  store.clear();
}

/** Return current cache size (for diagnostics) */
export function cacheSize(): number {
  return store.size;
}
