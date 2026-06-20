import { handleApiError, ok } from '@/server/http';
import { mapBanner } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const now = new Date();
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return ok({ banners: banners.map(mapBanner) });
  } catch (error) {
    return handleApiError(error);
  }
}
