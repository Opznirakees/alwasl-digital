import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { handleApiError, ok } from '@/server/http';
import { prisma } from '@/server/prisma';
import { updateMonitoringTargetSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('MONITORING_MANAGE');
    const { id } = await context.params;
    const body = updateMonitoringTargetSchema.parse(await request.json().catch(() => ({})));
    const target = await prisma.monitoringTarget.update({
      where: { id },
      data: body,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.monitoring.target.update',
      entityType: 'monitoring_target',
      entityId: target.id,
      metadata: body,
    });

    return ok({ target });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('MONITORING_MANAGE');
    const { id } = await context.params;
    const target = await prisma.monitoringTarget.delete({ where: { id } });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.monitoring.target.delete',
      entityType: 'monitoring_target',
      entityId: target.id,
      metadata: {
        name: target.name,
        url: target.url,
      },
    });

    return ok({ target });
  } catch (error) {
    return handleApiError(error);
  }
}
