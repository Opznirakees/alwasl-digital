CREATE TYPE "ProviderService" AS ENUM ('WAHO_TOP_UP', 'PAYMENT');
CREATE TYPE "ProviderAccountType" AS ENUM ('WAHO_API', 'WAHA_WHATSAPP', 'MOCK');
CREATE TYPE "ProviderAccountStatus" AS ENUM ('ONLINE', 'DEGRADED', 'OFFLINE');

CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "service" "ProviderService" NOT NULL DEFAULT 'WAHO_TOP_UP',
    "apiEndpoint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "supportedProducts" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "provider_accounts" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProviderAccountType" NOT NULL,
    "apiEndpoint" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "fallbackEnabled" BOOLEAN NOT NULL DEFAULT true,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "reservedBalance" INTEGER NOT NULL DEFAULT 0,
    "minBalance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "dailyLimit" INTEGER,
    "dailyUsed" INTEGER NOT NULL DEFAULT 0,
    "successRate" INTEGER NOT NULL DEFAULT 100,
    "avgResponseTimeMs" INTEGER NOT NULL DEFAULT 0,
    "status" "ProviderAccountStatus" NOT NULL DEFAULT 'OFFLINE',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastHealthCheck" TIMESTAMP(3),
    "lastFailureAt" TIMESTAMP(3),
    "supportedProducts" TEXT[],
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_accounts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "provider_requests" ADD COLUMN "providerAccountId" TEXT;

CREATE UNIQUE INDEX "providers_code_key" ON "providers"("code");
CREATE INDEX "providers_service_isActive_priority_idx" ON "providers"("service", "isActive", "priority");
CREATE INDEX "provider_accounts_providerId_isActive_status_priority_idx" ON "provider_accounts"("providerId", "isActive", "status", "priority");
CREATE INDEX "provider_accounts_isActive_status_priority_idx" ON "provider_accounts"("isActive", "status", "priority");
CREATE INDEX "provider_requests_providerAccountId_createdAt_idx" ON "provider_requests"("providerAccountId", "createdAt");

ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "provider_requests" ADD CONSTRAINT "provider_requests_providerAccountId_fkey" FOREIGN KEY ("providerAccountId") REFERENCES "provider_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "providers" ADD CONSTRAINT "providers_priority_positive" CHECK ("priority" >= 1);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_priority_positive" CHECK ("priority" >= 1);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_balance_non_negative" CHECK ("balance" >= 0);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_reserved_balance_non_negative" CHECK ("reservedBalance" >= 0);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_reserved_balance_not_above_balance" CHECK ("reservedBalance" <= "balance");
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_min_balance_non_negative" CHECK ("minBalance" >= 0);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_daily_limit_non_negative" CHECK ("dailyLimit" IS NULL OR "dailyLimit" >= 0);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_daily_used_non_negative" CHECK ("dailyUsed" >= 0);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_success_rate_range" CHECK ("successRate" >= 0 AND "successRate" <= 100);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_avg_response_non_negative" CHECK ("avgResponseTimeMs" >= 0);
ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_failure_count_non_negative" CHECK ("failureCount" >= 0);
