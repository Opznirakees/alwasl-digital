import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { prisma } from '@/server/prisma';
import {
  assertAccessAllowed,
  createAccessBlock,
  revokeAccessBlock,
} from '@/server/services/access-blocks';

const runId = randomUUID().replaceAll('-', '').slice(0, 14);
const adminPhone = `+15551${Date.now().toString().slice(-7)}`;
const customerPhone = `+15552${Date.now().toString().slice(-7)}`;
const wahoId = `WAHO_${runId}`;
const ipAddress = `198.51.100.${Number.parseInt(runId.slice(0, 2), 16) % 200 + 1}`;
const contentKey = `integration.content.${runId}`;

let adminId = '';
let customerId = '';
let customerSessionId = '';
const accessBlockIds: string[] = [];

beforeAll(async () => {
  const admin = await prisma.user.create({
    data: {
      phone: adminPhone,
      name: `Admin controls ${runId}`,
      role: 'ADMIN',
      isVerified: true,
    },
  });
  adminId = admin.id;

  const customer = await prisma.user.create({
    data: {
      phone: customerPhone,
      name: `Blocked customer ${runId}`,
      isVerified: true,
    },
  });
  customerId = customer.id;

  const session = await prisma.session.create({
    data: {
      userId: customer.id,
      tokenHash: `session-${runId}`,
      ipAddress,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  customerSessionId = session.id;
});

afterAll(async () => {
  await prisma.whatsAppNotification.deleteMany({
    where: { accessBlockId: { in: accessBlockIds } },
  });
  await prisma.accessBlock.deleteMany({
    where: { id: { in: accessBlockIds } },
  });
  await prisma.contentOverride.deleteMany({ where: { key: contentKey } });
  await prisma.session.deleteMany({ where: { userId: customerId } });
  await prisma.user.deleteMany({ where: { id: { in: [customerId, adminId] } } });
});

describe('admin controls integration', () => {
  test('blocks and restores a WhatsApp user while revoking active sessions', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });
    const block = await createAccessBlock(admin, {
      type: 'WHATSAPP',
      value: customerPhone,
      reason: 'Integration access review',
      notifyByWhatsApp: false,
    });
    accessBlockIds.push(block.id);

    await expect(assertAccessAllowed({ phone: customerPhone })).rejects.toThrow('ACCESS_BLOCKED');

    const [blockedUser, revokedSession] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: customerId } }),
      prisma.session.findUniqueOrThrow({ where: { id: customerSessionId } }),
    ]);
    expect(blockedUser.isBlocked).toBe(true);
    expect(blockedUser.blockedReason).toBe('Integration access review');
    expect(revokedSession.revokedAt).toBeInstanceOf(Date);

    await revokeAccessBlock(admin, block.id);
    await expect(assertAccessAllowed({ phone: customerPhone })).resolves.toBeUndefined();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: customerId } })).isBlocked).toBe(false);
  });

  test('enforces independent WAHO-ID and IP rules', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });
    const wahoBlock = await createAccessBlock(admin, {
      type: 'WAHO_ID',
      value: wahoId,
      reason: 'Invalid account activity',
    });
    const ipBlock = await createAccessBlock(admin, {
      type: 'IP_ADDRESS',
      value: ipAddress,
      reason: 'Network abuse review',
    });
    accessBlockIds.push(wahoBlock.id, ipBlock.id);

    await expect(assertAccessAllowed({ wahoId })).rejects.toThrow('ACCESS_BLOCKED');
    await expect(assertAccessAllowed({ ipAddress })).rejects.toThrow('ACCESS_BLOCKED');
    expect((await prisma.user.findUniqueOrThrow({ where: { id: customerId } })).isBlocked).toBe(false);

    await revokeAccessBlock(admin, wahoBlock.id);
    await revokeAccessBlock(admin, ipBlock.id);
    await expect(assertAccessAllowed({ wahoId, ipAddress })).resolves.toBeUndefined();
  });

  test('keeps a WhatsApp block active when message delivery fails', async () => {
    const admin = await prisma.user.findUniqueOrThrow({ where: { id: adminId } });
    const blockedPhone = `+15553${Date.now().toString().slice(-7)}`;
    const block = await createAccessBlock(admin, {
      type: 'WHATSAPP',
      value: blockedPhone,
      reason: 'Automated message delivery test',
      notifyByWhatsApp: true,
    }, {
      env: {
        WAHA_BASE_URL: 'https://waha.integration.invalid',
        WAHA_API_KEY: 'integration-only-key',
        WAHA_SESSION: 'default',
      },
      fetcher: async () => new Response(JSON.stringify({ error: 'temporary' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    });
    accessBlockIds.push(block.id);

    expect(block.isActive).toBe(true);
    expect(block.notificationStatus).toBe('FAILED');
    await expect(assertAccessAllowed({ phone: blockedPhone })).rejects.toThrow('ACCESS_BLOCKED');
  });

  test('stores a tri-lingual content override with its admin owner', async () => {
    const override = await prisma.contentOverride.create({
      data: {
        key: contentKey,
        module: 'integration',
        valueEn: 'Choose balance',
        valueAr: 'اختر الرصيد',
        valueZh: '选择余额',
        updatedByAdminId: adminId,
      },
    });

    const stored = await prisma.contentOverride.findUniqueOrThrow({ where: { key: contentKey } });
    expect(stored.id).toBe(override.id);
    expect(stored.valueZh).toBe('选择余额');
    expect(stored.updatedByAdminId).toBe(adminId);
  });
});
