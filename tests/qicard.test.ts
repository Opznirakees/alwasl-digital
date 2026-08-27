import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync, sign } from 'node:crypto';
import { join } from 'node:path';
import {
  QiCardClient,
  buildQiCardCallbackUrls,
  buildQiCardWebhookSigningString,
  classifyQiCardPayment,
  getQiCardWebhookReadiness,
  isQiCardCheckoutEnabled,
  resolveQiCardConfig,
  verifyQiCardWebhookSignature,
  type QiCardPayment,
} from '../src/server/payments/qicard';
import { isOrderPaymentMethodEnabled } from '../src/server/payment-policy';
import { createOrderSchema } from '../src/server/validation';

const qiWebhookTestKey = generateKeyPairSync('rsa', { modulusLength: 2048 })
  .publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();

const completeEnv = {
  QICARD_ENABLED: 'true',
  QICARD_BASE_URL: 'https://uat-sandbox-3ds-api.qi.iq/api/v1',
  QICARD_USERNAME: 'merchant-user',
  QICARD_PASSWORD: 'merchant-password',
  QICARD_TERMINAL_ID: '237984',
  QICARD_WEBHOOK_PUBLIC_KEY: qiWebhookTestKey,
  APP_BASE_URL: 'https://merchant.example',
};

const createdPayment: QiCardPayment = {
  requestId: '37b85e60-e7a6-4abb-9466-703472fb83b9',
  paymentId: 'f2bb43a8-488a-4281-977b-5b3418fc3c67',
  status: 'CREATED',
  canceled: false,
  amount: 10_000,
  currency: 'IQD',
  creationDate: '2026-08-20T01:00:00Z',
  formUrl: 'https://uat-sandbox-3ds-api.qi.iq/api/v1/payment/f2bb43a8-488a-4281-977b-5b3418fc3c67',
};

describe('QiCard configuration', () => {
  test('enables checkout only with an explicit complete HTTPS configuration', () => {
    expect(isQiCardCheckoutEnabled(completeEnv)).toBe(true);
    expect(isQiCardCheckoutEnabled({ ...completeEnv, QICARD_ENABLED: 'false' })).toBe(false);
    expect(isQiCardCheckoutEnabled({ ...completeEnv, QICARD_PASSWORD: '' })).toBe(false);
    expect(() => resolveQiCardConfig({ ...completeEnv, QICARD_BASE_URL: 'http://qi.example' })).toThrow('QICARD_CONFIG_INVALID');
  });

  test('never exposes QiCard sandbox payments from a production deployment', () => {
    expect(isQiCardCheckoutEnabled({ ...completeEnv, NODE_ENV: 'production' })).toBe(false);
    expect(isQiCardCheckoutEnabled({
      ...completeEnv,
      NODE_ENV: 'production',
      QICARD_BASE_URL: 'https://merchant-api.qi.example/api/v1',
      QICARD_WEBHOOK_PUBLIC_KEY: '',
    })).toBe(false);
    expect(isQiCardCheckoutEnabled({
      ...completeEnv,
      NODE_ENV: 'production',
      QICARD_BASE_URL: 'https://merchant-api.qi.example/api/v1',
      QICARD_WEBHOOK_PUBLIC_KEY: 'not-a-public-key',
    })).toBe(false);
    expect(isQiCardCheckoutEnabled({
      ...completeEnv,
      NODE_ENV: 'production',
      QICARD_BASE_URL: 'https://merchant-api.qi.example/api/v1',
    })).toBe(true);
  });

  test('normalizes escaped PEM newlines without exposing secrets', () => {
    const config = resolveQiCardConfig({
      ...completeEnv,
      QICARD_WEBHOOK_PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\\nabc\\n-----END PUBLIC KEY-----',
    });
    expect(config.webhookPublicKey).toContain('\nabc\n');
    expect(config.baseUrl).toBe('https://uat-sandbox-3ds-api.qi.iq/api/v1');
  });

  test('builds the exact production URLs sent in every create-payment request', () => {
    expect(buildQiCardCallbackUrls(
      'https://alwasl-digital-b8ngg.ondigitalocean.app',
      'QI order/42'
    )).toEqual({
      finishPaymentUrl: 'https://alwasl-digital-b8ngg.ondigitalocean.app/payments/qicard/return?orderId=QI+order%2F42',
      notificationUrl: 'https://alwasl-digital-b8ngg.ondigitalocean.app/api/webhooks/qicard',
    });
  });

  test('reports webhook readiness without returning merchant secrets', () => {
    const readiness = getQiCardWebhookReadiness({
      ...completeEnv,
      NODE_ENV: 'production',
      QICARD_BASE_URL: 'https://merchant-api.qi.example/api/v1',
      APP_BASE_URL: 'https://alwasl-digital-b8ngg.ondigitalocean.app',
    });

    expect(readiness).toEqual({
      provider: 'qicard',
      configured: true,
      environment: 'production',
      webhookUrl: 'https://alwasl-digital-b8ngg.ondigitalocean.app/api/webhooks/qicard',
    });
    expect(JSON.stringify(readiness)).not.toContain('merchant-password');
    expect(JSON.stringify(readiness)).not.toContain('237984');
  });
});

describe('QiCard application contract', () => {
  test('accepts QiCard only when its server-side checkout is explicitly configured', () => {
    expect(createOrderSchema.parse({
      productSlug: 'waho-top-up',
      packageId: 'waho-topup-10000',
      wahoId: 'WAHO-123',
      paymentMethod: 'qicard',
      otp: '123456',
    }).paymentMethod).toBe('qicard');

    expect(isOrderPaymentMethodEnabled('qicard', { NODE_ENV: 'production' })).toBe(false);
    expect(isOrderPaymentMethodEnabled('qicard', {
      NODE_ENV: 'production',
      ...completeEnv,
      QICARD_BASE_URL: 'https://merchant-api.qi.example/api/v1',
    })).toBe(true);
  });

  test('persists provider IDs, webhook deduplication, and external refund state', () => {
    const schema = readFileSync(join(import.meta.dir, '../prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('QICARD');
    expect(schema).toContain('providerRequestId');
    expect(schema).toContain('model PaymentWebhookEvent');
    expect(schema).toContain('eventKey');
    expect(schema).toContain('model PaymentRefund');
    expect(schema).toContain('requestId');
  });

  test('ships authenticated checkout/status/cancel APIs and a public signed webhook endpoint', () => {
    const root = join(import.meta.dir, '..');
    const createRoute = readFileSync(join(root, 'src/app/api/payments/qicard/create/route.ts'), 'utf8');
    const statusRoute = readFileSync(join(root, 'src/app/api/payments/qicard/[orderId]/status/route.ts'), 'utf8');
    const cancelRoute = readFileSync(join(root, 'src/app/api/payments/qicard/[orderId]/cancel/route.ts'), 'utf8');
    const webhookRoute = readFileSync(join(root, 'src/app/api/webhooks/qicard/route.ts'), 'utf8');

    expect(createRoute).toContain('requireUser');
    expect(statusRoute).toContain('requireUser');
    expect(cancelRoute).toContain('requireUser');
    expect(webhookRoute).toContain('processQiCardWebhook');
    expect(webhookRoute).toContain('getQiCardWebhookReadiness');
    expect(webhookRoute).toContain('export async function GET');
    expect(webhookRoute).not.toContain('requireUser');
  });
});

describe('QiCard REST client', () => {
  test('creates a hosted payment with the official headers and server callbacks', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const client = new QiCardClient(resolveQiCardConfig(completeEnv), async (input, init) => {
      requests.push({ url: String(input), init });
      return Response.json(createdPayment);
    });

    const payment = await client.createPayment({
      requestId: createdPayment.requestId,
      amount: 10_000,
      currency: 'IQD',
      locale: 'en_US',
      finishPaymentUrl: 'https://merchant.example/payments/qicard/return?orderId=WAHO-1',
      notificationUrl: 'https://merchant.example/api/webhooks/qicard',
      customerInfo: { phone: '009647800000000' },
      additionalInfo: { orderId: 'WAHO-1' },
    });

    expect(payment).toEqual(createdPayment);
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe('https://uat-sandbox-3ds-api.qi.iq/api/v1/payment');
    expect(new Headers(requests[0]?.init?.headers).get('X-Terminal-Id')).toBe('237984');
    expect(new Headers(requests[0]?.init?.headers).get('Authorization')).toBe(`Basic ${Buffer.from('merchant-user:merchant-password').toString('base64')}`);
    expect(JSON.parse(String(requests[0]?.init?.body))).toMatchObject({
      requestId: createdPayment.requestId,
      amount: 10_000,
      currency: 'IQD',
      appChannel: false,
      additionalInfo: { orderId: 'WAHO-1' },
    });
  });

  test('rejects a checkout URL outside the configured Qi origin', async () => {
    const client = new QiCardClient(resolveQiCardConfig(completeEnv), async () => Response.json({
      ...createdPayment,
      formUrl: 'https://attacker.example/collect-card',
    }));

    await expect(client.createPayment({
      requestId: createdPayment.requestId,
      amount: 10_000,
      currency: 'IQD',
      locale: 'en_US',
      finishPaymentUrl: 'https://merchant.example/payments/qicard/return',
      notificationUrl: 'https://merchant.example/api/webhooks/qicard',
      additionalInfo: { orderId: 'WAHO-1' },
    })).rejects.toThrow('QICARD_RESPONSE_INVALID');
  });

  test('queries status, cancels, and refunds through server-to-server endpoints', async () => {
    const calls: string[] = [];
    const client = new QiCardClient(resolveQiCardConfig(completeEnv), async (input) => {
      calls.push(String(input));
      return Response.json(createdPayment);
    });

    await client.getPaymentStatus(createdPayment.paymentId);
    await client.cancelPayment(createdPayment.paymentId, crypto.randomUUID());
    await client.refundPayment(createdPayment.paymentId, {
      requestId: crypto.randomUUID(),
      amount: 10_000,
      message: 'WAHO top-up could not be fulfilled',
    });

    expect(calls).toEqual([
      `https://uat-sandbox-3ds-api.qi.iq/api/v1/payment/${createdPayment.paymentId}/status`,
      `https://uat-sandbox-3ds-api.qi.iq/api/v1/payment/${createdPayment.paymentId}/cancel`,
      `https://uat-sandbox-3ds-api.qi.iq/api/v1/payment/${createdPayment.paymentId}/refund`,
    ]);
  });
});

describe('QiCard webhook verification and status mapping', () => {
  test('reconstructs the official IQD signing string and verifies RSA-SHA256', () => {
    const payload: QiCardPayment = {
      ...createdPayment,
      status: 'SUCCESS',
      formUrl: undefined,
    };
    const signingString = buildQiCardWebhookSigningString(payload);
    expect(signingString).toBe(`${payload.paymentId}|10000.000|IQD|${payload.creationDate}|SUCCESS`);

    const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const signature = sign('RSA-SHA256', Buffer.from(signingString, 'utf8'), privateKey).toString('base64');
    const pem = publicKey.export({ type: 'spki', format: 'pem' }).toString();

    expect(verifyQiCardWebhookSignature(payload, signature, pem)).toBe(true);
    expect(verifyQiCardWebhookSignature({ ...payload, amount: 10_001 }, signature, pem)).toBe(false);
  });

  test('maps every documented lifecycle status without treating redirects as payment proof', () => {
    for (const status of ['CREATED', 'FORM_SHOWED', 'THREE_DS_METHOD_CALL_REQUIRED', 'AUTHENTICATION_REQUIRED', 'AUTHENTICATION_STARTED', 'AUTHENTICATED', 'INITIALIZED', 'STARTED']) {
      expect(classifyQiCardPayment({ ...createdPayment, status })).toBe('pending');
    }
    expect(classifyQiCardPayment({ ...createdPayment, status: 'SUCCESS' })).toBe('paid');
    for (const status of ['FAILED', 'AUTHENTICATION_FAILED', 'ERROR', 'EXPIRED']) {
      expect(classifyQiCardPayment({ ...createdPayment, status })).toBe('failed');
    }
    expect(classifyQiCardPayment({ ...createdPayment, status: 'CREATED', canceled: true })).toBe('cancelled');
    expect(classifyQiCardPayment({ ...createdPayment, status: 'UNRECOGNIZED' })).toBe('unknown');
  });
});
