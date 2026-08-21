CREATE TYPE "ProductFulfillmentMode" AS ENUM ('WAHO_API', 'MANUAL_CODE', 'MANUAL_TOPUP');

ALTER TYPE "WhatsAppNotificationType" ADD VALUE IF NOT EXISTS 'OWNER_ORDER_ALERT';
ALTER TYPE "WhatsAppNotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY_CODE';

CREATE TABLE "catalog_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameZh" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionZh" TEXT NOT NULL DEFAULT '',
    "image" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL DEFAULT '#9bd8f2',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "catalog_categories_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "catalog_categories_accent_color" CHECK ("accentColor" ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE UNIQUE INDEX "catalog_categories_slug_key" ON "catalog_categories"("slug");
CREATE INDEX "catalog_categories_isActive_sortOrder_idx" ON "catalog_categories"("isActive", "sortOrder");

ALTER TABLE "users" ADD COLUMN "countryId" TEXT;

ALTER TABLE "products"
    ADD COLUMN "nameZh" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "descriptionZh" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "catalogCategoryId" TEXT,
    ADD COLUMN "fulfillmentMode" "ProductFulfillmentMode" NOT NULL DEFAULT 'WAHO_API';

ALTER TABLE "orders"
    ADD COLUMN "fulfillmentMode" "ProductFulfillmentMode" NOT NULL DEFAULT 'WAHO_API',
    ADD COLUMN "fulfillmentCodeEncrypted" TEXT,
    ADD COLUMN "fulfillmentNote" TEXT,
    ADD COLUMN "fulfilledByAdminId" TEXT,
    ADD COLUMN "manualFulfilledAt" TIMESTAMP(3);

ALTER TABLE "banners" ADD COLUMN "mobileImage" TEXT;

INSERT INTO "catalog_categories" (
    "id", "slug", "name", "nameAr", "nameZh", "description", "descriptionAr", "descriptionZh", "image", "accentColor", "sortOrder", "isActive"
) VALUES (
    'waho', 'waho', 'WAHO', 'واهو', 'WAHO',
    'Recharge WAHO balance safely and clearly.',
    'اشحن رصيد واهو بأمان ووضوح.',
    '安全清晰地充值 WAHO 余额。',
    '/brand/waho-app-icon.webp', '#9bd8f2', 10, true
) ON CONFLICT ("id") DO NOTHING;

UPDATE "products" SET "catalogCategoryId" = 'waho' WHERE "catalogCategoryId" IS NULL;

CREATE INDEX "users_countryId_idx" ON "users"("countryId");
CREATE INDEX "products_catalogCategoryId_isActive_idx" ON "products"("catalogCategoryId", "isActive");
CREATE INDEX "orders_fulfillmentMode_status_paymentStatus_idx" ON "orders"("fulfillmentMode", "status", "paymentStatus");

ALTER TABLE "users"
    ADD CONSTRAINT "users_countryId_fkey"
    FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "products"
    ADD CONSTRAINT "products_catalogCategoryId_fkey"
    FOREIGN KEY ("catalogCategoryId") REFERENCES "catalog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
