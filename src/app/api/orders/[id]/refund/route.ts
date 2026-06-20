import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { assertRateLimit } from '@/server/rate-limit';
import { verifySensitiveOtpChallenge } from '@/server/sensitive-otp';
import { refundOrderById } from '@/server/services/orders';
import { refundOrderSchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('ORDER_REFUND');
    const { id } = await context.params;
    const body = refundOrderSchema.parse(await request.json().catch(() => ({})));
    const reason = body.reason || 'Manual admin refund';
    await assertRateLimit(`orders:refund:${admin.id}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    await verifySensitiveOtpChallenge(admin, 'WALLET_CHANGE', body.otp);

    const order = await refundOrderById(id, reason);

    await recordAdminAuditLog({
      admin,
      request,
      action: 'orders.refund',
      entityType: 'order',
      entityId: order.id,
      metadata: {
        orderUserId: order.userId,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        reason,
      },
    });

    return ok({ order: mapOrder(order) });
  } catch (error) {
    return handleApiError(error);
  }
}
