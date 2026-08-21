import { NextRequest } from 'next/server';
import { requireUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCatalogCategory } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireUser();
    const { slug } = await context.params;
    const countryId = request.nextUrl.searchParams.get('country')?.trim().toLowerCase() || undefined;
    const category = await prisma.catalogCategory.findFirst({
      where: { slug, isActive: true },
      include: {
        products: {
          where: {
            isActive: true,
            ...(countryId ? { countries: { has: countryId } } : {}),
          },
          include: {
            packages: {
              where: { inStock: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!category) throw new Error('NOT_FOUND');
    return ok({ category: mapCatalogCategory(category) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}
