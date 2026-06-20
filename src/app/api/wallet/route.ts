import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapManualDeposit, mapUser, mapWalletTransaction } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireUser();
    const transactions = await prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const manualDeposits = await prisma.manualDeposit.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, phone: true } },
        reviewedByAdmin: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return ok({
      user: mapUser(user),
      transactions: transactions.map(mapWalletTransaction),
      manualDeposits: manualDeposits.map(mapManualDeposit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
