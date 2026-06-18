import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const OTP_PEPPER = process.env.OTP_PEPPER ?? process.env.SESSION_SECRET ?? 'dev-otp-pepper';

export function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function createOtpCode() {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_FIXED_OTP) {
    return process.env.DEV_FIXED_OTP;
  }

  return String(Math.floor(100000 + Math.random() * 900000));
}

export function hashOtp(phone: string, code: string) {
  return sha256(`${OTP_PEPPER}:${phone}:${code}`);
}

export function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
