import { describe, expect, test } from 'bun:test';
import { hashOtp, safeCompare } from '../src/server/crypto';
import { calculateOrderPricing, createOrderId } from '../src/server/domain/orders';
import { resolveFakePaymentResult } from '../src/server/domain/payments';
import { nextWalletBalance } from '../src/server/domain/wallet';
import { normalizePhone } from '../src/server/validation';

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
