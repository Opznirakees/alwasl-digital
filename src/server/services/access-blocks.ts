import type { AccessBlockType, Prisma, User } from '@prisma/client';
import {
  getClientIpFromHeaders,
  isAccessBlockActive,
  maskAccessBlockValue,
  normalizeAccessBlockValue,
} from '../domain/access-blocks';
import { prisma } from '../prisma';
import {
  notifyAccountBlocked,
  type WhatsAppNotificationOptions,
} from './whatsapp-notifications';

interface AccessCheckInput {
  phone?: string;
  wahoId?: string;
  ipAddress?: string;
}

interface CreateAccessBlockInput {
  type: AccessBlockType;
  value: string;
  reason: string;
  expiresAt?: Date | null;
  notifyByWhatsApp?: boolean;
}

const activeBlockWhere = (now = new Date()): Prisma.AccessBlockWhereInput => ({
  isActive: true,
  revokedAt: null,
  OR: [
    { expiresAt: null },
    { expiresAt: { gt: now } },
  ],
});

async function resolveTargetUser(type: AccessBlockType, normalizedValue: string) {
  if (type === 'WHATSAPP') {
    return prisma.user.findFirst({
      where: {
        phone: { in: [`+${normalizedValue}`, normalizedValue] },
      },
    });
  }

  if (type === 'WAHO_ID') {
    const order = await prisma.order.findFirst({
      where: {
        gameUserId: { equals: normalizedValue, mode: 'insensitive' },
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
    return order?.user ?? null;
  }

  const session = await prisma.session.findFirst({
    where: { ipAddress: normalizedValue },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  return session?.user ?? null;
}

async function syncBlockedUser(user: User | null, blocked: boolean, adminId?: string, reason?: string) {
  if (!user) return;
  if (blocked && user.role !== 'USER') throw new Error('FORBIDDEN');

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: blocked
      ? {
          isBlocked: true,
          blockedReason: reason,
          blockedAt: now,
          blockedByAdminId: adminId,
        }
      : {
          isBlocked: false,
          blockedReason: null,
          blockedAt: null,
          blockedByAdminId: null,
        },
  });

  if (blocked) {
    await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now },
    });
  }
}

async function updateNotificationResult(accessBlockId: string, result: Awaited<ReturnType<typeof notifyAccountBlocked>>) {
  if (!result?.notification) return;

  await prisma.accessBlock.update({
    where: { id: accessBlockId },
    data: {
      notificationStatus: result.notification.status,
      notifiedAt: result.notification.sentAt,
      notificationError: result.notification.error,
    },
  });
}

export async function findActiveAccessBlock(type: AccessBlockType, value: string, now = new Date()) {
  const normalizedValue = normalizeAccessBlockValue(type, value);
  const block = await prisma.accessBlock.findFirst({
    where: {
      type,
      normalizedValue,
      ...activeBlockWhere(now),
    },
  });

  return block && isAccessBlockActive(block, now) ? block : null;
}

export async function assertAccessAllowed(input: AccessCheckInput) {
  const checks: Array<[AccessBlockType, string | undefined]> = [
    ['WHATSAPP', input.phone],
    ['WAHO_ID', input.wahoId],
    ['IP_ADDRESS', input.ipAddress],
  ];

  for (const [type, value] of checks) {
    if (!value) continue;
    const block = await findActiveAccessBlock(type, value);
    if (block) throw new Error('ACCESS_BLOCKED');
  }
}

export async function assertRequestAccessAllowed(headers: Headers, input: Omit<AccessCheckInput, 'ipAddress'> = {}) {
  return assertAccessAllowed({
    ...input,
    ipAddress: getClientIpFromHeaders(headers),
  });
}

export async function createAccessBlock(
  admin: Pick<User, 'id'>,
  input: CreateAccessBlockInput,
  notificationOptions: WhatsAppNotificationOptions = {}
) {
  const normalizedValue = normalizeAccessBlockValue(input.type, input.value);
  const maskedValue = maskAccessBlockValue(input.type, normalizedValue);
  const targetUser = await resolveTargetUser(input.type, normalizedValue);
  if (targetUser && targetUser.role !== 'USER') throw new Error('FORBIDDEN');

  const block = await prisma.accessBlock.upsert({
    where: {
      type_normalizedValue: {
        type: input.type,
        normalizedValue,
      },
    },
    update: {
      maskedValue,
      reason: input.reason.trim(),
      isActive: true,
      expiresAt: input.expiresAt ?? null,
      revokedAt: null,
      revokedByAdminId: null,
      userId: targetUser?.id,
      createdByAdminId: admin.id,
      notificationRequested: input.type === 'WHATSAPP' && input.notifyByWhatsApp === true,
      notificationStatus: input.type === 'WHATSAPP' && input.notifyByWhatsApp ? 'PENDING' : null,
      notifiedAt: null,
      notificationError: null,
    },
    create: {
      type: input.type,
      normalizedValue,
      maskedValue,
      reason: input.reason.trim(),
      expiresAt: input.expiresAt ?? null,
      userId: targetUser?.id,
      createdByAdminId: admin.id,
      notificationRequested: input.type === 'WHATSAPP' && input.notifyByWhatsApp === true,
      notificationStatus: input.type === 'WHATSAPP' && input.notifyByWhatsApp ? 'PENDING' : null,
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      createdByAdmin: { select: { id: true, name: true } },
    },
  });

  if (input.type === 'WHATSAPP') {
    await syncBlockedUser(targetUser, true, admin.id, input.reason.trim());
  }

  if (block.notificationRequested) {
    const result = await notifyAccountBlocked(block.id, notificationOptions);
    await updateNotificationResult(block.id, result);
  }

  return prisma.accessBlock.findUniqueOrThrow({
    where: { id: block.id },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      createdByAdmin: { select: { id: true, name: true } },
      revokedByAdmin: { select: { id: true, name: true } },
    },
  });
}

export async function revokeAccessBlock(admin: Pick<User, 'id'>, accessBlockId: string) {
  const existing = await prisma.accessBlock.findUnique({
    where: { id: accessBlockId },
    include: { user: true },
  });
  if (!existing) throw new Error('NOT_FOUND');

  const block = await prisma.accessBlock.update({
    where: { id: accessBlockId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedByAdminId: admin.id,
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      createdByAdmin: { select: { id: true, name: true } },
      revokedByAdmin: { select: { id: true, name: true } },
    },
  });

  if (existing.type === 'WHATSAPP' && existing.user) {
    const anotherBlock = await prisma.accessBlock.findFirst({
      where: {
        userId: existing.user.id,
        type: 'WHATSAPP',
        id: { not: existing.id },
        ...activeBlockWhere(),
      },
      select: { id: true },
    });
    if (!anotherBlock) await syncBlockedUser(existing.user, false);
  }

  return block;
}

export async function resendAccessBlockNotification(accessBlockId: string) {
  const block = await prisma.accessBlock.findUnique({ where: { id: accessBlockId } });
  if (!block) throw new Error('NOT_FOUND');
  if (block.type !== 'WHATSAPP') throw new Error('INVALID_BLOCK_NOTIFICATION');

  await prisma.accessBlock.update({
    where: { id: block.id },
    data: {
      notificationRequested: true,
      notificationStatus: 'PENDING',
      notifiedAt: null,
      notificationError: null,
      updatedAt: new Date(),
    },
  });

  const result = await notifyAccountBlocked(block.id);
  await updateNotificationResult(block.id, result);
  return prisma.accessBlock.findUniqueOrThrow({ where: { id: block.id } });
}

export async function listAccessBlocks() {
  return prisma.accessBlock.findMany({
    include: {
      user: { select: { id: true, name: true, phone: true } },
      createdByAdmin: { select: { id: true, name: true } },
      revokedByAdmin: { select: { id: true, name: true } },
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  });
}
