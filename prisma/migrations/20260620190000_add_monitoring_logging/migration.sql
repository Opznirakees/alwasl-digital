ALTER TYPE "StaffPermission" ADD VALUE IF NOT EXISTS 'MONITORING_MANAGE';

CREATE TYPE "MonitoringEventSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CRITICAL');
CREATE TYPE "MonitoringCheckStatus" AS ENUM ('UNKNOWN', 'UP', 'DOWN', 'DEGRADED');

CREATE TABLE "monitoring_targets" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'GET',
  "expectedStatus" INTEGER NOT NULL DEFAULT 200,
  "timeoutMs" INTEGER NOT NULL DEFAULT 5000,
  "intervalMinutes" INTEGER NOT NULL DEFAULT 5,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastStatus" "MonitoringCheckStatus" NOT NULL DEFAULT 'UNKNOWN',
  "lastCheckedAt" TIMESTAMP(3),
  "lastLatencyMs" INTEGER,
  "lastStatusCode" INTEGER,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "monitoring_targets_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "monitoring_targets_method_supported" CHECK ("method" IN ('GET', 'HEAD')),
  CONSTRAINT "monitoring_targets_expected_status_range" CHECK ("expectedStatus" >= 100 AND "expectedStatus" <= 599),
  CONSTRAINT "monitoring_targets_timeout_range" CHECK ("timeoutMs" >= 1000 AND "timeoutMs" <= 30000),
  CONSTRAINT "monitoring_targets_interval_range" CHECK ("intervalMinutes" >= 1 AND "intervalMinutes" <= 1440),
  CONSTRAINT "monitoring_targets_latency_non_negative" CHECK ("lastLatencyMs" IS NULL OR "lastLatencyMs" >= 0),
  CONSTRAINT "monitoring_targets_last_status_code_range" CHECK ("lastStatusCode" IS NULL OR ("lastStatusCode" >= 100 AND "lastStatusCode" <= 599))
);

CREATE TABLE "monitoring_events" (
  "id" TEXT NOT NULL,
  "severity" "MonitoringEventSeverity" NOT NULL DEFAULT 'INFO',
  "source" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "MonitoringCheckStatus",
  "targetId" TEXT,
  "path" TEXT,
  "method" TEXT,
  "statusCode" INTEGER,
  "latencyMs" INTEGER,
  "requestId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "monitoring_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "monitoring_events_status_code_range" CHECK ("statusCode" IS NULL OR ("statusCode" >= 100 AND "statusCode" <= 599)),
  CONSTRAINT "monitoring_events_latency_non_negative" CHECK ("latencyMs" IS NULL OR "latencyMs" >= 0)
);

CREATE TABLE "monitoring_settings" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "logRetentionDays" INTEGER NOT NULL DEFAULT 30,
  "uptimeEnabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "monitoring_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "monitoring_settings_retention_range" CHECK ("logRetentionDays" >= 1 AND "logRetentionDays" <= 365)
);

INSERT INTO "monitoring_settings" ("id", "logRetentionDays", "uptimeEnabled")
VALUES ('default', 30, true)
ON CONFLICT ("id") DO NOTHING;

CREATE INDEX "monitoring_targets_isActive_updatedAt_idx" ON "monitoring_targets"("isActive", "updatedAt");
CREATE INDEX "monitoring_targets_lastStatus_lastCheckedAt_idx" ON "monitoring_targets"("lastStatus", "lastCheckedAt");
CREATE INDEX "monitoring_events_severity_createdAt_idx" ON "monitoring_events"("severity", "createdAt");
CREATE INDEX "monitoring_events_source_createdAt_idx" ON "monitoring_events"("source", "createdAt");
CREATE INDEX "monitoring_events_targetId_createdAt_idx" ON "monitoring_events"("targetId", "createdAt");
CREATE INDEX "monitoring_events_createdAt_idx" ON "monitoring_events"("createdAt");

ALTER TABLE "monitoring_events"
ADD CONSTRAINT "monitoring_events_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "monitoring_targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
