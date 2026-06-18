import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) throw new Error('NOT_FOUND');
    if (user.role !== 'ADMIN' && order.userId !== user.id) throw new Error('FORBIDDEN');

    return ok({ order: mapOrder(order) });
  } catch (error) {
    return handleApiError(error);
  }
}
