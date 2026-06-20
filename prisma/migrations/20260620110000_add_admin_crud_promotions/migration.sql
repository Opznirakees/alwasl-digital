-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "minPurchase" INTEGER NOT NULL DEFAULT 0,
    "maxDiscount" INTEGER,
    "usageLimit" INTEGER NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableProducts" TEXT[],
    "applicableLevels" "UserLevel"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promotions_value_positive" CHECK ("value" > 0),
    CONSTRAINT "promotions_min_purchase_non_negative" CHECK ("minPurchase" >= 0),
    CONSTRAINT "promotions_max_discount_non_negative" CHECK ("maxDiscount" IS NULL OR "maxDiscount" >= 0),
    CONSTRAINT "promotions_usage_limit_positive" CHECK ("usageLimit" > 0),
    CONSTRAINT "promotions_used_count_valid" CHECK ("usedCount" >= 0 AND "usedCount" <= "usageLimit"),
    CONSTRAINT "promotions_date_range_valid" CHECK ("endDate" > "startDate")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotions_code_key" ON "promotions"("code");

-- CreateIndex
CREATE INDEX "promotions_isActive_startDate_endDate_idx" ON "promotions"("isActive", "startDate", "endDate");
