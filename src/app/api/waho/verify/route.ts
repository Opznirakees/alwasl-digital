import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { getWahoVerificationProvider } from '@/server/providers/waho-router';
import { assertRateLimit } from '@/server/rate-limit';
import { wahoVerifySchema } from '@/server/validation';
import { getClientIpFromHeaders } from '@/server/domain/access-blocks';
import { assertRequestAccessAllowed } from '@/server/services/access-blocks';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = wahoVerifySchema.parse(await request.json());
    const ip = getClientIpFromHeaders(request.headers) ?? 'local';
    await assertRateLimit(`waho-verify:${ip}`, { limit: 60, windowMs: 15 * 60 * 1000 });
    await assertRequestAccessAllowed(request.headers, { wahoId: body.wahoId });

    const providerSelection = await getWahoVerificationProvider('waho-top-up');
    const account = await providerSelection.provider.verifyWahoAccount(body.wahoId);
    return ok({ account });
  } catch (error) {
    return handleApiError(error);
  }
}
