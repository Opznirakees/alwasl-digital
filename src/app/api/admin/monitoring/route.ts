import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { handleApiError, ok } from '@/server/http';
import { prisma } from '@/server/prisma';
import { getMonitoringDashboard } from '@/server/services/monitoring';
import {
  createMonitoringTargetSchema,
  updateMonitoringSettingsSchema,
} from '@/server/validation';

export const runtime = 'nodejs';

function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  if (forwardedProto && forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('ADMIN_DASHBOARD_VIEW');
    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.monitoring.view',
      entityType: 'monitoring',
    });

    return ok({ monitoring: await getMonitoringDashboard(getRequestOrigin(request)) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('MONITORING_MANAGE');
    const body = createMonitoringTargetSchema.parse(await request.json().catch(() => ({})));
    const target = await prisma.monitoringTarget.create({
      data: body,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.monitoring.target.create',
      entityType: 'monitoring_target',
      entityId: target.id,
      metadata: {
        name: target.name,
        url: target.url,
        intervalMinutes: target.intervalMinutes,
      },
    });

    return ok({ target });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requirePermission('MONITORING_MANAGE');
    const body = updateMonitoringSettingsSchema.parse(await request.json().catch(() => ({})));
    const settings = await prisma.monitoringSetting.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        logRetentionDays: body.logRetentionDays ?? 30,
        uptimeEnabled: body.uptimeEnabled ?? true,
      },
      update: body,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.monitoring.settings.update',
      entityType: 'monitoring_settings',
      entityId: settings.id,
      metadata: body,
    });

    return ok({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
