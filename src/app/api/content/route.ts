import { handleApiError, ok } from '@/server/http';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const overrides = await prisma.contentOverride.findMany({
      where: { isActive: true },
      select: {
        key: true,
        valueEn: true,
        valueAr: true,
        valueZh: true,
        isActive: true,
      },
      orderBy: { key: 'asc' },
    });

    return ok({ overrides }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
