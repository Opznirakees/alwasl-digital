import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError } from '@/server/http';
import { assertRateLimit } from '@/server/rate-limit';
import { walletTopUpSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    walletTopUpSchema.parse(await request.json());
    assertRateLimit(`wallet:top-up:${user.id}`, { limit: 20, windowMs: 15 * 60 * 1000 });

    throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
  } catch (error) {
    return handleApiError(error);
  }
}
