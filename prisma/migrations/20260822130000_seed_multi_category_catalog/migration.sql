INSERT INTO "catalog_categories" (
  "id", "slug", "name", "nameAr", "nameZh", "description", "descriptionAr", "descriptionZh",
  "image", "accentColor", "sortOrder", "isActive", "createdAt", "updatedAt"
) VALUES (
  'asiacell', 'asiacell', 'Asiacell', 'آسيا سيل', 'Asiacell',
  'Buy an Asiacell recharge code and receive it privately through WhatsApp.',
  'اشترِ رمز شحن آسيا سيل واستلمه بشكل خاص عبر واتساب.',
  '购买 Asiacell 充值码，并通过 WhatsApp 私密接收。',
  '/brand/asiacell-category.svg', '#f6b7cc', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "nameAr" = EXCLUDED."nameAr",
  "nameZh" = EXCLUDED."nameZh",
  "description" = EXCLUDED."description",
  "descriptionAr" = EXCLUDED."descriptionAr",
  "descriptionZh" = EXCLUDED."descriptionZh",
  "image" = EXCLUDED."image",
  "accentColor" = EXCLUDED."accentColor",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = true,
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "catalog_categories" SET
  "description" = 'Choose a WAHO balance package after secure WhatsApp login.',
  "descriptionAr" = 'اختر باقة رصيد واهو بعد تسجيل دخول آمن عبر واتساب.',
  "descriptionZh" = '通过 WhatsApp 安全登录后选择 WAHO 余额套餐。',
  "image" = '/brand/waho-app-icon.webp',
  "accentColor" = '#9bd8f2',
  "sortOrder" = 10,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'waho';

UPDATE "products" SET
  "name" = 'WAHO MasterCard Recharge',
  "nameAr" = 'شحن واهو ماستر كارد',
  "nameZh" = 'WAHO MasterCard 充值',
  "description" = 'Recharge your WAHO account with a MasterCard balance package.',
  "descriptionAr" = 'اشحن حساب واهو عبر إحدى باقات رصيد ماستر كارد.',
  "descriptionZh" = '使用 MasterCard 余额套餐为 WAHO 账号充值。',
  "image" = '/brand/waho-app-icon.webp',
  "banner" = '/brand/recharge-hero-v3.avif',
  "catalogCategoryId" = 'waho',
  "fulfillmentMode" = 'WAHO_API',
  "requiresUserId" = true,
  "countries" = ARRAY(SELECT "id" FROM "countries" WHERE "isActive" = true ORDER BY "id"),
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'waho-top-up';

INSERT INTO "products" (
  "id", "slug", "name", "nameAr", "nameZh", "description", "descriptionAr", "descriptionZh",
  "image", "banner", "category", "catalogCategoryId", "fulfillmentMode", "publisher", "isPopular",
  "isFeatured", "isActive", "requiresUserId", "userIdLabel", "userIdLabelAr", "userIdPlaceholder",
  "userIdPlaceholderAr", "zoneIdRequired", "countries", "createdAt", "updatedAt"
) VALUES (
  'waho-asiacell-code', 'waho-asiacell-code', 'WAHO Asiacell Recharge', 'شحن واهو آسيا سيل',
  'WAHO Asiacell 充值', 'Buy an Asiacell recharge code for your WAHO balance.',
  'اشترِ رمز شحن آسيا سيل لاستخدامه في رصيد واهو.', '购买可用于 WAHO 余额的 Asiacell 充值码。',
  '/brand/asiacell-category.svg', '/brand/recharge-hero-v3.avif', 'VOUCHER', 'asiacell', 'MANUAL_CODE',
  'Al-Wasl Digital', true, true, true, false, 'Delivery', 'التسليم', 'Delivered through WhatsApp',
  'يتم التسليم عبر واتساب', false,
  ARRAY(SELECT "id" FROM "countries" WHERE "isActive" = true ORDER BY "id"), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "nameAr" = EXCLUDED."nameAr",
  "nameZh" = EXCLUDED."nameZh",
  "description" = EXCLUDED."description",
  "descriptionAr" = EXCLUDED."descriptionAr",
  "descriptionZh" = EXCLUDED."descriptionZh",
  "image" = EXCLUDED."image",
  "banner" = EXCLUDED."banner",
  "catalogCategoryId" = EXCLUDED."catalogCategoryId",
  "fulfillmentMode" = EXCLUDED."fulfillmentMode",
  "isPopular" = true,
  "isFeatured" = true,
  "isActive" = true,
  "requiresUserId" = false,
  "countries" = EXCLUDED."countries",
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "topup_packages"
SET "inStock" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "productId" = 'waho-top-up'
  AND "id" NOT IN (
    'waho-mastercard-60000', 'waho-mastercard-100000', 'waho-mastercard-125000',
    'waho-mastercard-155000', 'waho-mastercard-310000', 'waho-mastercard-500000',
    'waho-mastercard-620000', 'waho-mastercard-1000000'
  );

INSERT INTO "topup_packages" (
  "id", "productId", "name", "nameAr", "amount", "unit", "unitAr", "basePrice", "salePrice",
  "currency", "inStock", "isPopular", "sortOrder", "createdAt", "updatedAt"
) VALUES
  ('waho-mastercard-60000', 'waho-top-up', '60,000 WAHO balance', '60,000 ماسة واهو', 60000, 'WAHO balance', 'ماسة', 10000, NULL, 'IQD', true, false, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-mastercard-100000', 'waho-top-up', '100,000 WAHO balance', '100,000 ماسة واهو', 100000, 'WAHO balance', 'ماسة', 15000, NULL, 'IQD', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-mastercard-125000', 'waho-top-up', '125,000 WAHO balance', '125,000 ماسة واهو', 125000, 'WAHO balance', 'ماسة', 20000, NULL, 'IQD', true, false, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-mastercard-155000', 'waho-top-up', '155,000 WAHO balance', '155,000 ماسة واهو', 155000, 'WAHO balance', 'ماسة', 25000, NULL, 'IQD', true, false, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-mastercard-310000', 'waho-top-up', '310,000 WAHO balance', '310,000 ماسة واهو', 310000, 'WAHO balance', 'ماسة', 50000, NULL, 'IQD', true, false, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-mastercard-500000', 'waho-top-up', '500,000 WAHO balance', '500,000 ماسة واهو', 500000, 'WAHO balance', 'ماسة', 75000, NULL, 'IQD', true, false, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-mastercard-620000', 'waho-top-up', '620,000 WAHO balance', '620,000 ماسة واهو', 620000, 'WAHO balance', 'ماسة', 100000, NULL, 'IQD', true, false, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-mastercard-1000000', 'waho-top-up', '1,000,000 WAHO balance', '1,000,000 ماسة واهو', 1000000, 'WAHO balance', 'ماسة', 150000, NULL, 'IQD', true, false, 7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name", "nameAr" = EXCLUDED."nameAr", "amount" = EXCLUDED."amount",
  "unit" = EXCLUDED."unit", "unitAr" = EXCLUDED."unitAr", "basePrice" = EXCLUDED."basePrice",
  "salePrice" = NULL, "currency" = 'IQD', "inStock" = true, "isPopular" = EXCLUDED."isPopular",
  "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "topup_packages"
SET "inStock" = false, "updatedAt" = CURRENT_TIMESTAMP
WHERE "productId" = 'waho-asiacell-code'
  AND "id" NOT IN (
    'waho-asiacell-28000', 'waho-asiacell-55000', 'waho-asiacell-83000',
    'waho-asiacell-138000', 'waho-asiacell-165000', 'waho-asiacell-275000'
  );

INSERT INTO "topup_packages" (
  "id", "productId", "name", "nameAr", "amount", "unit", "unitAr", "basePrice", "salePrice",
  "currency", "inStock", "isPopular", "sortOrder", "createdAt", "updatedAt"
) VALUES
  ('waho-asiacell-28000', 'waho-asiacell-code', '28,000 Asiacell balance', '28,000 ماسة آسيا سيل', 28000, 'WAHO balance', 'ماسة', 5000, NULL, 'IQD', true, false, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-asiacell-55000', 'waho-asiacell-code', '55,000 Asiacell balance', '55,000 ماسة آسيا سيل', 55000, 'WAHO balance', 'ماسة', 10000, NULL, 'IQD', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-asiacell-83000', 'waho-asiacell-code', '83,000 Asiacell balance', '83,000 ماسة آسيا سيل', 83000, 'WAHO balance', 'ماسة', 15000, NULL, 'IQD', true, false, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-asiacell-138000', 'waho-asiacell-code', '138,000 Asiacell balance', '138,000 ماسة آسيا سيل', 138000, 'WAHO balance', 'ماسة', 25000, NULL, 'IQD', true, false, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-asiacell-165000', 'waho-asiacell-code', '165,000 Asiacell balance', '165,000 ماسة آسيا سيل', 165000, 'WAHO balance', 'ماسة', 30000, NULL, 'IQD', true, false, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('waho-asiacell-275000', 'waho-asiacell-code', '275,000 Asiacell balance', '275,000 ماسة آسيا سيل', 275000, 'WAHO balance', 'ماسة', 50000, NULL, 'IQD', true, false, 5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name", "nameAr" = EXCLUDED."nameAr", "amount" = EXCLUDED."amount",
  "unit" = EXCLUDED."unit", "unitAr" = EXCLUDED."unitAr", "basePrice" = EXCLUDED."basePrice",
  "salePrice" = NULL, "currency" = 'IQD', "inStock" = true, "isPopular" = EXCLUDED."isPopular",
  "sortOrder" = EXCLUDED."sortOrder", "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "banners" (
  "id", "title", "titleAr", "subtitle", "subtitleAr", "image", "mobileImage", "link", "productId",
  "startDate", "endDate", "isActive", "sortOrder", "createdAt", "updatedAt"
) VALUES (
  'banner-1', 'Recharge in a few clear steps', 'اشحن بخطوات واضحة وسريعة',
  'Choose WAHO or Asiacell, log in with WhatsApp, and see the price for your country.',
  'اختر واهو أو آسيا سيل وسجل الدخول عبر واتساب وشاهد سعر بلدك.',
  '/brand/recharge-hero-v3.avif', '/brand/recharge-hero-mobile-v3.avif', '/#categories', NULL,
  '2026-05-20T00:00:00.000Z', '2030-12-31T23:59:59.000Z', true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title", "titleAr" = EXCLUDED."titleAr", "subtitle" = EXCLUDED."subtitle",
  "subtitleAr" = EXCLUDED."subtitleAr", "image" = EXCLUDED."image", "mobileImage" = EXCLUDED."mobileImage",
  "link" = EXCLUDED."link", "productId" = NULL, "startDate" = EXCLUDED."startDate",
  "endDate" = EXCLUDED."endDate", "isActive" = true, "sortOrder" = 1, "updatedAt" = CURRENT_TIMESTAMP;
