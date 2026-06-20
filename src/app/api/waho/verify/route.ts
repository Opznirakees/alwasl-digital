import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { getWahoVerificationProvider } from '@/server/providers/waho-router';
import { assertRateLimit } from '@/server/rate-limit';
import { wahoVerifySchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = wahoVerifySchema.parse(await request.json());
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    await assertRateLimit(`waho-verify:${ip}`, { limit: 60, windowMs: 15 * 60 * 1000 });

    const providerSelection = await getWahoVerificationProvider('waho-top-up');
    const account = await providerSelection.provider.verifyWahoAccount(body.wahoId);
    return ok({ account });
  } catch (error) {
    return handleApiError(error);
  }
}
