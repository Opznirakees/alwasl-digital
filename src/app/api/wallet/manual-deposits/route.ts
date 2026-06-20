import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapManualDeposit } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { assertRateLimit } from '@/server/rate-limit';
import { verifySensitiveOtpChallenge } from '@/server/sensitive-otp';
import { createManualDeposit } from '@/server/services/manual-deposits';
import { createManualDepositSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireUser();
    const manualDeposits = await prisma.manualDeposit.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, phone: true } },
        reviewedByAdmin: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return ok({ manualDeposits: manualDeposits.map(mapManualDeposit) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = createManualDepositSchema.parse(await request.json());
    await assertRateLimit(`wallet:manual-deposit:${user.id}`, { limit: 20, windowMs: 15 * 60 * 1000 });
    await verifySensitiveOtpChallenge(user, 'WALLET_TOP_UP', body.otp);

    const manualDeposit = await createManualDeposit(user, {
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      transactionId: body.transactionId,
      note: body.note,
    });

    return ok({ manualDeposit: mapManualDeposit(manualDeposit) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
