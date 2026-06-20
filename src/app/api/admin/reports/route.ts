import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { buildReport } from '@/server/services/reports';
import { reportQuerySchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission('ADMIN_DASHBOARD_VIEW');
    const query = reportQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams.entries()));
    const report = await buildReport(query);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.report.view',
      entityType: 'admin_report',
      entityId: query.period,
      metadata: {
        period: query.period,
        from: report.from,
        to: report.to,
        buckets: report.buckets.length,
      },
    });

    return ok({ report });
  } catch (error) {
    return handleApiError(error);
  }
}
