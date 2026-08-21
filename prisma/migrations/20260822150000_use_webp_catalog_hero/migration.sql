UPDATE "products"
SET "banner" = '/brand/recharge-hero-v3.webp', "updatedAt" = CURRENT_TIMESTAMP
WHERE "banner" = '/brand/recharge-hero-v3.avif';

UPDATE "banners"
SET
  "image" = '/brand/recharge-hero-v3.webp',
  "mobileImage" = '/brand/recharge-hero-mobile-v3.webp',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'banner-1';
