import { generateKeyPairSync, randomUUID, sign } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { Order, PaymentAttempt, User } from '@prisma/client';
import { prisma } from '@/server/prisma';
import { buildQiCardWebhookSigningString, type QiCardPayment, type QiCardRefund } from '@/server/payments/qicard';
import {
  cancelQiCardOrder,
  createQiCardCheckout,
  processQiCardWebhook,
  refreshQiCardOrder,
  refundQiCardOrder,
} from '@/server/services/qicard-payments';

const runId = randomUUID();
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
const env = {
  QICARD_ENABLED: 'true',
  QICARD_BASE_URL: 'https://uat-sandbox-3ds-api.qi.iq/api/v1',
  QICARD_USERNAME: 'integration-user',
  QICARD_PASSWORD: 'integration-password',
  QICARD_TERMINAL_ID: '237984',
  QICARD_WEBHOOK_PUBLIC_KEY: publicKeyPem,
  APP_BASE_URL: 'https://merchant.example',
};

let user: User;
let productId: string;
let packageId: string;
const orderIds: string[] = [];

function paymentFor(attempt: PaymentAttempt, status: string): QiCardPayment {
  return {
    requestId: attempt.providerRequestId || randomUUID(),
    paymentId: attempt.providerRef || randomUUID(),
    status,
    canceled: false,
    amount: attempt.amount,
    currency: attempt.currency,
    creationDate: '2026-08-20T12:00:00Z',
    formUrl: `https://uat-sandbox-3ds-api.qi.iq/api/v1/payment/${attempt.providerRef || 'new'}`,
  };
}

function gateway(payment: QiCardPayment, refund?: QiCardRefund) {
  return {
    createPayment: async () => payment,
    getPaymentStatus: async () => payment,
    getPaymentStatusByRequest: async () => payment,
    getPaymentFormUrl: (paymentId: string) => `${env.QICARD_BASE_URL}/payment/${paymentId}`,
    cancelPayment: async () => ({ ...payment, canceled: true }),
    refundPayment: async () => refund || {
      refundId: randomUUID(),
      requestId: randomUUID(),
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      creationDate: '2026-08-20T12:05:00Z',
      status: 'SUCCESS' as const,
      successful: true,
    },
  };
}

async function createOrder(state: 'pending' | 'paid' = 'pending') {
  const id = `QI-${runId.slice(0, 8)}-${orderIds.length + 1}`;
  orderIds.push(id);
  const amount = 10_000;
  const order = await prisma.order.create({
    data: {
      id,
      userId: user.id,
      productId,
      packageId,
      gameName: 'WAHO',
      packageName: '10,000 IQD',
      gameUserId: `WAHO-${runId.slice(0, 8)}`,
      quantity: 1,
      unitPrice: amount,
      totalPrice: amount,
      discount: 0,
      finalPrice: amount,
      currency: 'IQD',
      status: state === 'paid' ? 'PROCESSING' : 'PENDING',
      paymentMethod: 'QICARD',
      paymentStatus: state === 'paid' ? 'COMPLETED' : 'PENDING',
      paymentAttempts: {
        create: {
          method: 'QICARD',
          status: state === 'paid' ? 'COMPLETED' : 'PENDING',
          amount,
          currency: 'IQD',
          providerRequestId: randomUUID(),
          providerRef: randomUUID(),
          providerStatus: state === 'paid' ? 'SUCCESS' : 'CREATED',
        },
      },
    },
    include: { paymentAttempts: true },
  });
  return { order, attempt: order.paymentAttempts[0]! };
}

beforeAll(async () => {
  const product = await prisma.product.findFirstOrThrow({
    where: { slug: 'waho-top-up' },
    include: { packages: { take: 1, orderBy: { sortOrder: 'asc' } } },
  });
  productId = product.id;
  packageId = product.packages[0]!.id;
  user = await prisma.user.create({
    data: {
      phone: `+1555${Date.now().toString().slice(-7)}`,
      name: `QiCard integration ${runId.slice(0, 8)}`,
      isVerified: true,
    },
  });
});

afterAll(async () => {
  await prisma.paymentWebhookEvent.deleteMany({ where: { paymentAttempt: { orderId: { in: orderIds } } } });
  await prisma.paymentRefund.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.whatsAppNotification.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.providerRetryJob.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.providerRequest.deleteMany({ where: { orderId: { in: orderIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});

describe('QiCard database payment flow', () => {
  test('creates one hosted checkout and replays it without creating a second charge', async () => {
    const { order, attempt } = await createOrder();
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { providerRequestId: null, providerRef: null, checkoutUrl: null },
    });

    let createCalls = 0;
    const requestId = randomUUID();
    const payment = {
      ...paymentFor({ ...attempt, providerRequestId: requestId }, 'CREATED'),
      requestId,
      paymentId: randomUUID(),
    };
    const fakeGateway = {
      ...gateway(payment),
      createPayment: async (input: { requestId: string }) => {
        createCalls += 1;
        return { ...payment, requestId: input.requestId };
      },
    };

    const first = await createQiCardCheckout(user, { orderId: order.id }, { client: fakeGateway, env });
    const replay = await createQiCardCheckout(user, { orderId: order.id }, { client: fakeGateway, env });
    const stored = await prisma.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id } });

    expect(createCalls).toBe(1);
    expect(first.checkoutUrl).toBe(replay.checkoutUrl);
    expect(replay.replayed).toBe(true);
    expect(stored.providerRequestId).toBeTruthy();
    expect(stored.providerRef).toBe(payment.paymentId);
  });

  test('settles an authenticated SUCCESS exactly once across repeated status checks', async () => {
    const { order, attempt } = await createOrder();
    const payment = paymentFor(attempt, 'SUCCESS');
    const fakeGateway = gateway(payment);

    await refreshQiCardOrder(user, order.id, { client: fakeGateway, env });
    await refreshQiCardOrder(user, order.id, { client: fakeGateway, env });

    const [storedUser, storedOrder, storedAttempt] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
      prisma.order.findUniqueOrThrow({ where: { id: order.id } }),
      prisma.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id } }),
    ]);
    expect(storedUser.totalSpent).toBe(order.finalPrice);
    expect(storedOrder.paymentStatus).toBe('COMPLETED');
    expect(storedAttempt.status).toBe('COMPLETED');
  });

  test('cancels a pending QiCard payment without charging or fulfilling the order', async () => {
    const initialSpend = (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).totalSpent;
    const { order, attempt } = await createOrder();
    const payment = paymentFor(attempt, 'CREATED');

    const cancelled = await cancelQiCardOrder(user, order.id, {
      client: gateway(payment),
      env,
    });
    const [storedAttempt, storedUser] = await Promise.all([
      prisma.paymentAttempt.findUniqueOrThrow({ where: { id: attempt.id } }),
      prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    ]);

    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.paymentStatus).toBe('FAILED');
    expect(storedAttempt.status).toBe('FAILED');
    expect(storedUser.totalSpent).toBe(initialSpend);
  });

  test('deduplicates signed webhooks and rejects an invalid signature without settlement', async () => {
    const valid = await createOrder();
    const paid = paymentFor(valid.attempt, 'SUCCESS');
    const rawBody = JSON.stringify(paid);
    const signature = sign('RSA-SHA256', Buffer.from(buildQiCardWebhookSigningString(paid)), privateKey).toString('base64');

    const first = await processQiCardWebhook({ rawBody, signature, terminalId: null }, {
      client: gateway(paid),
      env: { ...env, QICARD_ENABLED: 'false' },
    });
    const replay = await processQiCardWebhook({ rawBody, signature, terminalId: env.QICARD_TERMINAL_ID }, {
      client: gateway(paid),
      env,
    });
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(await prisma.paymentWebhookEvent.count({ where: { paymentAttemptId: valid.attempt.id } })).toBe(1);

    const invalid = await createOrder();
    const invalidPayment = paymentFor(invalid.attempt, 'SUCCESS');
    await expect(processQiCardWebhook({
      rawBody: JSON.stringify(invalidPayment),
      signature: Buffer.from('invalid').toString('base64'),
      terminalId: env.QICARD_TERMINAL_ID,
    }, { client: gateway(invalidPayment), env })).rejects.toThrow('QICARD_WEBHOOK_SIGNATURE_INVALID');
    expect((await prisma.order.findUniqueOrThrow({ where: { id: invalid.order.id } })).paymentStatus).toBe('PENDING');

    const validAfterRejectedSignature = sign(
      'RSA-SHA256',
      Buffer.from(buildQiCardWebhookSigningString(invalidPayment)),
      privateKey,
    ).toString('base64');
    const recovered = await processQiCardWebhook({
      rawBody: JSON.stringify(invalidPayment),
      signature: validAfterRejectedSignature,
      terminalId: env.QICARD_TERMINAL_ID,
    }, { client: gateway(invalidPayment), env });

    expect(recovered.replayed).toBe(false);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: invalid.order.id } })).paymentStatus).toBe('COMPLETED');
    expect(await prisma.paymentWebhookEvent.count({ where: { paymentAttemptId: invalid.attempt.id } })).toBe(2);
  });

  test('acknowledges a signed QiCard onboarding notification without changing an order', async () => {
    const payment = {
      requestId: randomUUID(),
      paymentId: randomUUID(),
      status: 'SUCCESS',
      canceled: false,
      amount: 1_000,
      currency: 'IQD',
      creationDate: '2026-08-30T12:00:00',
    };
    const rawBody = JSON.stringify(payment);
    const signature = sign(
      'RSA-SHA256',
      Buffer.from(buildQiCardWebhookSigningString(payment)),
      privateKey,
    ).toString('base64');

    const result = await processQiCardWebhook({ rawBody, signature, terminalId: null }, {
      client: gateway(payment),
      env: { ...env, QICARD_ENABLED: 'false' },
    });

    expect(result).toEqual({ replayed: false, ignored: true });
    expect(await prisma.paymentWebhookEvent.findFirstOrThrow({
      where: { providerPaymentId: payment.paymentId },
    })).toMatchObject({
      signatureValid: true,
      processingStatus: 'PROCESSED',
      paymentAttemptId: null,
      error: 'QICARD_PAYMENT_NOT_FOUND',
    });
  });

  test('refunds to QiCard without increasing the internal wallet balance', async () => {
    const initialWallet = user.walletBalance;
    const { order, attempt } = await createOrder('paid');
    await prisma.user.update({
      where: { id: user.id },
      data: { totalSpent: { increment: order.finalPrice } },
    });
    const payment = paymentFor(attempt, 'SUCCESS');
    const refund: QiCardRefund = {
      refundId: randomUUID(),
      requestId: randomUUID(),
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      creationDate: '2026-08-20T13:00:00Z',
      status: 'SUCCESS',
      successful: true,
      canceled: false,
    };

    const refunded = await refundQiCardOrder(order.id, 'Provider fulfillment failed', {
      client: gateway(payment, refund),
      env,
    });
    const [storedUser, ledgerCredits, storedRefund] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
      prisma.walletTransaction.count({ where: { orderId: order.id, type: 'REFUND' } }),
      prisma.paymentRefund.findFirstOrThrow({ where: { orderId: order.id } }),
    ]);

    expect(refunded.paymentStatus).toBe('REFUNDED');
    expect(storedRefund.status).toBe('COMPLETED');
    expect(storedUser.walletBalance).toBe(initialWallet);
    expect(ledgerCredits).toBe(0);
  });
});
