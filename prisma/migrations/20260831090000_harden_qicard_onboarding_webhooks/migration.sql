CREATE TYPE "PaymentWebhookVerificationMethod" AS ENUM (
  'SIGNATURE_AND_PROVIDER_API',
  'PROVIDER_API'
);

CREATE TYPE "PaymentWebhookDisposition" AS ENUM (
  'ORDER_RECONCILED',
  'PROVIDER_TEST_VERIFIED'
);

ALTER TABLE "payment_webhook_events"
  ADD COLUMN "providerRequestId" TEXT,
  ADD COLUMN "amount" DECIMAL(18,3),
  ADD COLUMN "currency" TEXT,
  ADD COLUMN "providerCreatedAt" TEXT,
  ADD COLUMN "sourceIpHash" TEXT,
  ADD COLUMN "providerVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "verificationMethod" "PaymentWebhookVerificationMethod",
  ADD COLUMN "disposition" "PaymentWebhookDisposition";

CREATE INDEX "payment_webhook_events_providerRequestId_receivedAt_idx"
  ON "payment_webhook_events"("providerRequestId", "receivedAt");

ALTER TABLE "payment_webhook_events"
  ADD CONSTRAINT "payment_webhook_events_amount_positive"
  CHECK ("amount" IS NULL OR "amount" > 0),
  ADD CONSTRAINT "payment_webhook_events_currency_iso_length"
  CHECK ("currency" IS NULL OR length("currency") = 3);
