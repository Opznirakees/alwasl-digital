import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import {
  getPublicRequestOrigin,
  getQiCardWebhookReadiness,
  parseQiCardPaymentPayload,
  shouldAcknowledgeQiCardWebhookWhileDisabled,
} from '@/server/payments/qicard';
import { processQiCardWebhook } from '@/server/services/qicard-payments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const readiness = getQiCardWebhookReadiness({
    ...process.env,
    APP_BASE_URL: process.env.APP_BASE_URL || getPublicRequestOrigin(request.url, request.headers),
  });
  return ok(readiness, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 64 * 1024) {
      throw new Error('QICARD_WEBHOOK_TOO_LARGE');
    }
    const rawBody = await request.text();
    if (shouldAcknowledgeQiCardWebhookWhileDisabled()) {
      let payload: unknown;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        throw new Error('QICARD_RESPONSE_INVALID');
      }
      parseQiCardPaymentPayload(payload);
      return ok({ received: true, replayed: false, ignored: true });
    }

    const result = await processQiCardWebhook({
      rawBody,
      signature: request.headers.get('x-signature'),
      terminalId: request.headers.get('x-terminal-id'),
    });
    return ok({
      received: true,
      replayed: result.replayed,
      ...('ignored' in result ? { ignored: result.ignored } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
