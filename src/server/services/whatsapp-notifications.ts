import { randomUUID } from 'node:crypto';
import { Prisma, type User } from '@prisma/client';
import {
  createWhatsAppNotificationDedupeKey,
  createWhatsAppNotificationMessage,
  type WhatsAppNotificationType,
} from '../domain/whatsapp-notifications';
import { prisma } from '../prisma';
import { sendWhatsAppText } from '../providers/waha-whatsapp';

type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

interface WhatsAppNotificationOptions {
  env?: NodeJS.ProcessEnv;
  fetcher?: Fetcher;
}

interface SendWhatsAppNotificationInput {
  type: WhatsAppNotificationType;
  dedupeKey: string;
  phone: string;
  message: string;
  userId?: string;
  orderId?: string;
  manualDepositId?: string;
  createdByAdminId?: string;
  batchId?: string;
  metadata?: Prisma.InputJsonValue;
}

interface MarketingWhatsAppInput {
  message: string;
  target: 'all' | 'customers' | 'distributors' | 'users' | 'phones';
  userIds?: string[];
  phones?: string[];
}

interface MarketingRecipient {
  userId?: string;
  phone: string;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

function maskedPhoneSuffix(phone: string) {
  return phone.replace(/\D/g, '').slice(-4) || 'unknown';
}

function normalizeError(error: unknown) {
  return error instanceof Error ? error.message : 'WAHA_SEND_FAILED';
}

async function findNotificationByDedupeKey(dedupeKey: string) {
  return prisma.whatsAppNotification.findUnique({ where: { dedupeKey } });
}

export async function sendWhatsAppNotification(
  input: SendWhatsAppNotificationInput,
  options: WhatsAppNotificationOptions = {}
) {
  let notification;

  try {
    notification = await prisma.whatsAppNotification.create({
      data: {
        type: input.type,
        status: 'PENDING',
        dedupeKey: input.dedupeKey,
        userId: input.userId,
        orderId: input.orderId,
        manualDepositId: input.manualDepositId,
        createdByAdminId: input.createdByAdminId,
        batchId: input.batchId,
        phone: input.phone,
        message: input.message,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { notification: await findNotificationByDedupeKey(input.dedupeKey), created: false };
    }

    throw error;
  }

  try {
    const result = await sendWhatsAppText(input.phone, input.message, {
      env: options.env,
      fetcher: options.fetcher,
      onFailure: (error) => {
        console.warn('WAHA customer notification failed', {
          type: input.type,
          phoneSuffix: maskedPhoneSuffix(input.phone),
          code: error.message,
        });
      },
    });

    const sent = await prisma.whatsAppNotification.update({
      where: { id: notification.id },
      data: {
        status: 'SENT',
        providerMessageId: result.messageId,
        sentAt: new Date(),
        error: null,
      },
    });

    return { notification: sent, created: true };
  } catch (error) {
    const failed = await prisma.whatsAppNotification.update({
      where: { id: notification.id },
      data: {
        status: 'FAILED',
        error: normalizeError(error),
      },
    });

    return { notification: failed, created: true };
  }
}

export async function notifyPaymentReceivedForOrder(orderId: string, options: WhatsAppNotificationOptions = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { id: true, phone: true, isBlocked: true } } },
  });
  if (!order || order.user.isBlocked) return null;

  return sendWhatsAppNotification({
    type: 'PAYMENT_RECEIVED',
    dedupeKey: createWhatsAppNotificationDedupeKey('PAYMENT_RECEIVED', 'order', order.id),
    userId: order.userId,
    orderId: order.id,
    phone: order.user.phone,
    message: createWhatsAppNotificationMessage({
      type: 'PAYMENT_RECEIVED',
      orderId: order.id,
      amount: order.finalPrice,
      currency: order.currency,
    }),
    metadata: {
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    },
  }, options);
}

export async function notifyPaymentReceivedForManualDeposit(
  manualDepositId: string,
  options: WhatsAppNotificationOptions = {}
) {
  const deposit = await prisma.manualDeposit.findUnique({
    where: { id: manualDepositId },
    include: { user: { select: { id: true, phone: true, isBlocked: true } } },
  });
  if (!deposit || deposit.user.isBlocked || deposit.status !== 'APPROVED') return null;

  return sendWhatsAppNotification({
    type: 'PAYMENT_RECEIVED',
    dedupeKey: createWhatsAppNotificationDedupeKey('PAYMENT_RECEIVED', 'manual-deposit', deposit.id),
    userId: deposit.userId,
    manualDepositId: deposit.id,
    phone: deposit.user.phone,
    message: createWhatsAppNotificationMessage({
      type: 'PAYMENT_RECEIVED',
      amount: deposit.amount,
      currency: deposit.currency,
    }),
    metadata: {
      paymentMethod: deposit.paymentMethod,
      transactionId: deposit.transactionId,
    },
  }, options);
}

export async function notifyTopupSuccessForOrder(orderId: string, options: WhatsAppNotificationOptions = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { id: true, phone: true, isBlocked: true } } },
  });
  if (!order || order.user.isBlocked || order.status !== 'COMPLETED') return null;

  return sendWhatsAppNotification({
    type: 'TOPUP_SUCCESS',
    dedupeKey: createWhatsAppNotificationDedupeKey('TOPUP_SUCCESS', 'order', order.id),
    userId: order.userId,
    orderId: order.id,
    phone: order.user.phone,
    message: createWhatsAppNotificationMessage({
      type: 'TOPUP_SUCCESS',
      orderId: order.id,
      amount: order.unitPrice,
      currency: order.currency,
      wahoId: order.gameUserId,
    }),
    metadata: {
      providerId: order.providerId,
      providerOrderId: order.providerOrderId,
    },
  }, options);
}

export async function notifyTopupFailureForOrder(
  orderId: string,
  reason?: string,
  options: WhatsAppNotificationOptions = {}
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: { select: { id: true, phone: true, isBlocked: true } } },
  });
  if (!order || order.user.isBlocked) return null;

  return sendWhatsAppNotification({
    type: 'TOPUP_FAILURE',
    dedupeKey: createWhatsAppNotificationDedupeKey('TOPUP_FAILURE', 'order', order.id),
    userId: order.userId,
    orderId: order.id,
    phone: order.user.phone,
    message: createWhatsAppNotificationMessage({
      type: 'TOPUP_FAILURE',
      orderId: order.id,
      amount: order.finalPrice,
      currency: order.currency,
      reason: reason ?? order.refundReason ?? order.status,
    }),
    metadata: {
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      reason: reason ?? order.refundReason,
    },
  }, options);
}

async function resolveMarketingRecipients(input: MarketingWhatsAppInput): Promise<MarketingRecipient[]> {
  if (input.target === 'phones') {
    return [...new Set(input.phones ?? [])].map((phone) => ({ phone }));
  }

  const where: Prisma.UserWhereInput = {
    isBlocked: false,
    role: 'USER',
  };

  if (input.target === 'customers') where.accountType = 'CUSTOMER';
  if (input.target === 'distributors') where.accountType = 'DISTRIBUTOR';
  if (input.target === 'users') where.id = { in: input.userIds ?? [] };

  const users = await prisma.user.findMany({
    where,
    select: { id: true, phone: true },
    orderBy: { registeredAt: 'desc' },
    take: 500,
  });

  return users.map((user) => ({ userId: user.id, phone: user.phone }));
}

export async function sendMarketingWhatsAppBatch(
  admin: Pick<User, 'id'>,
  input: MarketingWhatsAppInput,
  options: WhatsAppNotificationOptions = {}
) {
  const batchId = randomUUID();
  const recipients = await resolveMarketingRecipients(input);
  const message = createWhatsAppNotificationMessage({
    type: 'MARKETING',
    marketingMessage: input.message,
  });
  const result = {
    batchId,
    recipients: recipients.length,
    sent: 0,
    failed: 0,
    skipped: 0,
  };

  for (const recipient of recipients) {
    const recipientKey = recipient.userId ?? recipient.phone.replace(/\D/g, '');
    const notification = await sendWhatsAppNotification({
      type: 'MARKETING',
      dedupeKey: createWhatsAppNotificationDedupeKey('MARKETING', 'batch', batchId, recipientKey),
      userId: recipient.userId,
      createdByAdminId: admin.id,
      batchId,
      phone: recipient.phone,
      message,
      metadata: {
        target: input.target,
      },
    }, options);

    if (!notification.created) {
      result.skipped += 1;
    } else if (notification.notification?.status === 'SENT') {
      result.sent += 1;
    } else {
      result.failed += 1;
    }
  }

  return result;
}
