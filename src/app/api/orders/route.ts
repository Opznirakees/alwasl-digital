import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { assertRateLimit } from '@/server/rate-limit';
import { createPendingOrder } from '@/server/services/orders';
import { createOrderSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return ok({ orders: orders.map(mapOrder) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = createOrderSchema.parse(await request.json());
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    assertRateLimit(`orders:create:${user.id}:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });

    const order = await createPendingOrder(user, body);
    return ok({ order: mapOrder(order) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
