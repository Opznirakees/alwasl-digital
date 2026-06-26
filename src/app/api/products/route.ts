import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

function normalizeCountryId(country: string | null) {
  const value = country?.trim().toLowerCase();
  return value || undefined;
}

const publicProductInclude = {
  packages: {
    where: { inStock: true },
    orderBy: { sortOrder: 'asc' as const },
  },
};

const publicProductOrderBy = [{ isFeatured: 'desc' as const }, { createdAt: 'asc' as const }];

export async function GET(request: NextRequest) {
  try {
    const countryId = normalizeCountryId(request.nextUrl.searchParams.get('country'));
    let products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(countryId ? { countries: { has: countryId } } : {}),
      },
      include: publicProductInclude,
      orderBy: publicProductOrderBy,
    });

    if (countryId && products.length === 0) {
      products = await prisma.product.findMany({
        where: { isActive: true },
        include: publicProductInclude,
        orderBy: publicProductOrderBy,
      });
    }

    return ok({ products: products.map(mapProduct) }, { headers: noStoreHeaders });
  } catch (error) {
    return handleApiError(error);
  }
}
