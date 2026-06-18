import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { assertRateLimit } from '@/server/rate-limit';
import { confirmFakePayment } from '@/server/services/orders';
import { fakePaymentConfirmSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = fakePaymentConfirmSchema.parse(await request.json());
    assertRateLimit(`payments:fake:${user.id}`, { limit: 40, windowMs: 15 * 60 * 1000 });

    const order = await confirmFakePayment(user, body);
    return ok({ order: mapOrder(order) });
  } catch (error) {
    return handleApiError(error);
  }
}
