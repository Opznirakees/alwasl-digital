import { Prisma, type User } from '@prisma/client';
import { manualDepositLedgerReference, normalizeManualDepositTransactionId } from '../domain/manual-deposits';
import { prisma } from '../prisma';
import { notifyPaymentReceivedForManualDeposit } from './whatsapp-notifications';
import type { PaymentMethod } from '@/types';

const manualDepositInclude = {
  user: { select: { id: true, phone: true } },
  reviewedByAdmin: { select: { id: true, name: true } },
};

interface CreateManualDepositInput {
  amount: number;
  paymentMethod: Exclude<PaymentMethod, 'wallet'>;
  transactionId: string;
  note?: string;
}

interface ReviewManualDepositInput {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
}

function toDbPaymentMethod(method: CreateManualDepositInput['paymentMethod']) {
  const values: Record<CreateManualDepositInput['paymentMethod'], 'ZAINCASH' | 'ASIAHAWALA' | 'CARD' | 'USDT'> = {
    zaincash: 'ZAINCASH',
    asiahawala: 'ASIAHAWALA',
    card: 'CARD',
    usdt: 'USDT',
  };

  return values[method];
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

async function safeWhatsAppNotification(task: () => Promise<unknown>) {
  try {
    await task();
  } catch (error) {
    console.error('Failed to queue WhatsApp notification', error);
  }
}

export async function createManualDeposit(user: User, input: CreateManualDepositInput) {
  const transactionId = normalizeManualDepositTransactionId(input.transactionId);

  try {
    return await prisma.manualDeposit.create({
      data: {
        userId: user.id,
        amount: input.amount,
        currency: 'IQD',
        paymentMethod: toDbPaymentMethod(input.paymentMethod),
        transactionId,
        status: 'PENDING',
        note: input.note?.trim() || undefined,
      },
      include: manualDepositInclude,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new Error('MANUAL_DEPOSIT_TRANSACTION_ID_EXISTS');
    throw error;
  }
}

export async function reviewManualDeposit(admin: User, depositId: string, input: ReviewManualDepositInput) {
  const reviewed = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const claim = await tx.manualDeposit.updateMany({
      where: {
        id: depositId,
        status: 'PENDING',
      },
      data: {
        status: input.status,
        reviewedByAdminId: admin.id,
        reviewedAt: now,
        rejectionReason: input.status === 'REJECTED' ? input.reason?.trim() : null,
      },
    });

    if (claim.count !== 1) {
      const existing = await tx.manualDeposit.findUnique({ where: { id: depositId } });
      if (!existing) throw new Error('NOT_FOUND');
      throw new Error('MANUAL_DEPOSIT_ALREADY_REVIEWED');
    }

    const deposit = await tx.manualDeposit.findUniqueOrThrow({ where: { id: depositId } });

    if (input.status === 'APPROVED') {
      const account = await tx.user.update({
        where: { id: deposit.userId },
        data: {
          walletBalance: { increment: deposit.amount },
        },
        select: { walletBalance: true },
      });

      const walletTransaction = await tx.walletTransaction.create({
        data: {
          userId: deposit.userId,
          type: 'DEPOSIT',
          amount: deposit.amount,
          currency: deposit.currency,
          balance: account.walletBalance,
          description: `Manual deposit approved: ${deposit.transactionId}`,
          descriptionAr: `تم اعتماد إيداع يدوي: ${deposit.transactionId}`,
          reference: manualDepositLedgerReference(deposit.transactionId),
        },
      });

      return tx.manualDeposit.update({
        where: { id: deposit.id },
        data: {
          walletTransactionId: walletTransaction.id,
        },
        include: manualDepositInclude,
      });
    }

    return tx.manualDeposit.findUniqueOrThrow({
      where: { id: deposit.id },
      include: manualDepositInclude,
    });
  });

  if (reviewed.status === 'APPROVED') {
    await safeWhatsAppNotification(() => notifyPaymentReceivedForManualDeposit(reviewed.id));
  }

  return reviewed;
}
