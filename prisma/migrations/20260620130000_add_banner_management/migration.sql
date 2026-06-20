CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "subtitle" TEXT,
    "subtitleAr" TEXT,
    "image" TEXT NOT NULL,
    "link" TEXT,
    "productId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "banners_valid_date_range_check" CHECK ("endDate" > "startDate"),
    CONSTRAINT "banners_sort_order_non_negative_check" CHECK ("sortOrder" >= 0)
);

CREATE INDEX "banners_isActive_startDate_endDate_sortOrder_idx" ON "banners"("isActive", "startDate", "endDate", "sortOrder");
CREATE INDEX "banners_productId_idx" ON "banners"("productId");

ALTER TABLE "banners"
ADD CONSTRAINT "banners_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "products"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
