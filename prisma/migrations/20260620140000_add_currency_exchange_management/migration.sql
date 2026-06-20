CREATE TABLE "currencies" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code"),
    CONSTRAINT "currencies_code_format_check" CHECK ("code" ~ '^[A-Z]{3,8}$'),
    CONSTRAINT "currencies_decimal_places_check" CHECK ("decimalPlaces" >= 0 AND "decimalPlaces" <= 4)
);

CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "phoneCode" TEXT NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "countries_code_key" UNIQUE ("code"),
    CONSTRAINT "countries_code_format_check" CHECK ("code" ~ '^[A-Z]{2}$'),
    CONSTRAINT "countries_phone_code_format_check" CHECK ("phoneCode" ~ '^\+[1-9][0-9]{0,5}$')
);

CREATE TABLE "exchange_rates" (
    "id" TEXT NOT NULL,
    "baseCurrencyCode" TEXT NOT NULL,
    "quoteCurrencyCode" TEXT NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "updatedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exchange_rates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "exchange_rates_rate_positive_check" CHECK ("rate" > 0),
    CONSTRAINT "exchange_rates_currency_pair_distinct_check" CHECK ("baseCurrencyCode" <> "quoteCurrencyCode")
);

CREATE INDEX "currencies_isActive_idx" ON "currencies"("isActive");
CREATE INDEX "countries_isActive_code_idx" ON "countries"("isActive", "code");
CREATE INDEX "countries_currencyCode_idx" ON "countries"("currencyCode");
CREATE INDEX "exchange_rates_isActive_baseCurrencyCode_quoteCurrencyCode_idx" ON "exchange_rates"("isActive", "baseCurrencyCode", "quoteCurrencyCode");
CREATE INDEX "exchange_rates_updatedByAdminId_updatedAt_idx" ON "exchange_rates"("updatedByAdminId", "updatedAt");
CREATE UNIQUE INDEX "exchange_rates_baseCurrencyCode_quoteCurrencyCode_key" ON "exchange_rates"("baseCurrencyCode", "quoteCurrencyCode");

ALTER TABLE "countries"
ADD CONSTRAINT "countries_currencyCode_fkey"
FOREIGN KEY ("currencyCode") REFERENCES "currencies"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "exchange_rates"
ADD CONSTRAINT "exchange_rates_baseCurrencyCode_fkey"
FOREIGN KEY ("baseCurrencyCode") REFERENCES "currencies"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "exchange_rates"
ADD CONSTRAINT "exchange_rates_quoteCurrencyCode_fkey"
FOREIGN KEY ("quoteCurrencyCode") REFERENCES "currencies"("code")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "exchange_rates"
ADD CONSTRAINT "exchange_rates_updatedByAdminId_fkey"
FOREIGN KEY ("updatedByAdminId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
