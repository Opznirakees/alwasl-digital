import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { assertRateLimit } from '@/server/rate-limit';
import { createSensitiveOtpMessagePurposeLabel, requestSensitiveOtpChallenge } from '@/server/sensitive-otp';
import { sensitiveOtpRequestSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = sensitiveOtpRequestSchema.parse(await request.json());
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';

    await assertRateLimit(`sensitive-otp:${user.id}:${body.purpose}`, { limit: 5, windowMs: 10 * 60 * 1000 });
    await assertRateLimit(`sensitive-otp:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });

    const challenge = await requestSensitiveOtpChallenge(user, body.purpose);
    return ok({
      ok: true,
      purpose: body.purpose,
      label: createSensitiveOtpMessagePurposeLabel(body.purpose),
      expiresInSeconds: challenge.expiresInSeconds,
      debugOtp: challenge.debugOtp,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
