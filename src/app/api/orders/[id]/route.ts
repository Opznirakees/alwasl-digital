import { recordAdminAuditLog } from '@/server/admin-audit';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { hasPermission } from '@/server/permissions';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id } });
    const canViewAllOrders = hasPermission(user, 'ORDER_READ');

    if (!order) throw new Error('NOT_FOUND');
    if (!canViewAllOrders && order.userId !== user.id) throw new Error('FORBIDDEN');

    if (canViewAllOrders) {
      await recordAdminAuditLog({
        admin: user,
        request,
        action: 'orders.detail.view',
        entityType: 'order',
        entityId: order.id,
        metadata: {
          orderUserId: order.userId,
          ownOrder: order.userId === user.id,
        },
      });
    }

    return ok({ order: mapOrder(order) });
  } catch (error) {
    return handleApiError(error);
  }
}
