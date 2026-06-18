const buckets = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function assertRateLimit(key: string, options: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return;
  }

  if (existing.count >= options.limit) {
    throw new Error('RATE_LIMITED');
  }

  existing.count += 1;
}
