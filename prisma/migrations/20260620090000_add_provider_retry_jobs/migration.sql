CREATE TYPE "ProviderRetryJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "ProviderRetryJobType" AS ENUM ('CREATE_TOPUP', 'STATUS_POLL');

CREATE TABLE "provider_retry_jobs" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "providerAccountId" TEXT,
    "type" "ProviderRetryJobType" NOT NULL,
    "status" "ProviderRetryJobStatus" NOT NULL DEFAULT 'PENDING',
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "payload" JSONB,
    "resultPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_retry_jobs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "provider_retry_jobs_status_nextRunAt_idx" ON "provider_retry_jobs"("status", "nextRunAt");
CREATE INDEX "provider_retry_jobs_orderId_status_idx" ON "provider_retry_jobs"("orderId", "status");
CREATE INDEX "provider_retry_jobs_providerAccountId_status_idx" ON "provider_retry_jobs"("providerAccountId", "status");

ALTER TABLE "provider_retry_jobs" ADD CONSTRAINT "provider_retry_jobs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_retry_jobs" ADD CONSTRAINT "provider_retry_jobs_providerAccountId_fkey" FOREIGN KEY ("providerAccountId") REFERENCES "provider_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "provider_retry_jobs" ADD CONSTRAINT "provider_retry_jobs_attempt_count_non_negative" CHECK ("attemptCount" >= 0);
ALTER TABLE "provider_retry_jobs" ADD CONSTRAINT "provider_retry_jobs_max_attempts_positive" CHECK ("maxAttempts" > 0);
ALTER TABLE "provider_retry_jobs" ADD CONSTRAINT "provider_retry_jobs_attempt_count_not_above_max" CHECK ("attemptCount" <= "maxAttempts");
