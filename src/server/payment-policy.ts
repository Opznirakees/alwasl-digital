import type { PaymentMethod } from '@/types';
import { isQiCardCheckoutEnabled } from './payments/qicard';

interface PaymentEnv extends Record<string, string | undefined> {
  NODE_ENV?: string;
  ENABLE_FAKE_PAYMENTS?: string;
}

export function isFakePaymentEnabled(env: PaymentEnv = process.env) {
  return env.NODE_ENV !== 'production' && env.ENABLE_FAKE_PAYMENTS === 'true';
}

export function assertFakePaymentEndpointEnabled(env: PaymentEnv = process.env) {
  if (!isFakePaymentEnabled(env)) {
    throw new Error('NOT_FOUND');
  }
}

export function isOrderPaymentMethodEnabled(method: PaymentMethod, env: PaymentEnv = process.env) {
  if (method === 'wallet') return true;
  if (method === 'qicard') return isQiCardCheckoutEnabled(env);
  return isFakePaymentEnabled(env);
}

export function assertOrderPaymentMethodEnabled(method: PaymentMethod, env: PaymentEnv = process.env) {
  if (!isOrderPaymentMethodEnabled(method, env)) {
    throw new Error('PAYMENT_METHOD_UNAVAILABLE');
  }
}
