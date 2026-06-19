import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { createIdempotencyFingerprint, requireIdempotencyKey } from '@/server/idempotency';
import { mapOrder } from '@/server/mappers';
import { assertFakePaymentEndpointEnabled } from '@/server/payment-policy';
import { assertRateLimit } from '@/server/rate-limit';
import { confirmFakePayment } from '@/server/services/orders';
import { fakePaymentConfirmSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    assertFakePaymentEndpointEnabled();
    const user = await requireUser();
    const body = fakePaymentConfirmSchema.parse(await request.json());
    const idempotencyKey = requireIdempotencyKey(request.headers);
    const idempotencyFingerprint = createIdempotencyFingerprint('payments.fake.confirm', {
      orderId: body.orderId,
      success: body.success,
    });
    await assertRateLimit(`payments:fake:${user.id}`, { limit: 40, windowMs: 15 * 60 * 1000 });

    const result = await confirmFakePayment(user, body, {
      key: idempotencyKey,
      fingerprint: idempotencyFingerprint,
    });
    const order = result.order;
    if (user.role === 'ADMIN') {
      await recordAdminAuditLog({
        admin: user,
        request,
        action: 'payments.fake.confirm',
        entityType: 'order',
        entityId: order.id,
        metadata: {
          requestedSuccess: body.success,
          orderUserId: order.userId,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
        },
      });
    }

    return ok(
      { order: mapOrder(order), replayed: result.replayed },
      { headers: { 'Idempotency-Replayed': result.replayed ? 'true' : 'false' } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
