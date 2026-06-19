import { NextRequest } from 'next/server';
import { createOtpCode, hashOtp } from '@/server/crypto';
import { handleApiError, ok } from '@/server/http';
import { prisma } from '@/server/prisma';
import { resolveDemoOtpForPhone } from '@/server/demo-auth';
import { deliverOtp } from '@/server/providers/otp';
import { assertRateLimit } from '@/server/rate-limit';
import { loginSchema, normalizePhone } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = loginSchema.parse(await request.json());
    const phone = normalizePhone(body.phone);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';

    assertRateLimit(`auth-login:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    assertRateLimit(`auth-login:${phone}`, { limit: 5, windowMs: 10 * 60 * 1000 });

    const demoOtp = resolveDemoOtpForPhone(phone);
    const code = demoOtp ?? createOtpCode();

    await prisma.otpCode.create({
      data: {
        phone,
        codeHash: hashOtp(phone, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    if (!demoOtp) {
      await deliverOtp({ phone, code });
    }

    const exposeOtp = process.env.EXPOSE_OTP_IN_RESPONSE === 'true' || process.env.NODE_ENV !== 'production';
    return ok({
      ok: true,
      expiresInSeconds: 600,
      debugOtp: exposeOtp ? code : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
