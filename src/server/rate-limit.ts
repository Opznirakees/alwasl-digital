import { prisma } from './prisma';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitRow {
  count: number;
  resetAt: Date;
}

export function isRateLimitExceeded(count: number, limit: number) {
  return count > limit;
}

export async function assertRateLimit(key: string, options: RateLimitOptions) {
  const resetAt = new Date(Date.now() + options.windowMs);

  const [bucket] = await prisma.$queryRaw<RateLimitRow[]>`
    INSERT INTO "rate_limits" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, NOW())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "rate_limits"."resetAt" <= NOW() THEN 1
        ELSE "rate_limits"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "rate_limits"."resetAt" <= NOW() THEN ${resetAt}
        ELSE "rate_limits"."resetAt"
      END,
      "updatedAt" = NOW()
    RETURNING "count", "resetAt"
  `;

  if (!bucket || isRateLimitExceeded(bucket.count, options.limit)) {
    throw new Error('RATE_LIMITED');
  }
}
