-- AlterTable
ALTER TABLE "users" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "blockedReason" TEXT,
ADD COLUMN "blockedAt" TIMESTAMP(3),
ADD COLUMN "blockedByAdminId" TEXT;

-- CreateIndex
CREATE INDEX "users_isBlocked_phone_idx" ON "users"("isBlocked", "phone");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_blockedByAdminId_fkey" FOREIGN KEY ("blockedByAdminId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
