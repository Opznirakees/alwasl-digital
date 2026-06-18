import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapUser, mapWalletTransaction } from '@/server/mappers';
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

    return ok({
      user: mapUser(user),
      transactions: transactions.map(mapWalletTransaction),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
