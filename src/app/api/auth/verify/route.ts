import { NextRequest } from 'next/server';
import { createSession } from '@/server/auth';
import { hashOtp, safeCompare } from '@/server/crypto';
import { isBlockedProductionDemoOtp } from '@/server/demo-auth';
import { handleApiError, fail, ok } from '@/server/http';
import { mapUser } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { assertRateLimit } from '@/server/rate-limit';
import { normalizePhone, verifyOtpSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = verifyOtpSchema.parse(await request.json());
    const phone = normalizePhone(body.phone);
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';

    assertRateLimit(`auth-verify:${ip}`, { limit: 30, windowMs: 15 * 60 * 1000 });
    assertRateLimit(`auth-verify:${phone}`, { limit: 8, windowMs: 10 * 60 * 1000 });

    if (isBlockedProductionDemoOtp(phone, body.otp)) {
      return fail('Invalid OTP', 401);
    }

    const otp = await prisma.otpCode.findFirst({
      where: {
        phone,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) return fail('Invalid or expired OTP', 401);

    const valid = safeCompare(hashOtp(phone, body.otp), otp.codeHash);
    if (!valid) {
      await prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      return fail('Invalid OTP', 401);
    }

    const now = new Date();
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        isVerified: true,
        lastLogin: now,
      },
      create: {
        phone,
        name: `WAHO Customer ${phone.slice(-4)}`,
        isVerified: true,
        lastLogin: now,
      },
    });

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: {
        consumedAt: now,
        userId: user.id,
      },
    });

    await createSession(user.id);
    return ok({ user: mapUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
