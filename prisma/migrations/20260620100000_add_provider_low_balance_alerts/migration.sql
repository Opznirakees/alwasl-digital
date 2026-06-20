CREATE TYPE "ProviderBalanceAlertStatus" AS ENUM ('OPEN', 'NOTIFIED', 'RESOLVED');

ALTER TABLE "provider_accounts" ADD COLUMN "lowBalanceThreshold" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "provider_balance_alerts" (
    "id" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "status" "ProviderBalanceAlertStatus" NOT NULL DEFAULT 'OPEN',
    "balance" INTEGER NOT NULL,
    "reservedBalance" INTEGER NOT NULL,
    "availableBalance" INTEGER NOT NULL,
    "threshold" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IQD',
    "message" TEXT NOT NULL,
    "channels" TEXT[],
    "whatsappPhone" TEXT,
    "whatsappMessageId" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_balance_alerts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "provider_balance_alerts_status_createdAt_idx" ON "provider_balance_alerts"("status", "createdAt");
CREATE INDEX "provider_balance_alerts_providerAccountId_status_idx" ON "provider_balance_alerts"("providerAccountId", "status");

ALTER TABLE "provider_balance_alerts" ADD CONSTRAINT "provider_balance_alerts_providerAccountId_fkey" FOREIGN KEY ("providerAccountId") REFERENCES "provider_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "provider_accounts" ADD CONSTRAINT "provider_accounts_low_balance_threshold_non_negative" CHECK ("lowBalanceThreshold" >= 0);
ALTER TABLE "provider_balance_alerts" ADD CONSTRAINT "provider_balance_alerts_balance_non_negative" CHECK ("balance" >= 0);
ALTER TABLE "provider_balance_alerts" ADD CONSTRAINT "provider_balance_alerts_reserved_balance_non_negative" CHECK ("reservedBalance" >= 0);
ALTER TABLE "provider_balance_alerts" ADD CONSTRAINT "provider_balance_alerts_available_balance_non_negative" CHECK ("availableBalance" >= 0);
ALTER TABLE "provider_balance_alerts" ADD CONSTRAINT "provider_balance_alerts_threshold_non_negative" CHECK ("threshold" >= 0);
