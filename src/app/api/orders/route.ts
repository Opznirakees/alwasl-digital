import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { createIdempotencyFingerprint, requireIdempotencyKey } from '@/server/idempotency';
import { mapOrder } from '@/server/mappers';
import { hasPermission } from '@/server/permissions';
import { prisma } from '@/server/prisma';
import { assertRateLimit } from '@/server/rate-limit';
import { verifySensitiveOtpChallenge } from '@/server/sensitive-otp';
import { createPendingOrder } from '@/server/services/orders';
import { createOrderSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const canViewAllOrders = hasPermission(user, 'ORDER_READ');
    const orders = await prisma.order.findMany({
      where: canViewAllOrders ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    if (canViewAllOrders) {
      await recordAdminAuditLog({
        admin: user,
        request,
        action: 'orders.list.view',
        entityType: 'order',
        metadata: {
          scope: 'all_orders',
          returnedCount: orders.length,
          take: 100,
        },
      });
    }

    return ok({ orders: orders.map(mapOrder) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = createOrderSchema.parse(await request.json());
    const idempotencyKey = requireIdempotencyKey(request.headers);
    const idempotencyFingerprint = createIdempotencyFingerprint('orders.create', {
      productSlug: body.productSlug,
      packageId: body.packageId,
      wahoId: body.wahoId,
      zoneId: body.zoneId || '',
      paymentMethod: body.paymentMethod,
    });
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    await assertRateLimit(`orders:create:${user.id}:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });

    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        idempotencyKey,
      },
      select: { id: true },
    });

    if (!existingOrder) {
      await verifySensitiveOtpChallenge(user, 'ORDER_CONFIRMATION', body.otp);
    }

    const result = await createPendingOrder(user, body, {
      key: idempotencyKey,
      fingerprint: idempotencyFingerprint,
    });
    return ok(
      { order: mapOrder(result.order), replayed: result.replayed },
      {
        status: result.replayed ? 200 : 201,
        headers: { 'Idempotency-Replayed': result.replayed ? 'true' : 'false' },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
