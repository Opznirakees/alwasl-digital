ALTER TABLE "products"
ALTER COLUMN "category" SET DEFAULT 'TOP_UP';

UPDATE "products"
SET "category" = 'TOP_UP'
WHERE "id" = 'waho-top-up';
