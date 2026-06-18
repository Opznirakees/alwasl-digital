import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { getWahoProvider } from '@/server/providers/waho';
import { assertRateLimit } from '@/server/rate-limit';
import { wahoVerifySchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = wahoVerifySchema.parse(await request.json());
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
    assertRateLimit(`waho-verify:${ip}`, { limit: 60, windowMs: 15 * 60 * 1000 });

    const account = await getWahoProvider().verifyWahoAccount(body.wahoId);
    return ok({ account });
  } catch (error) {
    return handleApiError(error);
  }
}
