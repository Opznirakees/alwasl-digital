import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError } from '@/server/http';
import { assertRateLimit } from '@/server/rate-limit';
import { verifySensitiveOtpChallenge } from '@/server/sensitive-otp';
import { walletTopUpSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = walletTopUpSchema.parse(await request.json());
    await assertRateLimit(`wallet:top-up:${user.id}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    await verifySensitiveOtpChallenge(user, 'WALLET_TOP_UP', body.otp);

    throw new Error('PAYMENT_PROVIDER_NOT_CONFIGURED');
  } catch (error) {
    return handleApiError(error);
  }
}
