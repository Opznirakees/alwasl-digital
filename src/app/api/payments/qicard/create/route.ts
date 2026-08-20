import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapOrder } from '@/server/mappers';
import { assertRateLimit } from '@/server/rate-limit';
import { createQiCardCheckout } from '@/server/services/qicard-payments';
import { qiCardCheckoutSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = qiCardCheckoutSchema.parse(await request.json());
    await assertRateLimit(`payments:qicard:create:${user.id}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    const result = await createQiCardCheckout(user, body);

    return ok({
      order: mapOrder(result.order),
      checkoutUrl: result.checkoutUrl,
      environment: result.environment,
      replayed: result.replayed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
