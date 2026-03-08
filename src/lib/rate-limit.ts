const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 60);
const MAX_BUCKET_SIZE = 5_000;
const CLEANUP_INTERVAL_MS = 30_000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
  limit: number;
  remaining: number;
  resetAt: number;
}

type Entry = { count: number; expiresAt: number };
const bucket = new Map<string, Entry>();
let lastCleanupAt = 0;

function normalizeKey(input: string): string {
  const key = input.trim().toLowerCase();
  return key || "unknown";
}

function pruneExpired(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS && bucket.size < MAX_BUCKET_SIZE) {
    return;
  }

  for (const [key, entry] of bucket.entries()) {
    if (entry.expiresAt <= now) {
      bucket.delete(key);
    }
  }

  if (bucket.size > MAX_BUCKET_SIZE) {
    // Map iterates in insertion order — oldest entries first. Delete
    // the excess without sorting the entire bucket (O(k) vs O(n log n)).
    const excess = bucket.size - MAX_BUCKET_SIZE;
    let deleted = 0;
    for (const key of bucket.keys()) {
      if (deleted >= excess) break;
      bucket.delete(key);
      deleted++;
    }
  }

  lastCleanupAt = now;
}

export function rateLimit(key: string): RateLimitResult {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { allowed: true, retryAfter: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS, resetAt: 0 };
  }

  const now = Date.now();
  pruneExpired(now);

  const normalized = normalizeKey(key);
  const current = bucket.get(normalized);

  if (!current || current.expiresAt <= now) {
    const expiresAt = now + WINDOW_MS;
    bucket.set(normalized, { count: 1, expiresAt });
    return { allowed: true, retryAfter: 0, limit: MAX_REQUESTS, remaining: MAX_REQUESTS - 1, resetAt: expiresAt };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.expiresAt - now) / 1000),
      limit: MAX_REQUESTS,
      remaining: 0,
      resetAt: current.expiresAt,
    };
  }

  current.count += 1;
  bucket.set(normalized, current);
  return {
    allowed: true,
    retryAfter: 0,
    limit: MAX_REQUESTS,
    remaining: MAX_REQUESTS - current.count,
    resetAt: current.expiresAt,
  };
}
