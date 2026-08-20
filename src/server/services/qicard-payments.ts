import { createHash, randomUUID } from 'node:crypto';
import { Prisma, type Order, type User } from '@prisma/client';
import { prisma } from '../prisma';
import {
  QiCardClient,
  classifyQiCardPayment,
  createQiCardClient,
  parseQiCardPaymentPayload,
  resolveQiCardConfig,
  verifyQiCardWebhookSignature,
  type QiCardPayment,
  type QiCardRefund,
} from '../payments/qicard';
import { fulfillPaidOrder, syncMembershipForUser } from './orders';
import { notifyPaymentReceivedForOrder, notifyTopupFailureForOrder } from './whatsapp-notifications';

type QiCardGateway = Pick<
  QiCardClient,
  | 'createPayment'
  | 'getPaymentStatus'
  | 'getPaymentStatusByRequest'
  | 'getPaymentFormUrl'
  | 'cancelPayment'
  | 'refundPayment'
>;

interface QiCardDependencies {
  client?: QiCardGateway;
  env?: Record<string, string | undefined>;
}

interface CreateCheckoutInput {
  orderId: string;
  locale?: string;
}

interface ProcessWebhookInput {
  rawBody: string;
  signature: string | null;
  terminalId: string | null;
}

const MAX_WEBHOOK_BODY_BYTES = 64 * 1024;

function resolveDependencies(dependencies: QiCardDependencies = {}) {
  const env = dependencies.env ?? process.env;
  const config = resolveQiCardConfig(env);
  return {
    config,
    client: dependencies.client ?? createQiCardClient(env),
  };
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function safeLocale(locale: string | undefined) {
  if (locale === 'ar_IQ' || locale === 'en_US') return locale;
  return 'en_US';
}

function assertOrderOwner(user: User, order: Pick<Order, 'userId'>) {
  if (order.userId !== user.id) throw new Error('FORBIDDEN');
}

function assertMatchingPayment(
  attempt: { providerRef: string | null; providerRequestId: string | null; amount: number; currency: string },
  payment: QiCardPayment,
) {
  if (attempt.providerRef && attempt.providerRef !== payment.paymentId) {
    throw new Error('QICARD_PAYMENT_MISMATCH');
  }
  if (attempt.providerRequestId && attempt.providerRequestId !== payment.requestId) {
    throw new Error('QICARD_PAYMENT_MISMATCH');
  }
  if (attempt.amount !== payment.amount || attempt.currency !== payment.currency) {
    throw new Error('QICARD_PAYMENT_MISMATCH');
  }
}

async function safeNotification(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.error('Failed to queue QiCard payment notification', error);
  }
}

async function loadQiCardOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      paymentAttempts: {
        where: { method: 'QICARD' },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!order) throw new Error('NOT_FOUND');
  if (order.paymentMethod !== 'QICARD') throw new Error('PAYMENT_METHOD_UNAVAILABLE');

  const attempt = order.paymentAttempts[0];
  if (!attempt) throw new Error('QICARD_PAYMENT_ATTEMPT_MISSING');
  return { order, attempt };
}

export async function createQiCardCheckout(
  user: User,
  input: CreateCheckoutInput,
  dependencies: QiCardDependencies = {},
) {
  const { client, config } = resolveDependencies(dependencies);
  let { order, attempt } = await loadQiCardOrder(input.orderId);
  assertOrderOwner(user, order);

  if (order.paymentStatus !== 'PENDING' || attempt.status !== 'PENDING') {
    throw new Error('QICARD_PAYMENT_NOT_PENDING');
  }
  if (attempt.providerRef && attempt.checkoutUrl) {
    return {
      order,
      checkoutUrl: attempt.checkoutUrl,
      environment: config.environment,
      replayed: true,
    };
  }

  if (!attempt.providerRequestId) {
    const providerRequestId = randomUUID();
    await prisma.paymentAttempt.updateMany({
      where: {
        id: attempt.id,
        status: 'PENDING',
        providerRequestId: null,
      },
      data: {
        providerRequestId,
        providerStatus: 'CREATING',
        providerUpdatedAt: new Date(),
        metadata: { gateway: 'qicard', state: 'creating_checkout' },
      },
    });
    ({ order, attempt } = await loadQiCardOrder(input.orderId));
  }

  const requestId = attempt.providerRequestId;
  if (!requestId) throw new Error('QICARD_PAYMENT_ATTEMPT_MISSING');

  let payment: QiCardPayment;
  try {
    payment = await client.createPayment({
      requestId,
      amount: attempt.amount,
      currency: attempt.currency,
      locale: safeLocale(input.locale),
      finishPaymentUrl: `${config.appBaseUrl}/payments/qicard/return?orderId=${encodeURIComponent(order.id)}`,
      notificationUrl: `${config.appBaseUrl}/api/webhooks/qicard`,
      customerInfo: {
        phone: order.user.phone,
        accountId: order.user.id,
      },
      additionalInfo: {
        orderId: order.id,
        wahoId: order.gameUserId,
      },
    });
  } catch (error) {
    // A response can be lost after Qi created the payment. Resolve the stable
    // merchant request ID before attempting another charge.
    try {
      payment = await client.getPaymentStatusByRequest(requestId);
    } catch {
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          providerStatus: 'CREATE_FAILED',
          providerUpdatedAt: new Date(),
          metadata: { gateway: 'qicard', state: 'create_failed' },
        },
      });
      throw error;
    }
  }

  assertMatchingPayment(attempt, payment);
  const checkoutUrl = payment.formUrl || client.getPaymentFormUrl(payment.paymentId);
  attempt = await prisma.paymentAttempt.update({
    where: { id: attempt.id },
    data: {
      providerRef: payment.paymentId,
      providerStatus: payment.status,
      checkoutUrl,
      providerUpdatedAt: new Date(),
      metadata: {
        gateway: 'qicard',
        state: 'checkout_created',
        environment: config.environment,
      },
    },
  });

  return {
    order,
    checkoutUrl: attempt.checkoutUrl as string,
    environment: config.environment,
    replayed: false,
  };
}

async function reconcileQiCardPayment(payment: QiCardPayment) {
  const attempt = await prisma.paymentAttempt.findFirst({
    where: {
      method: 'QICARD',
      OR: [
        { providerRef: payment.paymentId },
        { providerRequestId: payment.requestId },
      ],
    },
    include: { order: true },
  });
  if (!attempt) throw new Error('QICARD_PAYMENT_NOT_FOUND');
  assertMatchingPayment(attempt, payment);

  const classification = classifyQiCardPayment(payment);
  const result = await prisma.$transaction(async (tx) => {
    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        providerRef: payment.paymentId,
        providerStatus: payment.status,
        providerUpdatedAt: new Date(),
      },
    });

    if (classification === 'pending' || classification === 'unknown') {
      const order = await tx.order.findUniqueOrThrow({ where: { id: attempt.orderId } });
      return { order, newlyPaid: false, failed: false };
    }

    if (classification === 'failed' || classification === 'cancelled') {
      const failed = await tx.order.updateMany({
        where: {
          id: attempt.orderId,
          paymentStatus: 'PENDING',
        },
        data: {
          status: classification === 'cancelled' ? 'CANCELLED' : 'FAILED',
          paymentStatus: 'FAILED',
        },
      });
      await tx.paymentAttempt.updateMany({
        where: { id: attempt.id, status: 'PENDING' },
        data: { status: 'FAILED' },
      });
      const order = await tx.order.findUniqueOrThrow({ where: { id: attempt.orderId } });
      return { order, newlyPaid: false, failed: failed.count === 1 };
    }

    const claim = await tx.order.updateMany({
      where: {
        id: attempt.orderId,
        paymentStatus: { in: ['PENDING', 'FAILED'] },
        status: { in: ['PENDING', 'FAILED'] },
      },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'COMPLETED',
      },
    });

    if (claim.count === 1) {
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'COMPLETED',
          metadata: { gateway: 'qicard', state: 'paid' },
        },
      });
      await tx.user.update({
        where: { id: attempt.order.userId },
        data: { totalSpent: { increment: attempt.amount } },
      });
      await syncMembershipForUser(tx, attempt.order.userId);
    }

    const order = await tx.order.findUniqueOrThrow({ where: { id: attempt.orderId } });
    return { order, newlyPaid: claim.count === 1, failed: false };
  });

  if (result.newlyPaid) {
    await safeNotification(() => notifyPaymentReceivedForOrder(result.order.id));
    return (await fulfillPaidOrder(result.order.id)).order;
  }
  if (result.failed) {
    await safeNotification(() => notifyTopupFailureForOrder(result.order.id, 'Payment failed'));
  }
  return result.order;
}

export async function refreshQiCardOrder(
  user: User,
  orderId: string,
  dependencies: QiCardDependencies = {},
) {
  const { client } = resolveDependencies(dependencies);
  const { order, attempt } = await loadQiCardOrder(orderId);
  assertOrderOwner(user, order);
  if (!attempt.providerRef) return order;

  const payment = await client.getPaymentStatus(attempt.providerRef);
  return reconcileQiCardPayment(payment);
}

export async function cancelQiCardOrder(
  user: User,
  orderId: string,
  dependencies: QiCardDependencies = {},
) {
  const { client } = resolveDependencies(dependencies);
  const { order, attempt } = await loadQiCardOrder(orderId);
  assertOrderOwner(user, order);
  if (order.paymentStatus !== 'PENDING' || !attempt.providerRef) {
    throw new Error('QICARD_PAYMENT_NOT_PENDING');
  }

  const payment = await client.cancelPayment(attempt.providerRef, randomUUID());
  return reconcileQiCardPayment(payment);
}

export async function processQiCardWebhook(
  input: ProcessWebhookInput,
  dependencies: QiCardDependencies = {},
) {
  if (Buffer.byteLength(input.rawBody, 'utf8') > MAX_WEBHOOK_BODY_BYTES) {
    throw new Error('QICARD_WEBHOOK_TOO_LARGE');
  }
  const { client, config } = resolveDependencies(dependencies);
  if (!config.webhookPublicKey) throw new Error('QICARD_WEBHOOK_NOT_CONFIGURED');
  if (!input.terminalId || input.terminalId !== config.terminalId) {
    throw new Error('QICARD_WEBHOOK_TERMINAL_INVALID');
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(input.rawBody);
  } catch {
    throw new Error('QICARD_RESPONSE_INVALID');
  }
  const payment = parseQiCardPaymentPayload(parsedBody);
  const payloadHash = sha256(input.rawBody);
  const signatureHash = sha256(input.signature || 'missing');
  const signatureValid = verifyQiCardWebhookSignature(payment, input.signature, config.webhookPublicKey);
  const eventKey = sha256(
    `QICARD:${payment.paymentId}:${payment.creationDate}:${payment.status}:${payloadHash}:${signatureValid ? 'valid' : 'invalid'}`,
  );
  const attempt = await prisma.paymentAttempt.findFirst({
    where: {
      method: 'QICARD',
      OR: [{ providerRef: payment.paymentId }, { providerRequestId: payment.requestId }],
    },
    select: { id: true },
  });

  const event = await prisma.paymentWebhookEvent.upsert({
    where: { eventKey },
    update: {},
    create: {
      eventKey,
      providerPaymentId: payment.paymentId,
      providerStatus: payment.status,
      payloadHash,
      signatureHash,
      signatureValid,
      processingStatus: signatureValid ? 'RECEIVED' : 'REJECTED',
      paymentAttemptId: attempt?.id,
      error: signatureValid ? undefined : 'QICARD_WEBHOOK_SIGNATURE_INVALID',
      processedAt: signatureValid ? undefined : new Date(),
    },
  });

  if (!signatureValid || !event.signatureValid) {
    throw new Error('QICARD_WEBHOOK_SIGNATURE_INVALID');
  }
  if (event.processingStatus === 'PROCESSED') {
    return { replayed: true };
  }

  try {
    // The webhook announces a state change; the authenticated Qi API remains
    // the source of truth before any order is fulfilled.
    const authoritativePayment = await client.getPaymentStatus(payment.paymentId);
    assertMatchingPayment({
      providerRef: payment.paymentId,
      providerRequestId: payment.requestId,
      amount: payment.amount,
      currency: payment.currency,
    }, authoritativePayment);
    const order = await reconcileQiCardPayment(authoritativePayment);
    await prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: {
        providerStatus: authoritativePayment.status,
        processingStatus: 'PROCESSED',
        processedAt: new Date(),
        error: null,
      },
    });
    return { order, replayed: false };
  } catch (error) {
    await prisma.paymentWebhookEvent.update({
      where: { id: event.id },
      data: {
        processingStatus: 'FAILED',
        processedAt: new Date(),
        error: error instanceof Error ? error.message.slice(0, 160) : 'QICARD_WEBHOOK_PROCESSING_FAILED',
      },
    });
    throw error;
  }
}

function isQiCardRefund(refund: QiCardRefund | QiCardPayment): refund is QiCardRefund {
  return 'refundId' in refund && typeof refund.refundId === 'string';
}

function isSuccessfulRefund(refund: QiCardRefund | QiCardPayment) {
  if (isQiCardRefund(refund)) {
    return refund.status === 'SUCCESS' || refund.successful === true;
  }
  return false;
}

export async function refundQiCardOrder(
  orderId: string,
  reason: string,
  dependencies: QiCardDependencies = {},
): Promise<Order> {
  const { client } = resolveDependencies(dependencies);
  const { order, attempt } = await loadQiCardOrder(orderId);
  if (order.status === 'REFUNDED' || order.paymentStatus === 'REFUNDED') return order;
  if (order.paymentStatus !== 'COMPLETED' || attempt.status !== 'COMPLETED' || !attempt.providerRef) {
    throw new Error('ORDER_NOT_REFUNDABLE');
  }

  let refund = await prisma.paymentRefund.findFirst({
    where: { orderId, status: { in: ['PENDING', 'PROCESSING', 'COMPLETED'] } },
    orderBy: { createdAt: 'desc' },
  });
  if (refund?.status === 'COMPLETED') {
    return prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  }
  if (!refund) {
    refund = await prisma.paymentRefund.create({
      data: {
        orderId,
        paymentAttemptId: attempt.id,
        requestId: randomUUID(),
        amount: order.finalPrice,
        currency: order.currency,
        status: 'PENDING',
        reason,
      },
    });
  }

  const providerRefund = await client.refundPayment(attempt.providerRef, {
    requestId: refund.requestId,
    amount: refund.amount,
    message: refund.reason,
  });

  if (!isSuccessfulRefund(providerRefund)) {
    await prisma.paymentRefund.update({
      where: { id: refund.id },
      data: {
        status: 'PROCESSING',
        providerRefundId: isQiCardRefund(providerRefund) ? providerRefund.refundId : undefined,
        metadata: { gateway: 'qicard', providerStatus: providerRefund.status },
      },
    });
    throw new Error('QICARD_REFUND_PENDING');
  }

  const refundedOrder = await prisma.$transaction(async (tx) => {
    const claim = await tx.paymentRefund.updateMany({
      where: { id: refund.id, status: { in: ['PENDING', 'PROCESSING'] } },
      data: {
        status: 'COMPLETED',
        providerRefundId: isQiCardRefund(providerRefund) ? providerRefund.refundId : undefined,
        completedAt: new Date(),
        metadata: { gateway: 'qicard', providerStatus: providerRefund.status },
      },
    });
    if (claim.count === 1) {
      const spendUpdate = await tx.user.updateMany({
        where: { id: order.userId, totalSpent: { gte: order.finalPrice } },
        data: { totalSpent: { decrement: order.finalPrice } },
      });
      if (spendUpdate.count !== 1) throw new Error('REFUND_LEDGER_CONFLICT');
      await syncMembershipForUser(tx, order.userId);
      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: 'REFUNDED' },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundReason: reason,
        },
      });
    }
    return tx.order.findUniqueOrThrow({ where: { id: order.id } });
  });

  await safeNotification(() => notifyTopupFailureForOrder(refundedOrder.id, reason));
  return refundedOrder;
}
