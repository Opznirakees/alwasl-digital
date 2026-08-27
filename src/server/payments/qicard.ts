import { createPublicKey, createVerify } from 'node:crypto';
import { z } from 'zod';

const DEFAULT_TIMEOUT_MS = 15_000;

const paymentSchema = z.object({
  requestId: z.string().min(1),
  paymentId: z.string().min(1),
  status: z.string().min(1),
  canceled: z.boolean().optional().default(false),
  amount: z.number().finite().positive(),
  currency: z.string().min(3).max(3),
  creationDate: z.string().min(1),
  formUrl: z.string().url().optional(),
  confirmedAmount: z.number().finite().nonnegative().optional(),
  additionalInfo: z.record(z.string(), z.unknown()).optional(),
}).passthrough();

const refundSchema = z.object({
  refundId: z.string().min(1),
  requestId: z.string().min(1).optional(),
  paymentId: z.string().min(1),
  amount: z.number().finite().positive(),
  currency: z.string().min(3).max(3),
  creationDate: z.string().min(1),
  status: z.enum(['SUCCESS', 'FAILED', 'PROCESSING']).optional(),
  successful: z.boolean().optional(),
  canceled: z.boolean().optional(),
}).passthrough();

const pendingStatuses = new Set([
  'CREATED',
  'FORM_SHOWED',
  'THREE_DS_METHOD_CALL_REQUIRED',
  'AUTHENTICATION_REQUIRED',
  'AUTHENTICATION_STARTED',
  'AUTHENTICATED',
  'INITIALIZED',
  'STARTED',
]);

const failedStatuses = new Set([
  'FAILED',
  'AUTHENTICATION_FAILED',
  'ERROR',
  'EXPIRED',
]);

export type QiCardPayment = z.infer<typeof paymentSchema>;
export type QiCardRefund = z.infer<typeof refundSchema>;
export type QiCardPaymentClassification = 'pending' | 'paid' | 'failed' | 'cancelled' | 'unknown';

export interface QiCardConfig {
  baseUrl: string;
  username: string;
  password: string;
  terminalId: string;
  webhookPublicKey?: string;
  appBaseUrl: string;
  timeoutMs: number;
  environment: 'sandbox' | 'production';
}

type QiCardEnvironment = Record<string, string | undefined>;
type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface CreateQiCardPaymentInput {
  requestId: string;
  amount: number;
  currency: string;
  locale?: string;
  finishPaymentUrl: string;
  notificationUrl: string;
  customerInfo?: Record<string, string>;
  additionalInfo?: Record<string, string>;
}

export interface RefundQiCardPaymentInput {
  requestId: string;
  amount: number;
  message?: string;
}

export function buildQiCardCallbackUrls(appBaseUrl: string, orderId: string) {
  const normalizedBaseUrl = parseHttpsUrl(appBaseUrl, true);
  const finishPaymentUrl = new URL('/payments/qicard/return', `${normalizedBaseUrl}/`);
  finishPaymentUrl.searchParams.set('orderId', orderId);
  const notificationUrl = new URL('/api/webhooks/qicard', `${normalizedBaseUrl}/`);

  return {
    finishPaymentUrl: finishPaymentUrl.toString(),
    notificationUrl: notificationUrl.toString(),
  };
}

export function getPublicRequestOrigin(requestUrl: string, headers: Pick<Headers, 'get'>) {
  const fallbackOrigin = new URL(requestUrl).origin;
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const requestHost = headers.get('host')?.split(',')[0]?.trim();
  const forwardedProtocol = headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
  const fallbackProtocol = new URL(requestUrl).protocol.replace(':', '');
  const protocol = forwardedProtocol || fallbackProtocol;
  const host = forwardedHost || requestHost;

  if (!host || !['http', 'https'].includes(protocol)) return fallbackOrigin;
  try {
    return new URL(`${protocol}://${host}`).origin;
  } catch {
    return fallbackOrigin;
  }
}

export function getQiCardWebhookReadiness(env: QiCardEnvironment = process.env) {
  let webhookUrl: string | undefined;
  try {
    if (env.APP_BASE_URL) {
      webhookUrl = buildQiCardCallbackUrls(env.APP_BASE_URL, 'readiness').notificationUrl;
    }
    const config = resolveQiCardConfig(env);
    return {
      provider: 'qicard' as const,
      configured: isQiCardWebhookEnabled(env),
      environment: config.environment,
      webhookUrl: buildQiCardCallbackUrls(config.appBaseUrl, 'readiness').notificationUrl,
    };
  } catch {
    return {
      provider: 'qicard' as const,
      configured: false,
      environment: 'unconfigured' as const,
      ...(webhookUrl ? { webhookUrl } : {}),
    };
  }
}

function normalizePem(value: string | undefined) {
  const normalized = value?.trim().replace(/\\n/g, '\n');
  return normalized || undefined;
}

function isRsaPublicKey(value: string | undefined) {
  if (!value) return false;
  try {
    return createPublicKey(value).asymmetricKeyType === 'rsa';
  } catch {
    return false;
  }
}

function parseHttpsUrl(value: string | undefined, allowLocalhost = false) {
  if (!value) throw new Error('QICARD_CONFIG_INVALID');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('QICARD_CONFIG_INVALID');
  }

  const localHttp = allowLocalhost
    && url.protocol === 'http:'
    && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !localHttp) throw new Error('QICARD_CONFIG_INVALID');
  return url.toString().replace(/\/$/, '');
}

export function resolveQiCardConfig(env: QiCardEnvironment = process.env): QiCardConfig {
  const username = env.QICARD_USERNAME?.trim();
  const password = env.QICARD_PASSWORD?.trim();
  const terminalId = env.QICARD_TERMINAL_ID?.trim();
  if (!username || !password || !terminalId) throw new Error('QICARD_CONFIG_INVALID');

  const baseUrl = parseHttpsUrl(env.QICARD_BASE_URL);
  const appBaseUrl = parseHttpsUrl(env.APP_BASE_URL, true);
  const appUrl = new URL(appBaseUrl);
  if (appUrl.pathname !== '/' || appUrl.search || appUrl.hash) throw new Error('QICARD_CONFIG_INVALID');
  const requestedTimeout = Number(env.QICARD_REQUEST_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  if (!Number.isInteger(requestedTimeout) || requestedTimeout < 1_000 || requestedTimeout > 60_000) {
    throw new Error('QICARD_CONFIG_INVALID');
  }

  return {
    baseUrl,
    username,
    password,
    terminalId,
    webhookPublicKey: normalizePem(env.QICARD_WEBHOOK_PUBLIC_KEY),
    appBaseUrl,
    timeoutMs: requestedTimeout,
    environment: new URL(baseUrl).hostname.includes('sandbox') ? 'sandbox' : 'production',
  };
}

export function isQiCardCheckoutEnabled(env: QiCardEnvironment = process.env) {
  if (env.QICARD_ENABLED !== 'true') return false;
  try {
    const config = resolveQiCardConfig(env);
    if (env.NODE_ENV === 'production' && config.environment === 'sandbox') return false;
    if (env.NODE_ENV === 'production' && !isRsaPublicKey(config.webhookPublicKey)) return false;
    return true;
  } catch {
    return false;
  }
}

export function isQiCardWebhookEnabled(env: QiCardEnvironment = process.env) {
  if (!isQiCardCheckoutEnabled(env)) return false;
  try {
    return isRsaPublicKey(resolveQiCardConfig(env).webhookPublicKey);
  } catch {
    return false;
  }
}

function assertIdentifier(value: string) {
  if (!/^[A-Za-z0-9-]{1,128}$/.test(value)) throw new Error('QICARD_REQUEST_INVALID');
}

function formatAmountForSignature(amount: number, currency: string) {
  if (!Number.isFinite(amount)) throw new Error('QICARD_RESPONSE_INVALID');
  return amount.toFixed(currency.toUpperCase() === 'IQD' ? 3 : 2);
}

export function buildQiCardWebhookSigningString(payment: QiCardPayment) {
  const parsed = paymentSchema.parse(payment);
  return [
    parsed.paymentId,
    formatAmountForSignature(parsed.amount, parsed.currency),
    parsed.currency,
    parsed.creationDate,
    parsed.status,
  ].join('|');
}

export function parseQiCardPaymentPayload(payload: unknown) {
  const result = paymentSchema.safeParse(payload);
  if (!result.success) throw new Error('QICARD_RESPONSE_INVALID');
  return result.data;
}

export function verifyQiCardWebhookSignature(
  payment: QiCardPayment,
  signature: string | null | undefined,
  publicKey: string | null | undefined,
) {
  const normalizedKey = normalizePem(publicKey || undefined);
  if (!signature?.trim() || !normalizedKey) return false;

  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(buildQiCardWebhookSigningString(payment), 'utf8');
    verifier.end();
    return verifier.verify(normalizedKey, Buffer.from(signature, 'base64'));
  } catch {
    return false;
  }
}

export function classifyQiCardPayment(payment: Pick<QiCardPayment, 'status' | 'canceled'>): QiCardPaymentClassification {
  if (payment.canceled) return 'cancelled';
  const status = payment.status.toUpperCase();
  if (status === 'SUCCESS') return 'paid';
  if (failedStatuses.has(status)) return 'failed';
  if (pendingStatuses.has(status)) return 'pending';
  return 'unknown';
}

export class QiCardClient {
  constructor(
    private readonly config: QiCardConfig,
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {}

  private async request(path: string, init: RequestInit = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await this.fetchImplementation(`${this.config.baseUrl}${path}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'X-Terminal-Id': this.config.terminalId,
          ...init.headers,
        },
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('QICARD_API_ERROR');
      try {
        return await response.json();
      } catch {
        throw new Error('QICARD_RESPONSE_INVALID');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('QICARD_REQUEST_TIMEOUT');
      }
      if (error instanceof Error && ['QICARD_API_ERROR', 'QICARD_RESPONSE_INVALID'].includes(error.message)) {
        throw error;
      }
      throw new Error('QICARD_REQUEST_FAILED');
    } finally {
      clearTimeout(timeout);
    }
  }

  async createPayment(input: CreateQiCardPaymentInput) {
    assertIdentifier(input.requestId);
    const raw = await this.request('/payment', {
      method: 'POST',
      body: JSON.stringify({ ...input, appChannel: false }),
    });

    const result = paymentSchema.safeParse(raw);
    if (!result.success || !result.data.formUrl) throw new Error('QICARD_RESPONSE_INVALID');

    let formUrl: URL;
    try {
      formUrl = new URL(result.data.formUrl);
    } catch {
      throw new Error('QICARD_RESPONSE_INVALID');
    }
    if (formUrl.origin !== new URL(this.config.baseUrl).origin) {
      throw new Error('QICARD_RESPONSE_INVALID');
    }

    return result.data;
  }

  async getPaymentStatus(paymentId: string) {
    assertIdentifier(paymentId);
    const result = paymentSchema.safeParse(await this.request(`/payment/${paymentId}/status`));
    if (!result.success) throw new Error('QICARD_RESPONSE_INVALID');
    return result.data;
  }

  async getPaymentStatusByRequest(requestId: string) {
    assertIdentifier(requestId);
    const result = paymentSchema.safeParse(await this.request(`/payment/status/by/request/${requestId}`));
    if (!result.success) throw new Error('QICARD_RESPONSE_INVALID');
    return result.data;
  }

  getPaymentFormUrl(paymentId: string) {
    assertIdentifier(paymentId);
    return `${this.config.baseUrl}/payment/${paymentId}`;
  }

  async cancelPayment(paymentId: string, requestId: string) {
    assertIdentifier(paymentId);
    assertIdentifier(requestId);
    const result = paymentSchema.safeParse(await this.request(`/payment/${paymentId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    }));
    if (!result.success) throw new Error('QICARD_RESPONSE_INVALID');
    return result.data;
  }

  async refundPayment(paymentId: string, input: RefundQiCardPaymentInput) {
    assertIdentifier(paymentId);
    assertIdentifier(input.requestId);
    const raw = await this.request(`/payment/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(input),
    });

    const refund = refundSchema.safeParse(raw);
    if (refund.success) return refund.data;

    // Some sandbox responses expose the parent payment while a refund is processing.
    const payment = paymentSchema.safeParse(raw);
    if (payment.success) return payment.data;
    throw new Error('QICARD_RESPONSE_INVALID');
  }
}

export function createQiCardClient(env: QiCardEnvironment = process.env) {
  if (!isQiCardCheckoutEnabled(env)) throw new Error('QICARD_NOT_CONFIGURED');
  return new QiCardClient(resolveQiCardConfig(env));
}
