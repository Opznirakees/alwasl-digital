import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: { packages: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!product) throw new Error('NOT_FOUND');
    return ok({ product: mapProduct(product) });
  } catch (error) {
    return handleApiError(error);
  }
}
