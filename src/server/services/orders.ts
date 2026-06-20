import { Prisma, type Order, type PaymentMethod as DbPaymentMethod, type User, type UserLevel as DbUserLevel } from '@prisma/client';
import { prisma } from '../prisma';
import { calculateOrderPricing, createOrderId } from '../domain/orders';
import { selectCustomPricingRule } from '../domain/custom-pricing';
import { createRefundReference, resolveProviderFulfillmentResult } from '../domain/payments';
import { assertMatchingIdempotencyFingerprint } from '../idempotency';
import { toDbPaymentMethod } from '../mappers';
import { resolveMembershipForSpend } from '@/lib/membership';
import { type WahoTopupInput } from '../providers/waho';
import {
  createWahoTopupWithFailover,
  getWahoVerificationProvider,
  isWahoProviderFailoverError,
  type WahoProviderAttempt,
} from '../providers/waho-router';
import { scheduleProviderRetryJob } from './provider-retry-jobs';
import {
  notifyPaymentReceivedForOrder,
  notifyTopupFailureForOrder,
  notifyTopupSuccessForOrder,
} from './whatsapp-notifications';
import type { PaymentMethod } from '@/types';

interface CreateOrderInput {
  productSlug: string;
  packageId: string;
  wahoId: string;
  zoneId?: string;
  paymentMethod: PaymentMethod;
}

interface IdempotencyInput {
  key: string;
  fingerprint: string;
}

interface OrderMutationResult {
  order: Order;
  replayed: boolean;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function safeWhatsAppNotification(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.error('Failed to queue WhatsApp notification', error);
  }
}

async function findOrderByIdempotencyKey(userId: string, idempotencyKey: string) {
  return prisma.order.findFirst({
    where: {
      userId,
      idempotencyKey,
    },
  });
}

async function findPaymentAttemptByIdempotencyKey(orderId: string, idempotencyKey: string) {
  return prisma.paymentAttempt.findFirst({
    where: {
      orderId,
      idempotencyKey,
    },
  });
}

function toDbMembershipLevel(level: ReturnType<typeof resolveMembershipForSpend>['level']): DbUserLevel {
  return level.toUpperCase() as DbUserLevel;
}

async function syncMembershipForUser(tx: Prisma.TransactionClient, userId: string) {
  const account = await tx.user.findUnique({
    where: { id: userId },
    select: { walletBalance: true, totalSpent: true },
  });
  if (!account) throw new Error('NOT_FOUND');

  const membership = resolveMembershipForSpend(account.totalSpent);
  await tx.user.update({
    where: { id: userId },
    data: {
      level: toDbMembershipLevel(membership.level),
      discountPercentage: membership.discountPercentage,
    },
  });

  return account;
}

async function replayOrderFromIdempotency(userId: string, idempotency: IdempotencyInput): Promise<OrderMutationResult | null> {
  const existingOrder = await findOrderByIdempotencyKey(userId, idempotency.key);
  if (!existingOrder) return null;

  assertMatchingIdempotencyFingerprint(existingOrder.idempotencyFingerprint, idempotency.fingerprint);
  return { order: existingOrder, replayed: true };
}

async function replayPaymentFromIdempotency(
  orderId: string,
  idempotency: IdempotencyInput
): Promise<OrderMutationResult | null> {
  const existingAttempt = await findPaymentAttemptByIdempotencyKey(orderId, idempotency.key);
  if (!existingAttempt) return null;

  assertMatchingIdempotencyFingerprint(existingAttempt.idempotencyFingerprint, idempotency.fingerprint);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('NOT_FOUND');

  return { order, replayed: true };
}

export async function createPendingOrder(
  user: User,
  input: CreateOrderInput,
  idempotency: IdempotencyInput
): Promise<OrderMutationResult> {
  const existing = await replayOrderFromIdempotency(user.id, idempotency);
  if (existing) return existing;

  const product = await prisma.product.findFirst({
    where: { slug: input.productSlug, isActive: true },
    include: { packages: true },
  });

  if (!product) throw new Error('NOT_FOUND');

  const pkg = product.packages.find((item) => item.id === input.packageId && item.inStock);
  if (!pkg) throw new Error('Top-up amount is unavailable');

  const providerSelection = await getWahoVerificationProvider(input.productSlug);
  const account = await providerSelection.provider.verifyWahoAccount(input.wahoId);
  if (!account.valid) throw new Error('Invalid WAHO account');

  const membership = resolveMembershipForSpend(user.totalSpent);
  const now = new Date();
  const pricingRules = await prisma.customPricingRule.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ productId: null }, { productId: product.id }] },
        { OR: [{ packageId: null }, { packageId: pkg.id }] },
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gt: now } }] },
        {
          OR: [
            { targetType: 'ALL' },
            { targetType: user.accountType },
            { targetType: 'USER', userId: user.id },
          ],
        },
      ],
    },
    orderBy: [{ priority: 'asc' }, { updatedAt: 'desc' }],
  });
  const customPricingRule = selectCustomPricingRule(pricingRules, {
    userId: user.id,
    accountType: user.accountType,
    productId: product.id,
    packageId: pkg.id,
  }, now);
  const pricing = calculateOrderPricing(pkg, {
    discountPercentage: membership.discountPercentage,
    customPricingRule,
  });
  const paymentMethod = toDbPaymentMethod(input.paymentMethod);
  const orderId = createOrderId();
  const pricingSnapshot = {
    basePrice: pkg.basePrice,
    salePrice: pkg.salePrice,
    membershipDiscountPercentage: membership.discountPercentage,
    customPricingRule: customPricingRule ? {
      id: customPricingRule.id,
      targetType: customPricingRule.targetType,
      priceType: customPricingRule.priceType,
      value: customPricingRule.value,
      applyMembershipDiscount: customPricingRule.applyMembershipDiscount,
    } : null,
  };

  try {
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId: user.id,
        productId: product.id,
        packageId: pkg.id,
        gameName: product.name,
        packageName: pkg.name,
        gameUserId: account.wahoId,
        gameUsername: account.username,
        zoneId: input.zoneId || undefined,
        ...pricing,
        customPricingRuleId: pricing.customPricingRuleId,
        pricingSnapshot,
        currency: pkg.currency,
        status: 'PENDING',
        paymentMethod,
        paymentStatus: 'PENDING',
        idempotencyKey: idempotency.key,
        idempotencyFingerprint: idempotency.fingerprint,
        paymentAttempts: {
          create: {
            method: paymentMethod,
            status: 'PENDING',
            amount: pricing.finalPrice,
            currency: pkg.currency,
            metadata: {
              mode: 'pending_payment',
              reason: 'Awaiting payment confirmation before provider fulfillment.',
            },
          },
        },
      },
    });

    return { order, replayed: false };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existingOrder = await replayOrderFromIdempotency(user.id, idempotency);
      if (existingOrder) return existingOrder;
    }

    throw error;
  }
}

interface ConfirmFakePaymentInput {
  orderId: string;
  success: boolean;
}

function canAccessOrder(user: User, orderUserId: string) {
  return user.role === 'ADMIN' || user.id === orderUserId;
}

interface RefundProviderRequestInput {
  provider: string;
  providerAccountId?: string;
  action: string;
  providerOrderId?: string;
  requestPayload?: Prisma.InputJsonValue;
  responsePayload?: Prisma.InputJsonValue;
  error?: string;
}

interface RefundOrderInput {
  reason: string;
  providerRequests?: RefundProviderRequestInput[];
}

function createWahoTopupInput(order: Order): WahoTopupInput {
  return {
    orderId: order.id,
    wahoId: order.gameUserId,
    amount: order.unitPrice,
    paidAmount: order.finalPrice,
    currency: order.currency,
    packageName: order.packageName,
  };
}

function createWahoTopupJson(input: WahoTopupInput): Prisma.InputJsonValue {
  return {
    orderId: input.orderId,
    wahoId: input.wahoId,
    amount: input.amount,
    paidAmount: input.paidAmount ?? null,
    currency: input.currency,
    packageName: input.packageName ?? null,
  };
}

function fallbackProviderAttempt(error: unknown): WahoProviderAttempt {
  return {
    provider: 'waho-provider',
    action: 'createWahoTopup',
    status: 'FAILED',
    error: error instanceof Error ? error.message : 'WAHO_PROVIDER_ERROR',
  };
}

function createProviderRetryPayload(
  order: Order,
  providerInput: WahoTopupInput,
  extra?: Prisma.InputJsonObject
): Prisma.InputJsonValue {
  return {
    productSlug: order.productId,
    providerInput: createWahoTopupJson(providerInput),
    ...extra,
  };
}

async function createProviderRequestLogs(
  tx: Prisma.TransactionClient,
  orderId: string,
  attempts: WahoProviderAttempt[],
  requestPayload: Prisma.InputJsonValue
) {
  for (const attempt of attempts) {
    await tx.providerRequest.create({
      data: {
        orderId,
        providerAccountId: attempt.providerAccountId,
        provider: attempt.provider,
        action: attempt.action,
        status: attempt.status,
        providerOrderId: attempt.providerOrderId,
        requestPayload,
        responsePayload: attempt.responsePayload,
        error: attempt.error,
      },
    });
  }
}

async function scheduleProviderCreateRetry(
  order: Order,
  providerInput: WahoTopupInput,
  attempts: WahoProviderAttempt[],
  requestPayload: Prisma.InputJsonValue
) {
  return prisma.$transaction(async (tx) => {
    await createProviderRequestLogs(tx, order.id, attempts, requestPayload);

    await scheduleProviderRetryJob(tx, {
      orderId: order.id,
      providerAccountId: attempts.find((attempt) => attempt.providerAccountId)?.providerAccountId,
      type: 'CREATE_TOPUP',
      payload: createProviderRetryPayload(order, providerInput),
      lastError: attempts.at(-1)?.error ?? 'WAHO_PROVIDER_RETRY_SCHEDULED',
    });

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: 'PROCESSING',
        paymentStatus: 'COMPLETED',
      },
    });
  });
}

export async function refundPaidOrder(orderId: string, input: RefundOrderInput): Promise<Order> {
  let refundedOrder: Order;

  try {
    refundedOrder = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (!current) throw new Error('NOT_FOUND');

      if (current.status === 'REFUNDED' || current.paymentStatus === 'REFUNDED') {
        return current;
      }

      if (current.paymentStatus !== 'COMPLETED') {
        throw new Error('ORDER_NOT_REFUNDABLE');
      }

      if (input.providerRequests?.length) {
        for (const providerRequest of input.providerRequests) {
          await tx.providerRequest.create({
            data: {
              orderId: current.id,
              providerAccountId: providerRequest.providerAccountId,
              provider: providerRequest.provider,
              action: providerRequest.action,
              status: 'FAILED',
              providerOrderId: providerRequest.providerOrderId,
              requestPayload: providerRequest.requestPayload,
              responsePayload: providerRequest.responsePayload,
              error: providerRequest.error,
            },
          });
        }
      }

      const refundReference = createRefundReference(current.id);
      const existingRefund = await tx.walletTransaction.findFirst({
        where: {
          userId: current.userId,
          reference: refundReference,
          type: 'REFUND',
        },
      });

      if (!existingRefund) {
        const creditResult = await tx.user.updateMany({
          where: {
            id: current.userId,
            totalSpent: { gte: current.finalPrice },
          },
          data: {
            walletBalance: { increment: current.finalPrice },
            totalSpent: { decrement: current.finalPrice },
          },
        });

        if (creditResult.count !== 1) {
          throw new Error('REFUND_LEDGER_CONFLICT');
        }

        const orderUser = await syncMembershipForUser(tx, current.userId);

        await tx.walletTransaction.create({
          data: {
            userId: current.userId,
            orderId: current.id,
            type: 'REFUND',
            amount: current.finalPrice,
            currency: current.currency,
            balance: orderUser.walletBalance,
            description: `Refund: ${current.gameName} ${current.packageName}`,
            descriptionAr: `استرداد: ${current.gameName} ${current.packageName}`,
            reference: refundReference,
          },
        });
      }

      await tx.paymentAttempt.updateMany({
        where: {
          orderId: current.id,
          status: 'COMPLETED',
        },
        data: {
          status: 'REFUNDED',
          metadata: {
            mode: 'refund',
            reason: input.reason,
          },
        },
      });

      return tx.order.update({
        where: { id: current.id },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
          refundedAt: new Date(),
          refundReason: input.reason,
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const current = await prisma.order.findUnique({ where: { id: orderId } });
      if (current?.status === 'REFUNDED' || current?.paymentStatus === 'REFUNDED') {
        refundedOrder = current;
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }

  await safeWhatsAppNotification(() => notifyTopupFailureForOrder(refundedOrder.id, input.reason));
  return refundedOrder;
}

export async function refundOrderById(orderId: string, reason = 'Manual refund'): Promise<Order> {
  return refundPaidOrder(orderId, { reason });
}

export async function confirmFakePayment(
  user: User,
  input: ConfirmFakePaymentInput,
  idempotency: IdempotencyInput
): Promise<OrderMutationResult> {
  const existing = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!existing) throw new Error('NOT_FOUND');
  if (!canAccessOrder(user, existing.userId)) throw new Error('FORBIDDEN');

  const existingAttempt = await replayPaymentFromIdempotency(existing.id, idempotency);
  if (existingAttempt) return existingAttempt;

  if (existing.paymentStatus === 'COMPLETED') {
    return { order: existing, replayed: false };
  }

  if (!input.success) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        await tx.paymentAttempt.create({
          data: {
            orderId: existing.id,
            method: existing.paymentMethod,
            status: 'FAILED',
            amount: existing.finalPrice,
            currency: existing.currency,
            providerRef: `FAKE-FAILED-${existing.id}`,
            idempotencyKey: idempotency.key,
            idempotencyFingerprint: idempotency.fingerprint,
          },
        });

        return tx.order.update({
          where: { id: existing.id },
          data: {
            status: 'FAILED',
            paymentStatus: 'FAILED',
          },
        });
      });

      await safeWhatsAppNotification(() => notifyTopupFailureForOrder(order.id, 'Payment failed'));
      return { order, replayed: false };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const replayed = await replayPaymentFromIdempotency(existing.id, idempotency);
        if (replayed) return replayed;
      }

      throw error;
    }
  }

  let claimed: Order;
  try {
    claimed = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: existing.id } });
      if (!order) throw new Error('NOT_FOUND');

      const attempt = await tx.paymentAttempt.create({
        data: {
          orderId: order.id,
          method: order.paymentMethod,
          status: 'PENDING',
          amount: order.finalPrice,
          currency: order.currency,
          idempotencyKey: idempotency.key,
          idempotencyFingerprint: idempotency.fingerprint,
          metadata: {
            mode: 'fake',
            state: 'reserved',
          },
        },
      });

      if (order.paymentStatus === 'COMPLETED') {
        await tx.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'COMPLETED',
            providerRef: `FAKE-PAID-${order.id}`,
            metadata: { mode: 'fake', state: 'replayed_completed_order' },
          },
        });
        return order;
      }

      const claim = await tx.order.updateMany({
        where: {
          id: order.id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
        data: { status: 'PROCESSING' },
      });

      if (claim.count !== 1) {
        const current = await tx.order.findUnique({ where: { id: order.id } });
        if (!current) throw new Error('NOT_FOUND');
        await tx.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: current.paymentStatus,
            metadata: { mode: 'fake', state: 'order_not_claimed' },
          },
        });
        return current;
      }

      if (order.paymentMethod === 'WALLET') {
        const debitResult = await tx.user.updateMany({
          where: {
            id: order.userId,
            walletBalance: { gte: order.finalPrice },
          },
          data: {
            walletBalance: { decrement: order.finalPrice },
            totalSpent: { increment: order.finalPrice },
          },
        });

        if (debitResult.count !== 1) {
          throw new Error('INSUFFICIENT_WALLET_BALANCE');
        }

        const orderUser = await syncMembershipForUser(tx, order.userId);

        await tx.walletTransaction.create({
          data: {
            userId: order.userId,
            orderId: order.id,
            type: 'PURCHASE',
            amount: -order.finalPrice,
            currency: order.currency,
            balance: orderUser.walletBalance,
            description: `Purchase: ${order.gameName} ${order.packageName}`,
            descriptionAr: `شراء: ${order.gameName} ${order.packageName}`,
            reference: order.id,
          },
        });
      } else {
        await tx.user.update({
          where: { id: order.userId },
          data: { totalSpent: { increment: order.finalPrice } },
        });
        await syncMembershipForUser(tx, order.userId);
      }

      await tx.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          method: order.paymentMethod as DbPaymentMethod,
          status: 'COMPLETED',
          providerRef: `FAKE-PAID-${order.id}`,
          metadata: { mode: 'fake', state: 'paid' },
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'COMPLETED' },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const replayed = await replayPaymentFromIdempotency(existing.id, idempotency);
      if (replayed) return replayed;
    }

    throw error;
  }

  await safeWhatsAppNotification(() => notifyPaymentReceivedForOrder(claimed.id));

  if (claimed.status !== 'PROCESSING' || claimed.paymentStatus !== 'COMPLETED') {
    return { order: claimed, replayed: false };
  }

  const providerInput = createWahoTopupInput(claimed);
  const providerRequestPayload = createWahoTopupJson(providerInput);
  let fulfillment;

  try {
    fulfillment = await createWahoTopupWithFailover(providerInput, {
      productSlug: claimed.productId,
    });
  } catch (error) {
    const attempts = isWahoProviderFailoverError(error) && error.attempts.length
      ? error.attempts
      : [fallbackProviderAttempt(error)];
    const order = await scheduleProviderCreateRetry(claimed, providerInput, attempts, providerRequestPayload);

    return { order, replayed: false };
  }

  const providerResult = fulfillment.result;
  const paymentResult = resolveProviderFulfillmentResult(providerResult.status);

  if (paymentResult.shouldRefund) {
    const attempts = fulfillment.attempts.length
      ? fulfillment.attempts
      : [
          {
            provider: providerResult.providerId,
            providerAccountId: fulfillment.account?.id,
            action: 'createWahoTopup' as const,
            status: 'FAILED' as const,
            providerOrderId: providerResult.providerOrderId,
            responsePayload: {
              providerId: providerResult.providerId,
              providerOrderId: providerResult.providerOrderId,
              status: providerResult.status,
            },
            error: 'WAHO_PROVIDER_FAILED',
          },
        ];
    const order = await scheduleProviderCreateRetry(claimed, providerInput, attempts, providerRequestPayload);

    return { order, replayed: false };
  }

  const order = await prisma.$transaction(async (tx) => {
    await createProviderRequestLogs(tx, claimed.id, fulfillment.attempts, providerRequestPayload);

    if (providerResult.status === 'processing') {
      await scheduleProviderRetryJob(tx, {
        orderId: claimed.id,
        providerAccountId: fulfillment.account?.id,
        type: 'STATUS_POLL',
        payload: createProviderRetryPayload(claimed, providerInput, {
          providerId: providerResult.providerId,
          providerOrderId: providerResult.providerOrderId,
        }),
        lastError: 'Provider status is still processing',
      });
    }

    return tx.order.update({
      where: { id: claimed.id },
      data: {
        status: paymentResult.orderStatus,
        paymentStatus: paymentResult.paymentStatus,
        providerId: providerResult.providerId,
        providerOrderId: providerResult.providerOrderId,
        completedAt: paymentResult.completedAt ? new Date() : undefined,
      },
    });
  });

  if (order.status === 'COMPLETED') {
    await safeWhatsAppNotification(() => notifyTopupSuccessForOrder(order.id));
  }

  return { order, replayed: false };
}
