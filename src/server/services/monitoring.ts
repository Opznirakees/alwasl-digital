import { prisma } from '@/server/prisma';
import { mapMonitoringEvent, mapMonitoringTarget } from '@/server/mappers';
import type { MonitoringDashboard } from '@/types';

export const DEFAULT_LOG_RETENTION_DAYS = 30;
export const MAX_MONITORING_CHECKS_PER_RUN = 25;

type MonitoringSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
type MonitoringStatus = 'UNKNOWN' | 'UP' | 'DOWN' | 'DEGRADED';
type MonitoringEnv = Partial<NodeJS.ProcessEnv>;
type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface MonitoringEventInput {
  severity: MonitoringSeverity;
  source: string;
  message: string;
  status?: MonitoringStatus;
  targetId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  latencyMs?: number;
  requestId?: string;
  metadata?: unknown;
}

interface MonitoringTargetForCheck {
  id: string;
  name: string;
  url: string;
  method: string;
  expectedStatus: number;
  timeoutMs: number;
  intervalMinutes: number;
  isActive: boolean;
  lastStatus: MonitoringStatus;
  lastCheckedAt: Date | null;
}

export interface MonitoringCheckResult {
  targetId: string;
  name: string;
  url: string;
  status: MonitoringStatus;
  statusCode?: number;
  latencyMs: number;
  error?: string;
}

export function resolveLogRetentionDays(env: MonitoringEnv = process.env) {
  const parsed = Number.parseInt(env.LOG_RETENTION_DAYS ?? '', 10);
  if (!Number.isFinite(parsed)) return DEFAULT_LOG_RETENTION_DAYS;
  return Math.min(365, Math.max(1, parsed));
}

export function getMonitoringExternalConfig(env: MonitoringEnv = process.env) {
  return {
    errorWebhookConfigured: Boolean(env.MONITORING_ERROR_WEBHOOK_URL?.trim()),
    statusWebhookConfigured: Boolean(env.MONITORING_STATUS_WEBHOOK_URL?.trim()),
  };
}

export function resolveMonitoringWebhookUrl(severity: MonitoringSeverity, env: MonitoringEnv = process.env) {
  const errorWebhook = env.MONITORING_ERROR_WEBHOOK_URL?.trim();
  const statusWebhook = env.MONITORING_STATUS_WEBHOOK_URL?.trim();

  if (severity === 'ERROR' || severity === 'CRITICAL') {
    return errorWebhook || statusWebhook || null;
  }

  return statusWebhook || null;
}

export function buildMonitoringWebhookPayload(event: MonitoringEventInput & { id?: string; createdAt?: string }) {
  return {
    id: event.id,
    severity: event.severity,
    source: event.source,
    message: event.message,
    status: event.status,
    path: event.path,
    method: event.method,
    statusCode: event.statusCode,
    latencyMs: event.latencyMs,
    requestId: event.requestId,
    createdAt: event.createdAt ?? new Date().toISOString(),
  };
}

async function sendMonitoringWebhook(
  event: MonitoringEventInput & { id?: string; createdAt?: string },
  options: { env?: MonitoringEnv; fetcher?: Fetcher } = {}
) {
  const webhookUrl = resolveMonitoringWebhookUrl(event.severity, options.env);
  if (!webhookUrl) return;

  const fetcher = options.fetcher ?? fetch;

  try {
    await fetcher(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildMonitoringWebhookPayload(event)),
    });
  } catch (error) {
    console.warn('Failed to send monitoring webhook', error);
  }
}

export async function getMonitoringSettings() {
  return prisma.monitoringSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      logRetentionDays: resolveLogRetentionDays(),
      uptimeEnabled: true,
    },
  });
}

export async function recordMonitoringEvent(
  input: MonitoringEventInput,
  options: { env?: MonitoringEnv; fetcher?: Fetcher } = {}
) {
  if ((options.env ?? process.env).SKIP_MONITORING_DB === 'true') return null;

  try {
    const event = await prisma.monitoringEvent.create({
      data: {
        severity: input.severity,
        source: input.source,
        message: input.message,
        status: input.status,
        targetId: input.targetId,
        path: input.path,
        method: input.method,
        statusCode: input.statusCode,
        latencyMs: input.latencyMs,
        requestId: input.requestId,
        metadata: input.metadata as never,
      },
    });

    await sendMonitoringWebhook({
      ...input,
      id: event.id,
      createdAt: event.createdAt.toISOString(),
    }, options);

    return event;
  } catch (error) {
    console.error('Failed to record monitoring event', error);
    return null;
  }
}

export function recordUnexpectedApiError(error: unknown) {
  const metadata = error instanceof Error
    ? { name: error.name, code: error.message }
    : { type: typeof error };

  void recordMonitoringEvent({
    severity: 'ERROR',
    source: 'api',
    message: 'Unexpected API error',
    metadata,
  });
}

function isTargetDue(target: MonitoringTargetForCheck, now = new Date()) {
  if (!target.lastCheckedAt) return true;
  return now.getTime() - target.lastCheckedAt.getTime() >= target.intervalMinutes * 60 * 1000;
}

function getMonitoringStatus(responseStatus: number, expectedStatus: number): MonitoringStatus {
  if (responseStatus === expectedStatus) return 'UP';
  return responseStatus >= 500 ? 'DOWN' : 'DEGRADED';
}

function createStatusMessage(target: MonitoringTargetForCheck, result: MonitoringCheckResult) {
  if (result.status === 'UP') {
    return `${target.name} is reachable with HTTP ${result.statusCode}`;
  }

  if (result.statusCode) {
    return `${target.name} returned HTTP ${result.statusCode}; expected ${target.expectedStatus}`;
  }

  return `${target.name} is unreachable`;
}

export async function checkMonitoringTarget(
  target: MonitoringTargetForCheck,
  options: { fetcher?: Fetcher } = {}
): Promise<MonitoringCheckResult> {
  const fetcher = options.fetcher ?? fetch;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), target.timeoutMs);

  try {
    const response = await fetcher(target.url, {
      method: target.method,
      signal: controller.signal,
      cache: 'no-store',
    });
    const latencyMs = Date.now() - startedAt;
    const status = getMonitoringStatus(response.status, target.expectedStatus);

    return {
      targetId: target.id,
      name: target.name,
      url: target.url,
      status,
      statusCode: response.status,
      latencyMs,
    };
  } catch (error) {
    return {
      targetId: target.id,
      name: target.name,
      url: target.url,
      status: 'DOWN',
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error && error.name === 'AbortError' ? 'Request timed out' : 'Request failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runMonitoringChecks(options: {
  targetId?: string;
  limit?: number;
  fetcher?: Fetcher;
  force?: boolean;
} = {}) {
  const settings = await getMonitoringSettings();
  if (!settings.uptimeEnabled && !options.force) {
    return { skipped: true, reason: 'Uptime monitoring is disabled', checks: [] as MonitoringCheckResult[] };
  }

  const targets = await prisma.monitoringTarget.findMany({
    where: options.targetId ? { id: options.targetId } : { isActive: true },
    orderBy: [{ lastCheckedAt: 'asc' }, { createdAt: 'asc' }],
    take: Math.min(options.limit ?? MAX_MONITORING_CHECKS_PER_RUN, MAX_MONITORING_CHECKS_PER_RUN),
  });

  const now = new Date();
  const dueTargets = options.force || options.targetId
    ? targets
    : targets.filter((target) => isTargetDue(target as MonitoringTargetForCheck, now));
  const checks: MonitoringCheckResult[] = [];

  for (const target of dueTargets) {
    const previousStatus = target.lastStatus;
    const result = await checkMonitoringTarget(target as MonitoringTargetForCheck, { fetcher: options.fetcher });
    checks.push(result);

    await prisma.monitoringTarget.update({
      where: { id: target.id },
      data: {
        lastStatus: result.status,
        lastCheckedAt: new Date(),
        lastLatencyMs: result.latencyMs,
        lastStatusCode: result.statusCode,
        lastError: result.error,
      },
    });

    const shouldRecordEvent = result.status !== 'UP' || previousStatus !== 'UP';
    if (!shouldRecordEvent) continue;

    await recordMonitoringEvent({
      severity: result.status === 'UP' ? 'INFO' : 'ERROR',
      source: 'uptime',
      message: createStatusMessage(target as MonitoringTargetForCheck, result),
      status: result.status,
      targetId: target.id,
      method: target.method,
      statusCode: result.statusCode,
      latencyMs: result.latencyMs,
      metadata: {
        url: target.url,
        expectedStatus: target.expectedStatus,
        error: result.error,
      },
    });
  }

  return { skipped: false, checks };
}

export async function pruneMonitoringEvents(retentionDays?: number) {
  const settings = await getMonitoringSettings();
  const days = retentionDays ?? settings.logRetentionDays;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.monitoringEvent.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  await recordMonitoringEvent({
    severity: 'INFO',
    source: 'retention',
    message: `Pruned monitoring events older than ${days} days`,
    metadata: { cutoff: cutoff.toISOString(), deletedCount: result.count },
  });

  return { deletedCount: result.count, cutoff, retentionDays: days };
}

export async function getSystemHealth() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    let monitoringTables = 'ok';
    let downTargets = 0;
    let criticalEvents24h = 0;

    try {
      [downTargets, criticalEvents24h] = await Promise.all([
        prisma.monitoringTarget.count({ where: { isActive: true, lastStatus: 'DOWN' } }),
        prisma.monitoringEvent.count({
          where: {
            severity: 'CRITICAL',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);
    } catch {
      monitoringTables = 'unavailable';
    }

    return {
      status: monitoringTables !== 'ok' || downTargets || criticalEvents24h ? 'degraded' : 'ok',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks: {
        database: 'ok',
        monitoringTables,
        activeTargetsDown: downTargets,
        criticalEvents24h,
      },
    };
  } catch {
    return {
      status: 'down',
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks: {
        database: 'down',
      },
    };
  }
}

export async function getMonitoringDashboard(origin: string): Promise<MonitoringDashboard> {
  const settings = await getMonitoringSettings();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [targets, events, errorEvents24h, criticalEvents24h] = await Promise.all([
    prisma.monitoringTarget.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] }),
    prisma.monitoringEvent.findMany({
      include: { target: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.monitoringEvent.count({
      where: {
        severity: { in: ['ERROR', 'CRITICAL'] },
        createdAt: { gte: since24h },
      },
    }),
    prisma.monitoringEvent.count({
      where: {
        severity: 'CRITICAL',
        createdAt: { gte: since24h },
      },
    }),
  ]);

  const external = getMonitoringExternalConfig();
  const lastEventAt = events[0]?.createdAt.toISOString();

  return {
    settings: {
      id: settings.id,
      logRetentionDays: settings.logRetentionDays,
      uptimeEnabled: settings.uptimeEnabled,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    },
    targets: targets.map(mapMonitoringTarget),
    events: events.map(mapMonitoringEvent),
    summary: {
      activeTargets: targets.filter((target) => target.isActive).length,
      downTargets: targets.filter((target) => target.isActive && target.lastStatus === 'DOWN').length,
      errorEvents24h,
      criticalEvents24h,
      lastEventAt,
    },
    external: {
      healthEndpoint: `${origin.replace(/\/$/, '')}/api/health`,
      ...external,
    },
  };
}
