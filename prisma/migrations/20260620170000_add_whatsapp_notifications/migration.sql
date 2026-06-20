CREATE TYPE "WhatsAppNotificationType" AS ENUM ('PAYMENT_RECEIVED', 'TOPUP_SUCCESS', 'TOPUP_FAILURE', 'MARKETING');
CREATE TYPE "WhatsAppNotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "whatsapp_notifications" (
  "id" TEXT NOT NULL,
  "type" "WhatsAppNotificationType" NOT NULL,
  "status" "WhatsAppNotificationStatus" NOT NULL DEFAULT 'PENDING',
  "dedupeKey" TEXT NOT NULL,
  "userId" TEXT,
  "orderId" TEXT,
  "manualDepositId" TEXT,
  "createdByAdminId" TEXT,
  "batchId" TEXT,
  "phone" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "providerMessageId" TEXT,
  "error" TEXT,
  "metadata" JSONB,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "whatsapp_notifications_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "whatsapp_notifications_phone_not_empty" CHECK (length(trim("phone")) > 0),
  CONSTRAINT "whatsapp_notifications_message_not_empty" CHECK (length(trim("message")) > 0),
  CONSTRAINT "whatsapp_notifications_sent_at_when_sent" CHECK ("status" <> 'SENT' OR "sentAt" IS NOT NULL),
  CONSTRAINT "whatsapp_notifications_error_when_failed" CHECK ("status" <> 'FAILED' OR length(trim(coalesce("error", ''))) > 0)
);

CREATE UNIQUE INDEX "whatsapp_notifications_dedupeKey_key" ON "whatsapp_notifications"("dedupeKey");
CREATE INDEX "whatsapp_notifications_type_status_createdAt_idx" ON "whatsapp_notifications"("type", "status", "createdAt");
CREATE INDEX "whatsapp_notifications_userId_createdAt_idx" ON "whatsapp_notifications"("userId", "createdAt");
CREATE INDEX "whatsapp_notifications_orderId_createdAt_idx" ON "whatsapp_notifications"("orderId", "createdAt");
CREATE INDEX "whatsapp_notifications_manualDepositId_createdAt_idx" ON "whatsapp_notifications"("manualDepositId", "createdAt");
CREATE INDEX "whatsapp_notifications_batchId_createdAt_idx" ON "whatsapp_notifications"("batchId", "createdAt");

ALTER TABLE "whatsapp_notifications"
ADD CONSTRAINT "whatsapp_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_notifications"
ADD CONSTRAINT "whatsapp_notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_notifications"
ADD CONSTRAINT "whatsapp_notifications_manualDepositId_fkey" FOREIGN KEY ("manualDepositId") REFERENCES "manual_deposits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "whatsapp_notifications"
ADD CONSTRAINT "whatsapp_notifications_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
