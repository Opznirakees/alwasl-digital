-- The following catalog migration adds packages for this product. Keep the
-- migration chain deployable from an empty database without depending on seed.
INSERT INTO "products" (
  "id", "slug", "name", "nameAr", "nameZh", "description", "descriptionAr", "descriptionZh",
  "image", "banner", "category", "catalogCategoryId", "fulfillmentMode", "publisher",
  "isPopular", "isFeatured", "isActive", "requiresUserId", "userIdLabel", "userIdLabelAr",
  "userIdPlaceholder", "userIdPlaceholderAr", "zoneIdRequired", "countries", "createdAt", "updatedAt"
) VALUES (
  'waho-top-up', 'waho-top-up', 'WAHO MasterCard Recharge', 'شحن واهو ماستر كارد', 'WAHO MasterCard 充值',
  'Recharge your WAHO account with a MasterCard balance package.',
  'اشحن حساب واهو عبر إحدى باقات رصيد ماستر كارد.',
  '使用 MasterCard 余额套餐为 WAHO 账号充值。',
  '/brand/waho-app-icon.webp', '/brand/recharge-hero-v3.avif', 'TOP_UP', 'waho', 'WAHO_API',
  'Al-Wasl Digital', true, true, true, true, 'WAHO ID', 'معرف واهو', 'Enter your WAHO ID',
  'أدخل معرف واهو', false,
  ARRAY(SELECT "id" FROM "countries" WHERE "isActive" = true ORDER BY "id"),
  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;
