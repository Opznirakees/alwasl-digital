import { randomUUID } from 'node:crypto';
import { afterAll, expect, test } from 'bun:test';
import { prisma } from '@/server/prisma';
import { sendWhatsAppNotification } from '@/server/services/whatsapp-notifications';

const dedupeKey = `notification-concurrency-${randomUUID()}`;

afterAll(async () => {
  await prisma.whatsAppNotification.deleteMany({ where: { dedupeKey } });
});

test('concurrent retries claim a failed WhatsApp notification only once', async () => {
  const input = {
    type: 'ORDER_CREATED' as const,
    dedupeKey,
    phone: '+15551234567',
    message: 'Integration test notification',
  };
  await prisma.whatsAppNotification.create({ data: { ...input, status: 'FAILED', error: 'WAHA_SEND_FAILED' } });
  let sends = 0;
  const fetcher = async (url: string | URL | Request) => {
    const path = String(url);
    if (path.endsWith('/api/sendText')) {
      sends += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return Response.json({ id: 'test-message' });
    }
    return Response.json(path.includes('/api/sessions/') ? { status: 'WORKING' } : { numberExists: true });
  };
  await Promise.all(Array.from({ length: 12 }, () => sendWhatsAppNotification(input, {
    env: { WAHA_BASE_URL: 'https://waha.test', WAHA_API_KEY: 'test-only', WAHA_SESSION: 'test-session' },
    fetcher,
  })));
  expect(sends).toBe(1);
  const stored = await prisma.whatsAppNotification.findUniqueOrThrow({ where: { dedupeKey } });
  expect(stored.status).toBe('SENT');
  expect(stored.providerMessageId).toBe('test-message');
});
