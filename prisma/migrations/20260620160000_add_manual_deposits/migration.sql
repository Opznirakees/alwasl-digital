CREATE TYPE "ManualDepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "manual_deposits" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IQD',
  "paymentMethod" "PaymentMethod" NOT NULL,
  "transactionId" TEXT NOT NULL,
  "status" "ManualDepositStatus" NOT NULL DEFAULT 'PENDING',
  "note" TEXT,
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "walletTransactionId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "manual_deposits_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "manual_deposits_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "manual_deposits_transaction_id_not_empty" CHECK (length(trim("transactionId")) > 0),
  CONSTRAINT "manual_deposits_rejection_reason_required" CHECK ("status" <> 'REJECTED' OR length(trim(coalesce("rejectionReason", ''))) > 0),
  CONSTRAINT "manual_deposits_reviewed_when_terminal" CHECK (
    ("status" = 'PENDING' AND "reviewedAt" IS NULL) OR
    ("status" <> 'PENDING' AND "reviewedAt" IS NOT NULL)
  )
);

WITH duplicate_provider_refs AS (
  SELECT
    "id",
    row_number() OVER (PARTITION BY "providerRef" ORDER BY "createdAt", "id") AS duplicate_number
  FROM "payment_attempts"
  WHERE "providerRef" IS NOT NULL
)
UPDATE "payment_attempts"
SET "providerRef" = "payment_attempts"."providerRef" || '-' || "payment_attempts"."id"
FROM duplicate_provider_refs
WHERE "payment_attempts"."id" = duplicate_provider_refs."id"
  AND duplicate_provider_refs.duplicate_number > 1;

CREATE UNIQUE INDEX "payment_attempts_providerRef_key" ON "payment_attempts"("providerRef");
CREATE UNIQUE INDEX "manual_deposits_transactionId_key" ON "manual_deposits"("transactionId");
CREATE UNIQUE INDEX "manual_deposits_walletTransactionId_key" ON "manual_deposits"("walletTransactionId");
CREATE INDEX "manual_deposits_userId_status_createdAt_idx" ON "manual_deposits"("userId", "status", "createdAt");
CREATE INDEX "manual_deposits_status_createdAt_idx" ON "manual_deposits"("status", "createdAt");
CREATE INDEX "manual_deposits_reviewedByAdminId_reviewedAt_idx" ON "manual_deposits"("reviewedByAdminId", "reviewedAt");

ALTER TABLE "manual_deposits"
ADD CONSTRAINT "manual_deposits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "manual_deposits"
ADD CONSTRAINT "manual_deposits_reviewedByAdminId_fkey" FOREIGN KEY ("reviewedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "manual_deposits"
ADD CONSTRAINT "manual_deposits_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
