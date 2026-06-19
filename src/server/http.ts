import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

const publicErrors: Record<string, { message: string; status: number }> = {
  UNAUTHENTICATED: { message: 'Authentication required', status: 401 },
  FORBIDDEN: { message: 'Forbidden', status: 403 },
  NOT_FOUND: { message: 'Not found', status: 404 },
  RATE_LIMITED: { message: 'Too many requests', status: 429 },
  INSUFFICIENT_WALLET_BALANCE: { message: 'Insufficient wallet balance', status: 402 },
  PAYMENT_PROVIDER_NOT_CONFIGURED: { message: 'Payment is temporarily unavailable', status: 424 },
  WAHO_PROVIDER_NOT_CONFIGURED: { message: 'WAHO verification is temporarily unavailable', status: 424 },
  'Failed to deliver OTP': { message: 'Verification delivery is temporarily unavailable', status: 424 },
  'OTP provider is not configured': { message: 'Verification delivery is temporarily unavailable', status: 424 },
  'Top-up amount is unavailable': { message: 'Top-up amount is unavailable', status: 400 },
  'Invalid WAHO account': { message: 'Invalid WAHO account', status: 400 },
  'Wallet debit amount must be positive': { message: 'Invalid wallet debit amount', status: 400 },
};

function logUnexpectedApiError(error: unknown) {
  console.error('Unexpected API error', error);
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const details = process.env.NODE_ENV === 'production' ? undefined : error.flatten();
    return fail('Invalid request payload', 422, details);
  }

  if (error instanceof Error) {
    const publicError = publicErrors[error.message];
    if (publicError) return fail(publicError.message, publicError.status);

    logUnexpectedApiError(error);
    return fail('Unexpected server error', 500);
  }

  logUnexpectedApiError(error);
  return fail('Unexpected server error', 500);
}
