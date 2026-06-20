import { NextRequest } from 'next/server';
import { requirePermission } from '@/server/auth';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { handleApiError, ok } from '@/server/http';
import { runMonitoringChecks } from '@/server/services/monitoring';
import { runMonitoringChecksSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('MONITORING_MANAGE');
    const body = runMonitoringChecksSchema.parse(await request.json().catch(() => ({}))) ?? {};
    const result = await runMonitoringChecks({
      targetId: body.targetId,
      force: true,
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.monitoring.checks.run',
      entityType: 'monitoring',
      entityId: body.targetId,
      metadata: {
        checks: result.checks.length,
        skipped: result.skipped,
      },
    });

    return ok({ result });
  } catch (error) {
    return handleApiError(error);
  }
}
