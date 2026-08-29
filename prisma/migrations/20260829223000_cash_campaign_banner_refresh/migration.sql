ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CASH';

ALTER TABLE "banners"
  ADD COLUMN "titleZh" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "subtitleZh" TEXT;

UPDATE "banners"
SET
  "titleZh" = CASE "id"
    WHEN 'banner-1' THEN '几步即可轻松充值'
    WHEN 'banner-2' THEN '付款前请先确认'
    WHEN 'banner-3' THEN '跟踪每笔 WAHO 充值'
    ELSE "title"
  END,
  "subtitleZh" = CASE "id"
    WHEN 'banner-1' THEN '选择 WAHO 或 Asiacell，比较可用价格，然后通过 WhatsApp 登录下单。'
    WHEN 'banner-2' THEN '请先核对 WAHO 账号信息，确保充值进入正确账号。'
    WHEN 'banner-3' THEN '在一个页面查看待处理、处理中、已完成、失败和退款状态。'
    ELSE "subtitle"
  END;

INSERT INTO "banners" (
  "id", "title", "titleAr", "titleZh", "subtitle", "subtitleAr", "subtitleZh", "image",
  "mobileImage", "link", "productId", "startDate", "endDate", "isActive", "sortOrder", "createdAt", "updatedAt"
) VALUES
  (
    'campaign-waho-fast-blue',
    'Al-Wasl Digital for WAHO Top-Ups',
    'الوصل الرقمي لشحن تطبيق واهو',
    'Al-Wasl 数字服务 · WAHO 充值',
    'Fast top-ups. Secure payment. Registered company.',
    'شحن سريع، دفع محمي، وشركة مسجلة.',
    '快速充值，安全支付，正规注册企业。',
    '/banners/waho-fast-blue.jpeg',
    '/banners/waho-fast-blue.jpeg',
    '/categories/waho',
    NULL,
    '2026-08-29T00:00:00.000Z',
    '2032-12-31T23:59:59.000Z',
    true,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    'campaign-waho-offers-red',
    'Promotional WAHO top-up offers',
    'خصومات ترويجية لشحن تطبيق واهو',
    'WAHO 充值优惠',
    'Save on selected WAHO top-ups with fast, protected payment.',
    'وفّر على شحنات واهو المختارة مع دفع سريع ومحمي.',
    '精选 WAHO 充值享优惠，付款快捷且安全。',
    '/banners/waho-offers-red.jpeg',
    '/banners/waho-offers-red.jpeg',
    '/categories/waho',
    NULL,
    '2026-08-29T00:00:00.000Z',
    '2032-12-31T23:59:59.000Z',
    true,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "titleAr" = EXCLUDED."titleAr",
  "titleZh" = EXCLUDED."titleZh",
  "subtitle" = EXCLUDED."subtitle",
  "subtitleAr" = EXCLUDED."subtitleAr",
  "subtitleZh" = EXCLUDED."subtitleZh",
  "image" = EXCLUDED."image",
  "mobileImage" = EXCLUDED."mobileImage",
  "link" = EXCLUDED."link",
  "startDate" = EXCLUDED."startDate",
  "endDate" = EXCLUDED."endDate",
  "isActive" = true,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "banners"
SET "sortOrder" = 10, "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'banner-1';

UPDATE "catalog_categories"
SET
  "image" = 'https://www.asiacell.com/assets/ac-logo.svg',
  "accentColor" = '#ff6f91',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'asiacell';

UPDATE "products"
SET "image" = 'https://www.asiacell.com/assets/ac-logo.svg', "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'waho-asiacell-code';
