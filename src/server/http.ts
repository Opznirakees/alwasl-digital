import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { recordUnexpectedApiError } from './services/monitoring';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

const publicErrors: Record<string, { message: string; status: number }> = {
  UNAUTHENTICATED: { message: 'Authentication required', status: 401 },
  FORBIDDEN: { message: 'Forbidden', status: 403 },
  USER_BLOCKED: { message: 'Account is blocked', status: 403 },
  NOT_FOUND: { message: 'Not found', status: 404 },
  RATE_LIMITED: { message: 'Too many requests', status: 429 },
  INSUFFICIENT_WALLET_BALANCE: { message: 'Insufficient wallet balance', status: 402 },
  ORDER_NOT_REFUNDABLE: { message: 'Order is not refundable', status: 409 },
  REFUND_LEDGER_CONFLICT: { message: 'Refund could not be completed safely', status: 409 },
  CRON_SECRET_NOT_CONFIGURED: { message: 'Scheduled jobs are not configured', status: 424 },
  PAYMENT_PROVIDER_NOT_CONFIGURED: { message: 'Payment is temporarily unavailable', status: 424 },
  WAHO_PROVIDER_NOT_CONFIGURED: { message: 'WAHO verification is temporarily unavailable', status: 424 },
  WAHA_NOT_CONFIGURED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_INVALID_PHONE: { message: 'Fulfillment recipient is invalid', status: 424 },
  WAHA_HEALTH_FAILED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_SESSION_UNHEALTHY: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_RECIPIENT_CHECK_FAILED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_RECIPIENT_NOT_FOUND: { message: 'WAHO fulfillment recipient is unavailable', status: 424 },
  WAHA_SEND_FAILED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  OTP_SECRET_NOT_CONFIGURED: { message: 'Verification is temporarily unavailable', status: 424 },
  SENSITIVE_OTP_REQUIRED: { message: 'OTP verification is required for this action', status: 428 },
  SENSITIVE_OTP_INVALID: { message: 'Invalid or expired OTP', status: 401 },
  SENSITIVE_OTP_LOCKED: { message: 'Too many OTP attempts', status: 429 },
  IDEMPOTENCY_KEY_REQUIRED: { message: 'Idempotency-Key header is required', status: 400 },
  IDEMPOTENCY_KEY_INVALID: { message: 'Idempotency-Key header is invalid', status: 400 },
  IDEMPOTENCY_KEY_REUSED: { message: 'Idempotency-Key was already used for a different request', status: 409 },
  MANUAL_DEPOSIT_TRANSACTION_ID_EXISTS: { message: 'Transaction ID already exists', status: 409 },
  MANUAL_DEPOSIT_ALREADY_REVIEWED: { message: 'Manual deposit has already been reviewed', status: 409 },
  TOPUP_PACKAGE_EXISTS: { message: 'Top-up amount already exists', status: 409 },
  PROMOTION_CODE_EXISTS: { message: 'Promotion code already exists', status: 409 },
  PRODUCT_EXISTS: { message: 'Product already exists', status: 409 },
  INVALID_PROMOTION_DATE_RANGE: { message: 'Promotion end date must be after start date', status: 422 },
  INVALID_BANNER_DATE_RANGE: { message: 'Banner end date must be after start date', status: 422 },
  'Failed to deliver OTP': { message: 'Verification delivery is temporarily unavailable', status: 424 },
  'OTP provider is not configured': { message: 'Verification delivery is temporarily unavailable', status: 424 },
  'Top-up amount is unavailable': { message: 'Top-up amount is unavailable', status: 400 },
  'Invalid WAHO account': { message: 'Invalid WAHO account', status: 400 },
  'Wallet debit amount must be positive': { message: 'Invalid wallet debit amount', status: 400 },
};

function logUnexpectedApiError(error: unknown) {
  console.error('Unexpected API error', error);
  recordUnexpectedApiError(error);
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
