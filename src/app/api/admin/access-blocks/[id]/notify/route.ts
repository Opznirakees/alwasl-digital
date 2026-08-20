import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { resendAccessBlockNotification } from '@/server/services/access-blocks';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('USER_MANAGE');
    const { id } = await context.params;
    const block = await resendAccessBlockNotification(id);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.access_block.notification.retry',
      entityType: 'access_block',
      entityId: block.id,
      metadata: {
        type: block.type,
        maskedValue: block.maskedValue,
        notificationStatus: block.notificationStatus,
      },
    });

    return ok({ block });
  } catch (error) {
    return handleApiError(error);
  }
}
