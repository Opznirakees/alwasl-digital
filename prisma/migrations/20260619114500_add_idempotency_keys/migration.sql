ALTER TABLE "orders"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyFingerprint" TEXT;

ALTER TABLE "payment_attempts"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyFingerprint" TEXT;

CREATE UNIQUE INDEX "orders_userId_idempotencyKey_key" ON "orders"("userId", "idempotencyKey");
CREATE UNIQUE INDEX "payment_attempts_orderId_idempotencyKey_key" ON "payment_attempts"("orderId", "idempotencyKey");
