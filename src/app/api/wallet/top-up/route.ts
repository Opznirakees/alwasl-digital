import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapUser, mapWalletTransaction } from '@/server/mappers';
import { assertWalletTopUpPaymentsEnabled } from '@/server/payment-policy';
import { prisma } from '@/server/prisma';
import { assertRateLimit } from '@/server/rate-limit';
import { walletTopUpSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = walletTopUpSchema.parse(await request.json());
    assertWalletTopUpPaymentsEnabled();
    assertRateLimit(`wallet:top-up:${user.id}`, { limit: 20, windowMs: 15 * 60 * 1000 });

    const result = await prisma.$transaction(async (tx) => {
      const nextBalance = user.walletBalance + body.amount;
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { walletBalance: nextBalance },
      });
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          amount: body.amount,
          currency: 'IQD',
          balance: nextBalance,
          description: `Wallet top-up via ${body.paymentMethod}`,
          descriptionAr: `شحن محفظة عبر ${body.paymentMethod}`,
          reference: `WALLET-${Date.now()}`,
        },
      });

      return { user: updatedUser, transaction };
    });

    return ok({
      user: mapUser(result.user),
      transaction: mapWalletTransaction(result.transaction),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
