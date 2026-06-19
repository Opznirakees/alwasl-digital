interface PaymentEnv {
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
