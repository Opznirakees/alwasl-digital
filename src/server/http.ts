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
  ACCESS_BLOCKED: { message: 'Access is unavailable', status: 403 },
  INVALID_BLOCK_VALUE: { message: 'Invalid block value', status: 422 },
  INVALID_BLOCK_NOTIFICATION: { message: 'Notification is not available for this block', status: 422 },
  PRICE_CURRENCY_REQUIRED: { message: 'At least one price currency is required', status: 422 },
  PRIMARY_PRICE_CURRENCY_HIDDEN: { message: 'The primary price currency must remain visible', status: 422 },
  PRIMARY_PRICE_RATE_REQUIRED: { message: 'Set an active exchange rate before using this primary currency', status: 422 },
  CONTENT_PLACEHOLDER_MISMATCH: { message: 'Keep every {{placeholder}} shown in the original text', status: 422 },
  NOT_FOUND: { message: 'Not found', status: 404 },
  RATE_LIMITED: { message: 'Too many requests', status: 429 },
  INSUFFICIENT_WALLET_BALANCE: { message: 'Insufficient wallet balance', status: 402 },
  ORDER_NOT_REFUNDABLE: { message: 'Order is not refundable', status: 409 },
  REFUND_LEDGER_CONFLICT: { message: 'Refund could not be completed safely', status: 409 },
  PAYMENT_METHOD_UNAVAILABLE: { message: 'Payment method is not available', status: 400 },
  CRON_SECRET_NOT_CONFIGURED: { message: 'Scheduled jobs are not configured', status: 424 },
  PAYMENT_PROVIDER_NOT_CONFIGURED: { message: 'Payment is temporarily unavailable', status: 424 },
  QICARD_NOT_CONFIGURED: { message: 'QiCard payment is temporarily unavailable', status: 424 },
  QICARD_CONFIG_INVALID: { message: 'QiCard payment is temporarily unavailable', status: 424 },
  QICARD_REQUEST_TIMEOUT: { message: 'QiCard did not respond in time', status: 504 },
  QICARD_REQUEST_FAILED: { message: 'QiCard payment is temporarily unavailable', status: 502 },
  QICARD_API_ERROR: { message: 'QiCard could not process this request', status: 502 },
  QICARD_RESPONSE_INVALID: { message: 'QiCard returned an invalid response', status: 502 },
  QICARD_PAYMENT_MISMATCH: { message: 'QiCard payment details do not match this order', status: 409 },
  QICARD_PAYMENT_NOT_FOUND: { message: 'QiCard payment was not found', status: 404 },
  QICARD_PAYMENT_ATTEMPT_MISSING: { message: 'QiCard checkout is unavailable for this order', status: 409 },
  QICARD_PAYMENT_NOT_PENDING: { message: 'This QiCard payment is no longer pending', status: 409 },
  QICARD_WEBHOOK_NOT_CONFIGURED: { message: 'QiCard webhook is not configured', status: 424 },
  QICARD_WEBHOOK_TERMINAL_INVALID: { message: 'Invalid QiCard webhook terminal', status: 401 },
  QICARD_WEBHOOK_SIGNATURE_INVALID: { message: 'Invalid QiCard webhook signature', status: 401 },
  QICARD_WEBHOOK_TOO_LARGE: { message: 'QiCard webhook payload is too large', status: 413 },
  QICARD_REFUND_PENDING: { message: 'QiCard refund is still processing', status: 202 },
  WAHO_PROVIDER_NOT_CONFIGURED: { message: 'WAHO verification is temporarily unavailable', status: 424 },
  WAHA_NOT_CONFIGURED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_INVALID_PHONE: { message: 'Fulfillment recipient is invalid', status: 424 },
  WAHA_HEALTH_FAILED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_SESSION_UNHEALTHY: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_RECIPIENT_CHECK_FAILED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_RECIPIENT_NOT_FOUND: { message: 'WAHO fulfillment recipient is unavailable', status: 424 },
  WAHA_SEND_FAILED: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  WAHA_REQUEST_TIMEOUT: { message: 'WAHO fulfillment is temporarily unavailable', status: 424 },
  OTP_SECRET_NOT_CONFIGURED: { message: 'Verification is temporarily unavailable', status: 424 },
  SENSITIVE_OTP_REQUIRED: { message: 'OTP verification is required for this action', status: 428 },
  SENSITIVE_OTP_INVALID: { message: 'Invalid or expired OTP', status: 401 },
  SENSITIVE_OTP_LOCKED: { message: 'Too many OTP attempts', status: 429 },
  IDEMPOTENCY_KEY_REQUIRED: { message: 'Idempotency-Key header is required', status: 400 },
  IDEMPOTENCY_KEY_INVALID: { message: 'Idempotency-Key header is invalid', status: 400 },
  IDEMPOTENCY_KEY_REUSED: { message: 'Idempotency-Key was already used for a different request', status: 409 },
  MANUAL_DEPOSIT_TRANSACTION_ID_EXISTS: { message: 'Transaction ID already exists', status: 409 },
  MANUAL_DEPOSIT_ALREADY_REVIEWED: { message: 'Manual deposit has already been reviewed', status: 409 },
  ORDER_NOT_MANUAL: { message: 'This order is not handled manually', status: 409 },
  ORDER_NOT_READY_FOR_FULFILLMENT: { message: 'This order is not ready for delivery', status: 409 },
  ORDER_ALREADY_FULFILLED: { message: 'This order has already been delivered', status: 409 },
  FULFILLMENT_CODE_REQUIRED: { message: 'A delivery code is required', status: 422 },
  FULFILLMENT_ENCRYPTION_NOT_CONFIGURED: { message: 'Secure delivery is temporarily unavailable', status: 424 },
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
