UPDATE "catalog_categories"
SET
  "image" = '/brands/asiacell-official.svg',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'asiacell';

UPDATE "products"
SET
  "image" = '/brands/asiacell-official.svg',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'waho-asiacell-code';
