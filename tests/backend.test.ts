import { describe, expect, test } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shouldLoadAdminSummary } from '../src/app/admin/admin-access';
import { getPromotionState } from '../src/app/promotions/promotion-state';
import { walletTopUpDialogCopy } from '../src/app/wallet/wallet-dialog-copy';
import { mobileMenuSheetCopy } from '../src/components/layout/mobile-menu-copy';
import { resolveOtpPhone } from '../src/contexts/auth-flow';
import { banners, games } from '../src/data/mock-data';
import { wahoRechargeInfo } from '../src/data/waho-recharge-info';
import { hashOtp, safeCompare } from '../src/server/crypto';
import { isBlockedProductionDemoOtp, isDemoAuthEnabled, resolveDemoOtpForPhone } from '../src/server/demo-auth';
import { calculateOrderPricing, createOrderId } from '../src/server/domain/orders';
import { resolveFakePaymentResult } from '../src/server/domain/payments';
import { nextWalletBalance } from '../src/server/domain/wallet';
import { handleApiError } from '../src/server/http';
import { mapUser } from '../src/server/mappers';
import { isOtpAttemptLocked, nextOtpAttemptCount } from '../src/server/otp-policy';
import { isFakePaymentEnabled } from '../src/server/payment-policy';
import { getWahoProvider, getWahoProviderInfo, isMockWahoEnabled } from '../src/server/providers/waho';
import { isRateLimitExceeded } from '../src/server/rate-limit';
import { normalizePhone } from '../src/server/validation';
import type { User } from '../src/types';

describe('auth helpers', () => {
  test('normalizes phone numbers and hashes OTP codes predictably', () => {
    const phone = normalizePhone('964 781 234 5678');
    const hash = hashOtp(phone, '123456');

    expect(phone).toBe('+9647812345678');
    expect(safeCompare(hash, hashOtp(phone, '123456'))).toBe(true);
    expect(safeCompare(hash, hashOtp(phone, '654321'))).toBe(false);
  });
});

describe('API error boundaries', () => {
  test('does not expose unexpected internal error messages to clients', async () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      const response = handleApiError(new Error('database password leaked in stack trace'));
      const payload = await response.json();

      expect(response.status).toBe(500);
      expect(payload).toEqual({ error: 'Unexpected server error' });
    } finally {
      console.error = originalConsoleError;
    }
  });

  test('maps provider configuration failures to safe public messages', async () => {
    const wahoResponse = handleApiError(new Error('WAHO_PROVIDER_NOT_CONFIGURED'));
    const paymentResponse = handleApiError(new Error('PAYMENT_PROVIDER_NOT_CONFIGURED'));

    expect(wahoResponse.status).toBe(424);
    expect(await wahoResponse.json()).toEqual({ error: 'WAHO verification is temporarily unavailable' });
    expect(paymentResponse.status).toBe(424);
    expect(await paymentResponse.json()).toEqual({ error: 'Payment is temporarily unavailable' });
  });

  test('does not return raw error.message in the shared API error handler', () => {
    const repoRoot = join(import.meta.dir, '..');
    const source = readFileSync(join(repoRoot, 'src/server/http.ts'), 'utf8');

    expect(source).not.toContain('fail(error.message');
  });
});

describe('order creation rules', () => {
  test('calculates package totals with member discount', () => {
    const pricing = calculateOrderPricing(
      { basePrice: 10000, salePrice: null },
      { discountPercentage: 5 }
    );

    expect(pricing).toEqual({
      quantity: 1,
      unitPrice: 10000,
      totalPrice: 10000,
      discount: 500,
      finalPrice: 9500,
    });
  });

  test('creates deterministic order ids when clock and random source are fixed', () => {
    expect(createOrderId(new Date('2026-06-18T10:00:00Z'), 0.1234)).toBe('ORD-20260618-2110');
  });
});

describe('fake payment rules', () => {
  test('never enables fake payment mutation APIs in production', () => {
    expect(isFakePaymentEnabled({ NODE_ENV: 'production', ENABLE_FAKE_PAYMENTS: 'true' })).toBe(false);
    expect(isFakePaymentEnabled({ NODE_ENV: 'production', ENABLE_FAKE_PAYMENTS: 'false' })).toBe(false);
  });

  test('enables fake payment mutation APIs only when explicitly configured outside production', () => {
    expect(isFakePaymentEnabled({ NODE_ENV: 'development', ENABLE_FAKE_PAYMENTS: 'true' })).toBe(true);
    expect(isFakePaymentEnabled({ NODE_ENV: 'development', ENABLE_FAKE_PAYMENTS: 'false' })).toBe(false);
    expect(isFakePaymentEnabled({ NODE_ENV: 'test' })).toBe(false);
  });

  test('marks successful completed provider responses as completed', () => {
    expect(resolveFakePaymentResult(true, 'completed')).toEqual({
      paymentStatus: 'COMPLETED',
      orderStatus: 'COMPLETED',
      completedAt: true,
    });
  });

  test('keeps successful processing provider responses in processing state', () => {
    expect(resolveFakePaymentResult(true, 'processing')).toEqual({
      paymentStatus: 'COMPLETED',
      orderStatus: 'PROCESSING',
      completedAt: false,
    });
  });

  test('marks failed fake payments as failed', () => {
    expect(resolveFakePaymentResult(false, 'completed')).toEqual({
      paymentStatus: 'FAILED',
      orderStatus: 'FAILED',
      completedAt: false,
    });
  });
});

describe('wallet ledger rules', () => {
  test('debits wallet balances only when funds are available', () => {
    expect(nextWalletBalance(250000, 9500)).toBe(240500);
    expect(() => nextWalletBalance(1000, 5000)).toThrow('INSUFFICIENT_WALLET_BALANCE');
  });

  test('wallet top-up API does not directly mutate app balance without a real payment provider', () => {
    const repoRoot = join(import.meta.dir, '..');
    const source = readFileSync(join(repoRoot, 'src/app/api/wallet/top-up/route.ts'), 'utf8');

    expect(source).toContain('PAYMENT_PROVIDER_NOT_CONFIGURED');
    expect(source).not.toContain('walletBalance +');
    expect(source).not.toContain('walletTransaction.create');
    expect(source).not.toContain('tx.user.update');
    expect(source).not.toContain('mapWalletTransaction');
    expect(source).not.toContain('mapUser');
    expect(source).not.toContain('prisma');
  });

  test('wallet order purchases use a database-level conditional debit', () => {
    const repoRoot = join(import.meta.dir, '..');
    const source = readFileSync(join(repoRoot, 'src/server/services/orders.ts'), 'utf8');

    expect(source).toContain('tx.order.updateMany');
    expect(source).toContain("status: 'PENDING'");
    expect(source).toContain("paymentStatus: 'PENDING'");
    expect(source).toContain('tx.user.updateMany');
    expect(source).toContain('walletBalance: { gte: order.finalPrice }');
    expect(source).toContain('walletBalance: { decrement: order.finalPrice }');
    expect(source).toContain('debitResult.count !== 1');
    expect(source).not.toContain('nextWalletBalance(orderUser.walletBalance');
  });
});

describe('WAHO provider rules', () => {
  test('never enables mock WAHO in production, even when env is misconfigured', async () => {
    const env = {
      NODE_ENV: 'production',
      ENABLE_MOCK_WAHO: 'true',
      WAHO_API_BASE_URL: 'https://example.test/waho',
    };

    expect(isMockWahoEnabled(env)).toBe(false);
    expect(getWahoProviderInfo(env)).toMatchObject({
      id: 'waho-api',
      isActive: false,
      status: 'offline',
    });
    await expect(getWahoProvider(env).verifyWahoAccount('123456')).rejects.toThrow('WAHO_PROVIDER_NOT_CONFIGURED');
  });

  test('keeps local mock WAHO explicit and never reports fulfillment as completed', async () => {
    const env = {
      NODE_ENV: 'development',
      ENABLE_MOCK_WAHO: 'true',
    };
    const provider = getWahoProvider(env);

    expect(isMockWahoEnabled(env)).toBe(true);
    await expect(provider.verifyWahoAccount('abc')).resolves.toMatchObject({ valid: false });
    await expect(provider.verifyWahoAccount('waho_1234')).resolves.toMatchObject({ valid: true });
    await expect(provider.createWahoTopup({
      orderId: 'ORD-TEST',
      wahoId: 'waho_1234',
      amount: 10000,
      currency: 'IQD',
    })).resolves.toMatchObject({ status: 'processing' });
    await expect(provider.getWahoTopupStatus('WAHO-MOCK-TEST')).resolves.toBe('processing');
  });
});

describe('promotion display rules', () => {
  test('calculates promotion state with an explicit clock', () => {
    expect(getPromotionState('2026-06-01T00:00:00Z', '2026-08-31T23:59:59Z', new Date('2026-06-18T12:00:00Z'))).toBe('live');
    expect(getPromotionState('2026-07-01T00:00:00Z', '2026-08-31T23:59:59Z', new Date('2026-06-18T12:00:00Z'))).toBe('upcoming');
    expect(getPromotionState('2026-05-01T00:00:00Z', '2026-05-31T23:59:59Z', new Date('2026-06-18T12:00:00Z'))).toBe('expired');
  });
});

describe('admin access rules', () => {
  test('loads admin summary only for admin users', () => {
    const admin = { role: 'admin' } as User;
    const user = { role: 'user' } as User;

    expect(shouldLoadAdminSummary(admin)).toBe(true);
    expect(shouldLoadAdminSummary(user)).toBe(false);
    expect(shouldLoadAdminSummary(null)).toBe(false);
  });
});

describe('auth flow rules', () => {
  test('allows immediate demo OTP verification with an explicit phone override', () => {
    expect(resolveOtpPhone('', '+9647812345678')).toBe('+9647812345678');
    expect(resolveOtpPhone('+964700000001')).toBe('+964700000001');
    expect(resolveOtpPhone('')).toBeNull();
  });
});

describe('auth abuse protection rules', () => {
  test('blocks OTP verification once the attempt limit is reached', () => {
    expect(isOtpAttemptLocked(0)).toBe(false);
    expect(isOtpAttemptLocked(4)).toBe(false);
    expect(nextOtpAttemptCount(4)).toBe(5);
    expect(isOtpAttemptLocked(5)).toBe(true);
  });

  test('treats the persisted rate-limit counter as blocked only after the limit is exceeded', () => {
    expect(isRateLimitExceeded(5, 5)).toBe(false);
    expect(isRateLimitExceeded(6, 5)).toBe(true);
  });
});

describe('server demo auth rules', () => {
  test('never enables demo OTP auth in production, even when env is misconfigured', () => {
    const env = {
      NODE_ENV: 'production',
      ENABLE_DEMO_AUTH: 'true',
      SEED_ADMIN_PHONE: '+9647812345678',
      DEMO_OTP: '123456',
    };

    expect(isDemoAuthEnabled(env)).toBe(false);
    expect(resolveDemoOtpForPhone('+9647812345678', env)).toBeNull();
    expect(isBlockedProductionDemoOtp('+9647812345678', '123456', env)).toBe(true);
    expect(isBlockedProductionDemoOtp('+9647812345678', '999999', { ...env, DEMO_OTP: '999999' })).toBe(true);
    expect(isBlockedProductionDemoOtp('+9647812345678', '123456', { ...env, DEMO_OTP: '999999' })).toBe(true);
    expect(isBlockedProductionDemoOtp('+9647812345678', '654321', env)).toBe(false);
  });

  test('allows demo OTP only when explicitly enabled outside production', () => {
    const env = {
      NODE_ENV: 'development',
      ENABLE_DEMO_AUTH: 'true',
      SEED_ADMIN_PHONE: '+9647812345678',
      DEMO_OTP: '654321',
    };

    expect(isDemoAuthEnabled(env)).toBe(true);
    expect(resolveDemoOtpForPhone('+9647812345678', env)).toBe('654321');
    expect(resolveDemoOtpForPhone('+964700000001', env)).toBeNull();
  });
});

describe('wallet accessibility copy', () => {
  test('provides a description for the wallet top-up dialog', () => {
    expect(walletTopUpDialogCopy.description.en).toContain('wallet balance');
    expect(walletTopUpDialogCopy.description.ar.length).toBeGreaterThan(10);
    expect(walletTopUpDialogCopy.description.zh.length).toBeGreaterThan(5);
  });
});

describe('mobile menu accessibility copy', () => {
  test('provides a description for the mobile navigation sheet', () => {
    expect(mobileMenuSheetCopy.description.en).toContain('navigation');
    expect(mobileMenuSheetCopy.description.ar.length).toBeGreaterThan(10);
    expect(mobileMenuSheetCopy.description.zh.length).toBeGreaterThan(5);
  });
});

describe('WAHO recharge section copy', () => {
  test('keeps the homepage section focused on topping up instead of promoting app features', () => {
    expect(wahoRechargeInfo.title.en).toBe('Before you top up WAHO');
    expect(wahoRechargeInfo.body.en).toContain('only for WAHO account balance');
    expect(wahoRechargeInfo.body.en).toContain('order ID');

    const content = [
      wahoRechargeInfo.title.en,
      wahoRechargeInfo.body.en,
      ...wahoRechargeInfo.cards.flatMap((item) => [item.title.en, item.body.en]),
    ].join(' ');

    expect(content.toLowerCase()).not.toContain('screenshots');
    expect(content.toLowerCase()).not.toContain('live rooms');
    expect(content.toLowerCase()).not.toContain('private chats');
    expect(content.toLowerCase()).not.toContain('virtual gifts');
    expect(content.toLowerCase()).not.toContain('recognize');
    expect(wahoRechargeInfo.cards.map((item) => item.title.en)).toEqual([
      '1. WAHO ID',
      '2. IQD amount',
      '3. Payment',
      '4. Order ID',
    ]);
  });
});

describe('WAHO storefront visual assets', () => {
  test('uses recharge and brand assets instead of app feature screenshots', () => {
    const wahoProduct = games.find((game) => game.slug === 'waho-top-up');
    expect(wahoProduct?.image).toBe('/brand/alwasl-mark.jpg');
    expect(wahoProduct?.banner).toBe('/brand/alwasl-banner.jpg');

    const storefrontImages = [
      wahoProduct?.image,
      wahoProduct?.banner,
      ...banners.filter((banner) => banner.gameId === 'waho-top-up').map((banner) => banner.image),
    ].filter(Boolean);

    expect(storefrontImages.length).toBeGreaterThan(0);
    expect(storefrontImages.every((image) => image?.startsWith('/brand/'))).toBe(true);
    expect(storefrontImages.some((image) => image?.startsWith('/waho/'))).toBe(false);
  });
});

describe('customer-facing copy quality', () => {
  test('keeps public pages free from internal demo and placeholder language', () => {
    const repoRoot = join(import.meta.dir, '..');
    const customerFacingFiles = [
      'src/app/about/page.tsx',
      'src/app/contact/page.tsx',
      'src/app/faq/page.tsx',
      'src/app/privacy/page.tsx',
      'src/app/terms/page.tsx',
      'src/app/promotions/page.tsx',
      'src/app/page.tsx',
      'src/app/top-up/[slug]/page.tsx',
      'src/app/auth/page.tsx',
      'src/app/wallet/page.tsx',
      'src/app/wallet/wallet-dialog-copy.ts',
    ];
    const bannedPatterns = [
      /\/api\/payments\/fake\/confirm/i,
      /fake payment/i,
      /current release/i,
      /demo-ready/i,
      /placeholder policy/i,
      /demo terms/i,
      /sample data/i,
      /simulated flows/i,
      /most demo orders/i,
      /demo support/i,
      /use these demo offers/i,
      /Demo Mode:/i,
      /Use Demo Account/i,
      /Use test account/i,
      /Test account opened/i,
      /OTP 123456/i,
      /ready for a quick WAHO top-up/i,
      /customers who know LEO.*recognize/i,
      /LEO is highlighted/i,
    ];

    for (const file of customerFacingFiles) {
      const source = readFileSync(join(repoRoot, file), 'utf8');
      for (const pattern of bannedPatterns) {
        expect(source, `${file} should not contain ${pattern}`).not.toMatch(pattern);
      }
    }

    expect(existsSync(join(repoRoot, 'src/app/demo/page.tsx'))).toBe(false);
  });
});

describe('mappers', () => {
  test('maps the database role into the frontend user', () => {
    const mapped = mapUser({
      id: 'user-1',
      phone: '+9647812345678',
      name: 'Admin',
      email: null,
      avatar: null,
      role: 'ADMIN',
      level: 'GOLD',
      walletBalance: 250000,
      totalSpent: 0,
      isVerified: true,
      discountPercentage: 5,
      registeredAt: new Date('2026-06-18T10:00:00Z'),
      lastLogin: new Date('2026-06-18T11:00:00Z'),
    });

    expect(mapped.role).toBe('admin');
  });
});
