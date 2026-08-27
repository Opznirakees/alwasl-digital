import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { getPublicRequestOrigin, getQiCardWebhookReadiness } from '@/server/payments/qicard';
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
    const result = await processQiCardWebhook({
      rawBody: await request.text(),
      signature: request.headers.get('x-signature'),
      terminalId: request.headers.get('x-terminal-id'),
    });
    return ok({ received: true, replayed: result.replayed });
  } catch (error) {
    return handleApiError(error);
  }
}
