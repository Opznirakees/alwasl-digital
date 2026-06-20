import type { User } from '@prisma/client';
import { createOtpCode, hashOtp, safeCompare } from './crypto';
import { isOtpAttemptLocked, nextOtpAttemptCount } from './otp-policy';
import { prisma } from './prisma';
import { deliverOtp } from './providers/otp';

export const sensitiveOtpPurposes = ['ORDER_CONFIRMATION', 'PAYMENT_CONFIRMATION', 'WALLET_TOP_UP', 'WALLET_CHANGE'] as const;

export type SensitiveOtpPurpose = (typeof sensitiveOtpPurposes)[number];

type SensitiveOtpUser = Pick<User, 'id' | 'phone'>;

export function isSensitiveOtpPurpose(value: string): value is SensitiveOtpPurpose {
  return (sensitiveOtpPurposes as readonly string[]).includes(value);
}

export function createSensitiveOtpMessagePurposeLabel(purpose: SensitiveOtpPurpose) {
  const labels: Record<SensitiveOtpPurpose, string> = {
    ORDER_CONFIRMATION: 'confirming your WAHO top-up order',
    PAYMENT_CONFIRMATION: 'confirming a payment action',
    WALLET_TOP_UP: 'confirming a wallet top-up request',
    WALLET_CHANGE: 'confirming a wallet change',
  };

  return labels[purpose];
}

export async function requestSensitiveOtpChallenge(user: SensitiveOtpUser, purpose: SensitiveOtpPurpose) {
  const code = createOtpCode();
  const now = new Date();

  await prisma.otpCode.updateMany({
    where: {
      phone: user.phone,
      userId: user.id,
      purpose,
      consumedAt: null,
    },
    data: { consumedAt: now },
  });

  await prisma.otpCode.create({
    data: {
      phone: user.phone,
      userId: user.id,
      purpose,
      codeHash: hashOtp(user.phone, code),
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    },
  });

  await deliverOtp({
    phone: user.phone,
    code,
  });

  return {
    expiresInSeconds: 600,
    debugOtp: process.env.EXPOSE_OTP_IN_RESPONSE === 'true' || process.env.NODE_ENV !== 'production' ? code : undefined,
  };
}

export async function verifySensitiveOtpChallenge(user: SensitiveOtpUser, purpose: SensitiveOtpPurpose, code?: string) {
  if (!code) throw new Error('SENSITIVE_OTP_REQUIRED');

  const otp = await prisma.otpCode.findFirst({
    where: {
      phone: user.phone,
      userId: user.id,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) throw new Error('SENSITIVE_OTP_INVALID');
  if (isOtpAttemptLocked(otp.attempts)) throw new Error('SENSITIVE_OTP_LOCKED');

  const valid = safeCompare(hashOtp(user.phone, code), otp.codeHash);
  if (!valid) {
    const updated = await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });

    if (isOtpAttemptLocked(nextOtpAttemptCount(otp.attempts)) || isOtpAttemptLocked(updated.attempts)) {
      throw new Error('SENSITIVE_OTP_LOCKED');
    }

    throw new Error('SENSITIVE_OTP_INVALID');
  }

  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });
}
