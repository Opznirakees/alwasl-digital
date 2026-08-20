import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { assertRateLimit } from '@/server/rate-limit';
import { cancelQiCardOrder } from '@/server/services/qicard-payments';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser();
    const { orderId } = await context.params;
    await assertRateLimit(`payments:qicard:cancel:${user.id}`, { limit: 10, windowMs: 15 * 60 * 1000 });
    const order = await cancelQiCardOrder(user, orderId);
    return ok({ order: mapOrder(order) });
  } catch (error) {
    return handleApiError(error);
  }
}
