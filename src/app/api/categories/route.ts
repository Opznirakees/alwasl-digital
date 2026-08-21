import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { mapCatalogCategory } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

export async function GET(request: NextRequest) {
  try {
    const countryId = request.nextUrl.searchParams.get('country')?.trim().toLowerCase() || undefined;
    const categories = await prisma.catalogCategory.findMany({
      where: {
        isActive: true,
        products: {
          some: {
            isActive: true,
            ...(countryId ? { countries: { has: countryId } } : {}),
          },
        },
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                ...(countryId ? { countries: { has: countryId } } : {}),
              },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return ok({ categories: categories.map(mapCatalogCategory) }, { headers: noStoreHeaders });
  } catch (error) {
    return handleApiError(error);
  }
}
