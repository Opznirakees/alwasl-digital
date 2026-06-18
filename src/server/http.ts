import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail('Invalid request payload', 422, error.flatten());
  }

  if (error instanceof Error) {
    if (error.message === 'UNAUTHENTICATED') return fail('Authentication required', 401);
    if (error.message === 'FORBIDDEN') return fail('Forbidden', 403);
    if (error.message === 'NOT_FOUND') return fail('Not found', 404);
    if (error.message === 'RATE_LIMITED') return fail('Too many requests', 429);
    if (error.message === 'INSUFFICIENT_WALLET_BALANCE') return fail('Insufficient wallet balance', 402);

    return fail(error.message, 400);
  }

  return fail('Unexpected server error', 500);
}
