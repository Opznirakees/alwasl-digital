import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { createIdempotencyFingerprint, requireIdempotencyKey } from '@/server/idempotency';
import { mapOrder } from '@/server/mappers';
import { assertRateLimit } from '@/server/rate-limit';
import { confirmCashPayment } from '@/server/services/orders';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('ORDER_MANAGE');
    const { id } = await context.params;
    const idempotencyKey = requireIdempotencyKey(request.headers);
    await assertRateLimit(`admin:cash-payment:${admin.id}`, { limit: 60, windowMs: 15 * 60 * 1000 });

    const result = await confirmCashPayment(admin, { orderId: id }, {
      key: idempotencyKey,
      fingerprint: createIdempotencyFingerprint('admin.orders.cash-payment', { orderId: id }),
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.order.cash_payment.confirm',
      entityType: 'order',
      entityId: result.order.id,
      metadata: {
        paymentMethod: result.order.paymentMethod,
        paymentStatus: result.order.paymentStatus,
        orderStatus: result.order.status,
        replayed: result.replayed,
      },
    });

    return ok(
      { order: mapOrder(result.order), replayed: result.replayed },
      { headers: { 'Idempotency-Replayed': result.replayed ? 'true' : 'false' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
