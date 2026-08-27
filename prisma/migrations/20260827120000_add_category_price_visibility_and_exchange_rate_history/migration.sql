CREATE TYPE "CategoryPriceVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED');

ALTER TABLE "catalog_categories"
ADD COLUMN "priceVisibility" "CategoryPriceVisibility" NOT NULL DEFAULT 'AUTHENTICATED';

UPDATE "catalog_categories"
SET "priceVisibility" = 'PUBLIC'
WHERE "slug" = 'asiacell';

ALTER TABLE "exchange_rates"
  ADD COLUMN "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
  ADD COLUMN "effectiveUntil" TIMESTAMP(3);

UPDATE "exchange_rates"
SET "effectiveFrom" = LEAST(
  date_trunc('minute', "updatedAt"),
  date_trunc('minute', CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
);

DROP INDEX "exchange_rates_baseCurrencyCode_quoteCurrencyCode_key";

CREATE UNIQUE INDEX "exchange_rates_baseCurrencyCode_quoteCurrencyCode_effectiveFrom_key"
ON "exchange_rates"("baseCurrencyCode", "quoteCurrencyCode", "effectiveFrom");

CREATE INDEX "exchange_rates_isActive_effectiveFrom_effectiveUntil_idx"
ON "exchange_rates"("isActive", "effectiveFrom", "effectiveUntil");

ALTER TABLE "exchange_rates"
ADD CONSTRAINT "exchange_rates_effective_window_check"
CHECK ("effectiveUntil" IS NULL OR "effectiveUntil" > "effectiveFrom");

UPDATE "banners"
SET
  "subtitle" = 'Choose WAHO or Asiacell, compare available prices, and log in with WhatsApp to order.',
  "subtitleAr" = 'اختر واهو أو آسيا سيل وقارن الأسعار المتاحة ثم سجل الدخول عبر واتساب للطلب.',
  "updatedAt" = CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
WHERE
  "id" = 'banner-1'
  AND "subtitle" = 'Choose WAHO or Asiacell, log in with WhatsApp, and see the price for your country.';
