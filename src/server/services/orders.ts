import type { PaymentMethod as DbPaymentMethod, User } from '@prisma/client';
import { prisma } from '../prisma';
import { calculateOrderPricing, createOrderId } from '../domain/orders';
import { resolveFakePaymentResult } from '../domain/payments';
import { nextWalletBalance } from '../domain/wallet';
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

export async function createPendingOrder(user: User, input: CreateOrderInput) {
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

  return prisma.order.create({
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
}

interface ConfirmFakePaymentInput {
  orderId: string;
  success: boolean;
}

function canAccessOrder(user: User, orderUserId: string) {
  return user.role === 'ADMIN' || user.id === orderUserId;
}

export async function confirmFakePayment(user: User, input: ConfirmFakePaymentInput) {
  const existing = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!existing) throw new Error('NOT_FOUND');
  if (!canAccessOrder(user, existing.userId)) throw new Error('FORBIDDEN');

  if (existing.paymentStatus === 'COMPLETED') {
    return existing;
  }

  if (!input.success) {
    return prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.create({
        data: {
          orderId: existing.id,
          method: existing.paymentMethod,
          status: 'FAILED',
          amount: existing.finalPrice,
          currency: existing.currency,
          providerRef: `FAKE-FAILED-${existing.id}`,
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
  }

  const wahoProvider = getWahoProvider();
  const providerResult = await wahoProvider.createWahoTopup({
    orderId: existing.id,
    wahoId: existing.gameUserId,
    amount: existing.finalPrice,
    currency: existing.currency,
  });
  const paymentResult = resolveFakePaymentResult(true, providerResult.status);

  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: existing.id } });
    if (!order) throw new Error('NOT_FOUND');
    if (order.paymentStatus === 'COMPLETED') return order;

    if (order.paymentMethod === 'WALLET') {
      const orderUser = await tx.user.findUnique({ where: { id: order.userId } });
      if (!orderUser) throw new Error('NOT_FOUND');

      const balance = nextWalletBalance(orderUser.walletBalance, order.finalPrice);
      await tx.user.update({
        where: { id: orderUser.id },
        data: {
          walletBalance: balance,
          totalSpent: { increment: order.finalPrice },
        },
      });
      await tx.walletTransaction.create({
        data: {
          userId: orderUser.id,
          orderId: order.id,
          type: 'PURCHASE',
          amount: -order.finalPrice,
          currency: order.currency,
          balance,
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

    await tx.paymentAttempt.create({
      data: {
        orderId: order.id,
        method: order.paymentMethod as DbPaymentMethod,
        status: 'COMPLETED',
        amount: order.finalPrice,
        currency: order.currency,
        providerRef: `FAKE-PAID-${order.id}`,
        metadata: { mode: 'fake' },
      },
    });

    await tx.providerRequest.create({
      data: {
        orderId: order.id,
        provider: providerResult.providerId,
        action: 'createWahoTopup',
        status: providerResult.status === 'failed' ? 'FAILED' : 'SUCCESS',
        providerOrderId: providerResult.providerOrderId,
        requestPayload: {
          orderId: order.id,
          wahoId: order.gameUserId,
          amount: order.finalPrice,
          currency: order.currency,
        },
        responsePayload: {
          providerId: providerResult.providerId,
          providerOrderId: providerResult.providerOrderId,
          status: providerResult.status,
        },
      },
    });

    return tx.order.update({
      where: { id: order.id },
      data: {
        status: paymentResult.orderStatus,
        paymentStatus: paymentResult.paymentStatus,
        providerId: providerResult.providerId,
        providerOrderId: providerResult.providerOrderId,
        completedAt: paymentResult.completedAt ? new Date() : undefined,
      },
    });
  });
}
