import { handleApiError, ok } from '@/server/http';
import { mapPromotion } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    });

    return ok({ promotions: promotions.map(mapPromotion) });
  } catch (error) {
    return handleApiError(error);
  }
}
