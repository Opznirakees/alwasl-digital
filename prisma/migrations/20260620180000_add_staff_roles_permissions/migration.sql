ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF';

CREATE TYPE "StaffRole" AS ENUM ('OWNER', 'OPERATIONS', 'SUPPORT', 'FINANCE', 'MARKETING', 'VIEWER');

CREATE TYPE "StaffPermission" AS ENUM (
  'ADMIN_DASHBOARD_VIEW',
  'ORDER_READ',
  'ORDER_MANAGE',
  'ORDER_REFUND',
  'USER_READ',
  'USER_MANAGE',
  'WALLET_READ',
  'WALLET_MANAGE',
  'MANUAL_DEPOSIT_REVIEW',
  'PRODUCT_MANAGE',
  'PROVIDER_MANAGE',
  'PROMOTION_MANAGE',
  'BANNER_MANAGE',
  'CURRENCY_MANAGE',
  'PRICING_MANAGE',
  'EXPORT_DATA',
  'WHATSAPP_MARKETING',
  'JOB_RUN'
);

ALTER TABLE "users"
ADD COLUMN "staffRole" "StaffRole",
ADD COLUMN "staffPermissions" "StaffPermission"[] NOT NULL DEFAULT ARRAY[]::"StaffPermission"[];

ALTER TABLE "users"
ADD CONSTRAINT "users_staff_role_required_for_staff" CHECK (
  ("role" = 'STAFF' AND "staffRole" IS NOT NULL) OR
  ("role" <> 'STAFF')
);

CREATE INDEX "users_role_staffRole_idx" ON "users"("role", "staffRole");
