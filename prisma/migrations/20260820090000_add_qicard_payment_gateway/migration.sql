ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'QICARD';

CREATE TYPE "PaymentWebhookProcessingStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'REJECTED', 'FAILED');
CREATE TYPE "PaymentRefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "payment_attempts"
  ADD COLUMN "providerRequestId" TEXT,
  ADD COLUMN "providerStatus" TEXT,
  ADD COLUMN "checkoutUrl" TEXT,
  ADD COLUMN "providerUpdatedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "payment_attempts_providerRequestId_key"
  ON "payment_attempts"("providerRequestId");

CREATE TABLE "payment_webhook_events" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'QICARD',
  "eventKey" TEXT NOT NULL,
  "providerPaymentId" TEXT NOT NULL,
  "providerStatus" TEXT NOT NULL,
  "payloadHash" TEXT NOT NULL,
  "signatureHash" TEXT NOT NULL,
  "signatureValid" BOOLEAN NOT NULL,
  "processingStatus" "PaymentWebhookProcessingStatus" NOT NULL DEFAULT 'RECEIVED',
  "paymentAttemptId" TEXT,
  "error" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),

  CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_webhook_events_eventKey_key"
  ON "payment_webhook_events"("eventKey");
CREATE INDEX "payment_webhook_events_providerPaymentId_receivedAt_idx"
  ON "payment_webhook_events"("providerPaymentId", "receivedAt");
CREATE INDEX "payment_webhook_events_processingStatus_receivedAt_idx"
  ON "payment_webhook_events"("processingStatus", "receivedAt");
CREATE INDEX "payment_webhook_events_paymentAttemptId_receivedAt_idx"
  ON "payment_webhook_events"("paymentAttemptId", "receivedAt");

ALTER TABLE "payment_webhook_events"
  ADD CONSTRAINT "payment_webhook_events_paymentAttemptId_fkey"
  FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "payment_refunds" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentAttemptId" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "providerRefundId" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'IQD',
  "status" "PaymentRefundStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT NOT NULL,
  "metadata" JSONB,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "payment_refunds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "payment_refunds_amount_positive" CHECK ("amount" > 0),
  CONSTRAINT "payment_refunds_reason_not_empty" CHECK (length(trim("reason")) >= 3)
);

CREATE UNIQUE INDEX "payment_refunds_requestId_key"
  ON "payment_refunds"("requestId");
CREATE UNIQUE INDEX "payment_refunds_providerRefundId_key"
  ON "payment_refunds"("providerRefundId");
CREATE INDEX "payment_refunds_orderId_status_idx"
  ON "payment_refunds"("orderId", "status");
CREATE INDEX "payment_refunds_paymentAttemptId_status_idx"
  ON "payment_refunds"("paymentAttemptId", "status");

ALTER TABLE "payment_refunds"
  ADD CONSTRAINT "payment_refunds_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "orders"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payment_refunds"
  ADD CONSTRAINT "payment_refunds_paymentAttemptId_fkey"
  FOREIGN KEY ("paymentAttemptId") REFERENCES "payment_attempts"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
