-- Central access controls
CREATE TYPE "AccessBlockType" AS ENUM ('WHATSAPP', 'WAHO_ID', 'IP_ADDRESS');
CREATE TYPE "PrimaryPriceCurrency" AS ENUM ('IQD', 'USD', 'LOCAL');

ALTER TYPE "StaffPermission" ADD VALUE IF NOT EXISTS 'CONTENT_MANAGE';
ALTER TYPE "WhatsAppNotificationType" ADD VALUE IF NOT EXISTS 'ORDER_CREATED';
ALTER TYPE "WhatsAppNotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNT_BLOCKED';

CREATE TABLE "access_blocks" (
    "id" TEXT NOT NULL,
    "type" "AccessBlockType" NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "maskedValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "userId" TEXT,
    "createdByAdminId" TEXT NOT NULL,
    "revokedByAdminId" TEXT,
    "notificationRequested" BOOLEAN NOT NULL DEFAULT false,
    "notificationStatus" "WhatsAppNotificationStatus",
    "notifiedAt" TIMESTAMP(3),
    "notificationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_blocks_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "access_blocks_value_not_empty" CHECK (length(trim("normalizedValue")) > 0),
    CONSTRAINT "access_blocks_reason_not_empty" CHECK (length(trim("reason")) >= 3)
);

CREATE UNIQUE INDEX "access_blocks_type_normalizedValue_key"
    ON "access_blocks"("type", "normalizedValue");
CREATE INDEX "access_blocks_type_isActive_expiresAt_idx"
    ON "access_blocks"("type", "isActive", "expiresAt");
CREATE INDEX "access_blocks_userId_isActive_idx"
    ON "access_blocks"("userId", "isActive");
CREATE INDEX "access_blocks_createdByAdminId_createdAt_idx"
    ON "access_blocks"("createdByAdminId", "createdAt");

ALTER TABLE "access_blocks"
    ADD CONSTRAINT "access_blocks_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "access_blocks"
    ADD CONSTRAINT "access_blocks_createdByAdminId_fkey"
    FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "access_blocks"
    ADD CONSTRAINT "access_blocks_revokedByAdminId_fkey"
    FOREIGN KEY ("revokedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_notifications" ADD COLUMN "accessBlockId" TEXT;
CREATE INDEX "whatsapp_notifications_accessBlockId_createdAt_idx"
    ON "whatsapp_notifications"("accessBlockId", "createdAt");
ALTER TABLE "whatsapp_notifications"
    ADD CONSTRAINT "whatsapp_notifications_accessBlockId_fkey"
    FOREIGN KEY ("accessBlockId") REFERENCES "access_blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Per-country price display policy
ALTER TABLE "countries"
    ADD COLUMN "nameZh" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "primaryPriceCurrency" "PrimaryPriceCurrency" NOT NULL DEFAULT 'LOCAL',
    ADD COLUMN "showPricesInIqd" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "showPricesInUsd" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "showPricesInLocal" BOOLEAN NOT NULL DEFAULT true;

UPDATE "countries"
SET
    "nameZh" = CASE WHEN "nameZh" = '' THEN "name" ELSE "nameZh" END,
    "primaryPriceCurrency" = CASE WHEN "currencyCode" = 'IQD' THEN 'IQD'::"PrimaryPriceCurrency" ELSE "primaryPriceCurrency" END;

INSERT INTO "currencies" (
    "code", "name", "symbol", "decimalPlaces", "isActive", "createdAt", "updatedAt"
) VALUES
    ('IQD', 'Iraqi Dinar', 'د.ع', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('USD', 'US Dollar', '$', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "symbol" = EXCLUDED."symbol",
    "decimalPlaces" = EXCLUDED."decimalPlaces",
    "isActive" = true,
    "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "exchange_rates" (
    "id", "baseCurrencyCode", "quoteCurrencyCode", "rate", "isActive",
    "source", "note", "createdAt", "updatedAt"
) VALUES (
    'seed-iqd-usd-rate', 'IQD', 'USD', 0.00076300, true,
    'manual', 'Initial administrative rate; review before enabling USD display',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("baseCurrencyCode", "quoteCurrencyCode") DO NOTHING;

-- Runtime-managed site copy
CREATE TABLE "content_overrides" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "valueEn" TEXT NOT NULL,
    "valueAr" TEXT NOT NULL,
    "valueZh" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_overrides_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "content_overrides_key_not_empty" CHECK (length(trim("key")) > 0)
);

CREATE UNIQUE INDEX "content_overrides_key_key" ON "content_overrides"("key");
CREATE INDEX "content_overrides_module_isActive_idx"
    ON "content_overrides"("module", "isActive");
CREATE INDEX "content_overrides_updatedByAdminId_updatedAt_idx"
    ON "content_overrides"("updatedByAdminId", "updatedAt");

ALTER TABLE "content_overrides"
    ADD CONSTRAINT "content_overrides_updatedByAdminId_fkey"
    FOREIGN KEY ("updatedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
