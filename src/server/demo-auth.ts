const DEFAULT_DEMO_PHONE = '+9647812345678';
const DEFAULT_DEMO_OTP = '123456';

interface DemoAuthEnv {
  NODE_ENV?: string;
  ENABLE_DEMO_AUTH?: string;
  SEED_ADMIN_PHONE?: string;
  DEMO_OTP?: string;
}

export function isDemoAuthEnabled(env: DemoAuthEnv = process.env) {
  return env.NODE_ENV !== 'production' && env.ENABLE_DEMO_AUTH === 'true';
}

export function resolveDemoOtpForPhone(phone: string, env: DemoAuthEnv = process.env) {
  if (!isDemoAuthEnabled(env)) return null;

  const demoPhone = env.SEED_ADMIN_PHONE ?? DEFAULT_DEMO_PHONE;
  if (phone !== demoPhone) return null;

  return env.DEMO_OTP ?? DEFAULT_DEMO_OTP;
}

export function isBlockedProductionDemoOtp(phone: string, otp: string, env: DemoAuthEnv = process.env) {
  if (env.NODE_ENV !== 'production') return false;

  const demoPhones = new Set([DEFAULT_DEMO_PHONE, env.SEED_ADMIN_PHONE].filter(Boolean));
  const demoOtps = new Set([DEFAULT_DEMO_OTP, env.DEMO_OTP].filter(Boolean));

  return demoPhones.has(phone) && demoOtps.has(otp);
}
