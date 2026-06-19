import { Prisma, type Order, type PaymentMethod as DbPaymentMethod, type User } from '@prisma/client';
import { prisma } from '../prisma';
import { calculateOrderPricing, createOrderId } from '../domain/orders';
import { resolveFakePaymentResult } from '../domain/payments';
import { assertMatchingIdempotencyFingerprint } from '../idempotency';
import { toDbPaymentMethod } from '../mappers';
import { getWahoProvider } from '../providers/waho';
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

  const wahoProvider = getWahoProvider();
  const account = await wahoProvider.verifyWahoAccount(input.wahoId);
  if (!account.valid) throw new Error('Invalid WAHO account');

  const pricing = calculateOrderPricing(pkg, user);
  const paymentMethod = toDbPaymentMethod(input.paymentMethod);
  const orderId = createOrderId();

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

        const orderUser = await tx.user.findUnique({
          where: { id: order.userId },
          select: { walletBalance: true },
        });
        if (!orderUser) throw new Error('NOT_FOUND');

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

  if (claimed.status !== 'PROCESSING' || claimed.paymentStatus !== 'COMPLETED') {
    return { order: claimed, replayed: false };
  }

  const wahoProvider = getWahoProvider();
  const providerResult = await wahoProvider.createWahoTopup({
    orderId: claimed.id,
    wahoId: claimed.gameUserId,
    amount: claimed.finalPrice,
    currency: claimed.currency,
  });
  const paymentResult = resolveFakePaymentResult(true, providerResult.status);

  const order = await prisma.$transaction(async (tx) => {
    await tx.providerRequest.create({
      data: {
        orderId: claimed.id,
        provider: providerResult.providerId,
        action: 'createWahoTopup',
        status: providerResult.status === 'failed' ? 'FAILED' : 'SUCCESS',
        providerOrderId: providerResult.providerOrderId,
        requestPayload: {
          orderId: claimed.id,
          wahoId: claimed.gameUserId,
          amount: claimed.finalPrice,
          currency: claimed.currency,
        },
        responsePayload: {
          providerId: providerResult.providerId,
          providerOrderId: providerResult.providerOrderId,
          status: providerResult.status,
        },
      },
    });

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

  return { order, replayed: false };
}
