import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

interface CryptoEnv {
  NODE_ENV?: string;
  DEV_FIXED_OTP?: string;
  OTP_PEPPER?: string;
}

const rejectedOtpPeppers = new Set(['replace-with-a-long-random-otp-pepper']);

export function resolveOtpPepper(env: CryptoEnv = process.env) {
  const pepper = env.OTP_PEPPER?.trim();
  if (!pepper || rejectedOtpPeppers.has(pepper)) {
    throw new Error('OTP_SECRET_NOT_CONFIGURED');
  }

  return pepper;
}

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function createOtpCode(env: CryptoEnv = process.env) {
  if (env.NODE_ENV !== 'production' && env.DEV_FIXED_OTP) {
    return env.DEV_FIXED_OTP;
  }

  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(phone: string, code: string, env: CryptoEnv = process.env) {
  return sha256(`${resolveOtpPepper(env)}:${phone}:${code}`);
}

export function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
