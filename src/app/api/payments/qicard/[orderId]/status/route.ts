import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { assertRateLimit } from '@/server/rate-limit';
import { refreshQiCardOrder } from '@/server/services/qicard-payments';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireUser();
    const { orderId } = await context.params;
    await assertRateLimit(`payments:qicard:status:${user.id}:${orderId}`, { limit: 60, windowMs: 15 * 60 * 1000 });
    const order = await refreshQiCardOrder(user, orderId);
    return ok({ order: mapOrder(order) });
  } catch (error) {
    return handleApiError(error);
  }
}
