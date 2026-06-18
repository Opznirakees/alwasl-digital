import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { packages: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
    });

    return ok({ products: products.map(mapProduct) });
  } catch (error) {
    return handleApiError(error);
  }
}
