import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { Provider, ProviderAccount } from '@prisma/client';
import { prisma } from '@/server/prisma';
import { createIdempotencyFingerprint } from '@/server/idempotency';
import {
  confirmCashPayment,
  confirmWalletPayment,
  createPendingOrder,
} from '@/server/services/orders';

const providerId = 'provider-waho-top-up';
const providerAccountId = 'provider-account-waho-local-mock';
const productSlug = 'waho-top-up';
const testRunId = randomUUID();
const testPhone = `+1555${Date.now().toString().slice(-7)}`;

let providerSnapshot: Provider;
let providerAccountSnapshot: ProviderAccount;
let testUserId: string | undefined;
let testAdminId: string | undefined;

async function removeTestData() {
  if (!testUserId) return;

  const orders = await prisma.order.findMany({
    where: { userId: testUserId },
    select: { id: true },
  });
  const orderIds = orders.map((order) => order.id);

  await prisma.whatsAppNotification.deleteMany({
    where: {
      OR: [
        { userId: testUserId },
        ...(orderIds.length ? [{ orderId: { in: orderIds } }] : []),
      ],
    },
  });
  await prisma.providerRequest.deleteMany({
    where: { orderId: { in: orderIds } },
  });
  await prisma.walletTransaction.deleteMany({
    where: { userId: testUserId },
  });
  await prisma.order.deleteMany({
    where: { userId: testUserId },
  });
  await prisma.user.deleteMany({
    where: { id: testUserId },
  });
  if (testAdminId) {
    await prisma.user.deleteMany({ where: { id: testAdminId } });
  }
}

beforeAll(async () => {
  providerSnapshot = await prisma.provider.findUniqueOrThrow({
    where: { id: providerId },
  });
  providerAccountSnapshot = await prisma.providerAccount.findUniqueOrThrow({
    where: { id: providerAccountId },
  });

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      isActive: true,
      priority: 1,
      supportedProducts: [productSlug],
    },
  });
  await prisma.providerAccount.update({
    where: { id: providerAccountId },
    data: {
      isActive: true,
      fallbackEnabled: true,
      priority: 1,
      balance: 1_000_000,
      reservedBalance: 0,
      minBalance: 0,
      lowBalanceThreshold: 0,
      dailyLimit: null,
      dailyUsed: 0,
      status: 'ONLINE',
      supportedProducts: [productSlug],
    },
  });
});

afterAll(async () => {
  await removeTestData();

  await prisma.providerAccount.update({
    where: { id: providerAccountId },
    data: {
      providerId: providerAccountSnapshot.providerId,
      name: providerAccountSnapshot.name,
      type: providerAccountSnapshot.type,
      apiEndpoint: providerAccountSnapshot.apiEndpoint,
      isActive: providerAccountSnapshot.isActive,
      priority: providerAccountSnapshot.priority,
      fallbackEnabled: providerAccountSnapshot.fallbackEnabled,
      balance: providerAccountSnapshot.balance,
      reservedBalance: providerAccountSnapshot.reservedBalance,
      minBalance: providerAccountSnapshot.minBalance,
      lowBalanceThreshold: providerAccountSnapshot.lowBalanceThreshold,
      currency: providerAccountSnapshot.currency,
      dailyLimit: providerAccountSnapshot.dailyLimit,
      dailyUsed: providerAccountSnapshot.dailyUsed,
      successRate: providerAccountSnapshot.successRate,
      avgResponseTimeMs: providerAccountSnapshot.avgResponseTimeMs,
      status: providerAccountSnapshot.status,
      failureCount: providerAccountSnapshot.failureCount,
      lastHealthCheck: providerAccountSnapshot.lastHealthCheck,
      lastFailureAt: providerAccountSnapshot.lastFailureAt,
      supportedProducts: providerAccountSnapshot.supportedProducts,
      config: providerAccountSnapshot.config ?? undefined,
    },
  });
  await prisma.provider.update({
    where: { id: providerId },
    data: {
      code: providerSnapshot.code,
      name: providerSnapshot.name,
      service: providerSnapshot.service,
      apiEndpoint: providerSnapshot.apiEndpoint,
      isActive: providerSnapshot.isActive,
      priority: providerSnapshot.priority,
      supportedProducts: providerSnapshot.supportedProducts,
    },
  });
  await prisma.$disconnect();
});

describe('wallet order integration', () => {
  test('settles a WAHO wallet order atomically and never debits twice on replay', async () => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { slug: productSlug },
      include: {
        packages: {
          where: { inStock: true },
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });
    const pkg = product.packages[0];
    expect(pkg).toBeDefined();

    const initialBalance = Math.max(pkg.basePrice * 4, 100_000);
    const user = await prisma.user.create({
      data: {
        phone: testPhone,
        name: `Wallet integration ${testRunId.slice(0, 8)}`,
        walletBalance: initialBalance,
        isVerified: true,
      },
    });
    testUserId = user.id;

    const orderKey = `wallet-order-${testRunId}`;
    const orderInput = {
      productSlug,
      packageId: pkg.id,
      wahoId: `TEST_${testRunId.replaceAll('-', '').slice(0, 12)}`,
      paymentMethod: 'wallet' as const,
    };
    const pending = await createPendingOrder(user, orderInput, {
      key: orderKey,
      fingerprint: createIdempotencyFingerprint('orders.create', orderInput),
    });

    const paymentIdempotency = {
      key: orderKey,
      fingerprint: createIdempotencyFingerprint('orders.wallet.confirm', {
        orderId: pending.order.id,
      }),
    };
    const confirmed = await confirmWalletPayment(
      user,
      { orderId: pending.order.id },
      paymentIdempotency
    );
    const replayed = await confirmWalletPayment(
      user,
      { orderId: pending.order.id },
      paymentIdempotency
    );

    expect(confirmed.replayed).toBe(false);
    expect(confirmed.order.status).toBe('PROCESSING');
    expect(confirmed.order.paymentStatus).toBe('COMPLETED');
    expect(replayed.replayed).toBe(true);
    expect(replayed.order.id).toBe(confirmed.order.id);

    const [storedUser, purchaseTransactions, paymentAttempts, providerRequests, retryJobs] =
      await Promise.all([
        prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
        prisma.walletTransaction.findMany({
          where: { orderId: confirmed.order.id, type: 'PURCHASE' },
        }),
        prisma.paymentAttempt.findMany({
          where: { orderId: confirmed.order.id },
        }),
        prisma.providerRequest.findMany({
          where: { orderId: confirmed.order.id },
        }),
        prisma.providerRetryJob.findMany({
          where: { orderId: confirmed.order.id, type: 'STATUS_POLL' },
        }),
      ]);

    expect(storedUser.walletBalance).toBe(initialBalance - confirmed.order.finalPrice);
    expect(storedUser.totalSpent).toBe(confirmed.order.finalPrice);
    expect(purchaseTransactions).toHaveLength(1);
    expect(purchaseTransactions[0]?.amount).toBe(-confirmed.order.finalPrice);
    expect(purchaseTransactions[0]?.balance).toBe(storedUser.walletBalance);
    expect(paymentAttempts).toHaveLength(1);
    expect(paymentAttempts[0]?.status).toBe('COMPLETED');
    expect(paymentAttempts[0]?.providerRef).toBe(`WALLET-PAID-${confirmed.order.id}`);
    expect(providerRequests).toHaveLength(1);
    expect(providerRequests[0]?.status).toBe('SUCCESS');
    expect(retryJobs).toHaveLength(1);
    expect(retryJobs[0]?.status).toBe('PENDING');

    const admin = await prisma.user.create({
      data: {
        phone: `+1556${Date.now().toString().slice(-7)}`,
        name: `Cash admin ${testRunId.slice(0, 8)}`,
        role: 'ADMIN',
        isVerified: true,
      },
    });
    testAdminId = admin.id;
    const cashOrderKey = `cash-order-${testRunId}`;
    const cashOrderInput = {
      productSlug,
      packageId: pkg.id,
      wahoId: `CASH_${testRunId.replaceAll('-', '').slice(0, 12)}`,
      paymentMethod: 'cash' as const,
    };
    const pendingCash = await createPendingOrder(user, cashOrderInput, {
      key: cashOrderKey,
      fingerprint: createIdempotencyFingerprint('orders.create', cashOrderInput),
    });
    expect(pendingCash.order.paymentStatus).toBe('PENDING');
    expect(pendingCash.order.status).toBe('PENDING');

    const cashPaymentIdempotency = {
      key: `cash-payment-${testRunId}`,
      fingerprint: createIdempotencyFingerprint('admin.orders.cash-payment', {
        orderId: pendingCash.order.id,
      }),
    };
    const confirmedCash = await confirmCashPayment(
      admin,
      { orderId: pendingCash.order.id },
      cashPaymentIdempotency
    );
    const replayedCash = await confirmCashPayment(
      admin,
      { orderId: pendingCash.order.id },
      cashPaymentIdempotency
    );

    const [userAfterCash, cashTransactions, cashPaymentAttempts] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
      prisma.walletTransaction.findMany({ where: { orderId: pendingCash.order.id } }),
      prisma.paymentAttempt.findMany({ where: { orderId: pendingCash.order.id } }),
    ]);
    expect(confirmedCash.order.paymentStatus).toBe('COMPLETED');
    expect(confirmedCash.order.status).toBe('PROCESSING');
    expect(replayedCash.replayed).toBe(true);
    expect(userAfterCash.walletBalance).toBe(initialBalance - confirmed.order.finalPrice);
    expect(userAfterCash.totalSpent).toBe(confirmed.order.finalPrice + confirmedCash.order.finalPrice);
    expect(cashTransactions).toHaveLength(0);
    expect(cashPaymentAttempts).toHaveLength(1);
    expect(cashPaymentAttempts[0]?.method).toBe('CASH');
    expect(cashPaymentAttempts[0]?.providerRef).toBe(`CASH-PAID-${confirmedCash.order.id}`);
  });
});
