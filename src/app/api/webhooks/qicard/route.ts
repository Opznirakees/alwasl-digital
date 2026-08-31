import { NextRequest } from 'next/server';
import { getClientIpFromHeaders } from '@/server/domain/access-blocks';
import { handleApiError, ok } from '@/server/http';
import {
  getPublicRequestOrigin,
  getQiCardWebhookReadiness,
} from '@/server/payments/qicard';
import { assertRateLimit } from '@/server/rate-limit';
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
    const sourceIp = getClientIpFromHeaders(request.headers) ?? 'unknown';
    await assertRateLimit(`webhooks:qicard:${sourceIp}`, {
      limit: 300,
      windowMs: 15 * 60 * 1000,
    });
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (Number.isFinite(contentLength) && contentLength > 64 * 1024) {
      throw new Error('QICARD_WEBHOOK_TOO_LARGE');
    }
    const rawBody = await request.text();
    const result = await processQiCardWebhook({
      rawBody,
      signature: request.headers.get('x-signature'),
      terminalId: request.headers.get('x-terminal-id'),
      sourceIp,
    });
    return ok({
      received: true,
      replayed: result.replayed,
      verified: result.verified,
      ...('ignored' in result ? { ignored: result.ignored } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
