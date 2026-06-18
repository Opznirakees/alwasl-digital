import { describe, expect, test } from 'bun:test';
import { shouldLoadAdminSummary } from '../src/app/admin/admin-access';
import { getPromotionState } from '../src/app/promotions/promotion-state';
import { walletTopUpDialogCopy } from '../src/app/wallet/wallet-dialog-copy';
import { mobileMenuSheetCopy } from '../src/components/layout/mobile-menu-copy';
import { resolveOtpPhone } from '../src/contexts/auth-flow';
import { hashOtp, safeCompare } from '../src/server/crypto';
import { calculateOrderPricing, createOrderId } from '../src/server/domain/orders';
import { resolveFakePaymentResult } from '../src/server/domain/payments';
import { nextWalletBalance } from '../src/server/domain/wallet';
import { mapUser } from '../src/server/mappers';
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
