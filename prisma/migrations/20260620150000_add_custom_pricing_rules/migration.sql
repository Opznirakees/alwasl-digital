CREATE TYPE "UserAccountType" AS ENUM ('CUSTOMER', 'DISTRIBUTOR');

CREATE TYPE "PricingRuleTargetType" AS ENUM ('ALL', 'CUSTOMER', 'DISTRIBUTOR', 'USER');

CREATE TYPE "PricingRulePriceType" AS ENUM ('FIXED_PRICE', 'PERCENTAGE_DISCOUNT', 'FIXED_DISCOUNT');

ALTER TABLE "users"
ADD COLUMN "accountType" "UserAccountType" NOT NULL DEFAULT 'CUSTOMER';

CREATE TABLE "custom_pricing_rules" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetType" "PricingRuleTargetType" NOT NULL,
  "priceType" "PricingRulePriceType" NOT NULL,
  "value" INTEGER NOT NULL,
  "productId" TEXT,
  "packageId" TEXT,
  "userId" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "applyMembershipDiscount" BOOLEAN NOT NULL DEFAULT false,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "custom_pricing_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "custom_pricing_rules_value_non_negative" CHECK ("value" >= 0),
  CONSTRAINT "custom_pricing_rules_percentage_value_range" CHECK ("priceType" <> 'PERCENTAGE_DISCOUNT' OR ("value" >= 0 AND "value" <= 100)),
  CONSTRAINT "custom_pricing_rules_priority_non_negative" CHECK ("priority" >= 0),
  CONSTRAINT "custom_pricing_rules_date_range" CHECK ("endDate" IS NULL OR "startDate" IS NULL OR "endDate" > "startDate"),
  CONSTRAINT "custom_pricing_rules_user_target_requires_user" CHECK (("targetType" = 'USER' AND "userId" IS NOT NULL) OR ("targetType" <> 'USER' AND "userId" IS NULL))
);

ALTER TABLE "orders"
ADD COLUMN "customPricingRuleId" TEXT,
ADD COLUMN "pricingSnapshot" JSONB;

CREATE INDEX "users_accountType_idx" ON "users"("accountType");

CREATE INDEX "custom_pricing_rules_isActive_targetType_priority_idx" ON "custom_pricing_rules"("isActive", "targetType", "priority");
CREATE INDEX "custom_pricing_rules_productId_packageId_idx" ON "custom_pricing_rules"("productId", "packageId");
CREATE INDEX "custom_pricing_rules_userId_isActive_idx" ON "custom_pricing_rules"("userId", "isActive");
CREATE INDEX "custom_pricing_rules_createdByAdminId_createdAt_idx" ON "custom_pricing_rules"("createdByAdminId", "createdAt");

CREATE INDEX "orders_customPricingRuleId_idx" ON "orders"("customPricingRuleId");

ALTER TABLE "custom_pricing_rules"
ADD CONSTRAINT "custom_pricing_rules_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_pricing_rules"
ADD CONSTRAINT "custom_pricing_rules_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "topup_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_pricing_rules"
ADD CONSTRAINT "custom_pricing_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "custom_pricing_rules"
ADD CONSTRAINT "custom_pricing_rules_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "orders"
ADD CONSTRAINT "orders_customPricingRuleId_fkey" FOREIGN KEY ("customPricingRuleId") REFERENCES "custom_pricing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;
