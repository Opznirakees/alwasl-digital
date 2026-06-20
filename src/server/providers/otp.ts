import { sendWhatsAppText, validateWahaConfig } from './waha-whatsapp';

interface DeliverOtpInput {
  phone: string;
  code: string;
}

interface OtpDeliveryEnv {
  NODE_ENV?: string;
  ALLOW_UNDELIVERED_OTP?: string;
  OTP_CHANNEL?: string;
  OTP_WEBHOOK_URL?: string;
  OTP_WEBHOOK_TOKEN?: string;
  WAHA_BASE_URL?: string;
  WAHA_API_KEY?: string;
  WAHA_SESSION?: string;
}

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface DeliverOtpOptions {
  env?: OtpDeliveryEnv | NodeJS.ProcessEnv;
  fetcher?: Fetcher;
}

function maskedPhoneSuffix(phone: string) {
  return phone.replace(/\D/g, '').slice(-4) || 'unknown';
}

export function createOtpMessage(code: string) {
  return [
    `Al-Wasl Digital verification code: ${code}`,
    'Use this code to sign in. It expires in 10 minutes.',
    'Do not share this code with anyone.',
  ].join('\n');
}

export function isDirectWahaOtpEnabled(env: OtpDeliveryEnv | NodeJS.ProcessEnv = process.env) {
  if ((env.OTP_CHANNEL ?? 'whatsapp') !== 'whatsapp') return false;

  try {
    validateWahaConfig(env);
    return true;
  } catch {
    return false;
  }
}

async function deliverOtpViaWaha(input: DeliverOtpInput, options: DeliverOtpOptions) {
  try {
    await sendWhatsAppText(input.phone, createOtpMessage(input.code), {
      env: options.env,
      fetcher: options.fetcher,
      onFailure: (error) => {
        console.warn('WAHA OTP delivery failed', {
          phoneSuffix: maskedPhoneSuffix(input.phone),
          code: error.message,
        });
      },
    });
  } catch {
    throw new Error('Failed to deliver OTP');
  }
}

async function deliverOtpViaWebhook(input: DeliverOtpInput, options: DeliverOtpOptions) {
  const env = options.env ?? process.env;
  const fetcher = options.fetcher ?? fetch;

  if (env.OTP_WEBHOOK_URL) {
    const response = await fetcher(env.OTP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(env.OTP_WEBHOOK_TOKEN ? { Authorization: `Bearer ${env.OTP_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        phone: input.phone,
        code: input.code,
        channel: env.OTP_CHANNEL ?? 'whatsapp',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to deliver OTP');
    }
    return;
  }

  if (env.NODE_ENV === 'production' && env.ALLOW_UNDELIVERED_OTP !== 'true') {
    throw new Error('OTP provider is not configured');
  }

  console.info(`Al-Wasl OTP for ${input.phone}: ${input.code}`);
}

export async function deliverOtp(input: DeliverOtpInput, options: DeliverOtpOptions = {}) {
  const env = options.env ?? process.env;

  if (isDirectWahaOtpEnabled(env)) {
    await deliverOtpViaWaha(input, { ...options, env });
    return;
  }

  await deliverOtpViaWebhook(input, { ...options, env });
}
