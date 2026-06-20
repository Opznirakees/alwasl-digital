import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { handleApiError, ok } from '@/server/http';
import { pruneMonitoringEvents } from '@/server/services/monitoring';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('MONITORING_MANAGE');
    const result = await pruneMonitoringEvents();

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.monitoring.retention.run',
      entityType: 'monitoring_events',
      metadata: {
        deletedCount: result.deletedCount,
        retentionDays: result.retentionDays,
      },
    });

    return ok({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
