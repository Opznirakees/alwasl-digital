import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { fulfillManualOrder } from '@/server/services/manual-order-fulfillment';
import { fulfillManualOrderSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('ORDER_MANAGE');
    const { id } = await context.params;
    const body = fulfillManualOrderSchema.parse(await request.json().catch(() => ({})));
    const result = await fulfillManualOrder(admin, id, body);

    await recordAdminAuditLog({
      admin,
      request,
      action: result.retried ? 'admin.order.delivery.retry' : 'admin.order.fulfill',
      entityType: 'order',
      entityId: result.order.id,
      metadata: {
        fulfillmentMode: result.order.fulfillmentMode,
        deliveryStatus: result.deliveryStatus,
        codeProvided: Boolean(body.code?.trim()),
      },
    });

    return ok({
      order: { ...mapOrder(result.order), deliveryStatus: result.deliveryStatus },
      retried: result.retried,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
