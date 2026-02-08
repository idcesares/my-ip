const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 60);

type Entry = { count: number; expiresAt: number };
const bucket = new Map<string, Entry>();

export function rateLimit(key: string) {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { allowed: true, retryAfter: 0 };
  }

  const now = Date.now();
  const current = bucket.get(key);

  if (!current || current.expiresAt <= now) {
    bucket.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfter: Math.ceil((current.expiresAt - now) / 1000),
    };
  }

  current.count += 1;
  bucket.set(key, current);
  return { allowed: true, retryAfter: 0 };
}