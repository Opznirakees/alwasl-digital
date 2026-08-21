import { NextRequest } from 'next/server';
import { getOptionalUser } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapProduct, type ProductWithPackages } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

function normalizeCountryId(country: string | null) {
  const value = country?.trim().toLowerCase();
  return value || undefined;
}

const packageSelection = {
  packages: {
    where: { inStock: true },
    orderBy: { sortOrder: 'asc' as const },
  },
};

const publicProductOrderBy = [{ isFeatured: 'desc' as const }, { createdAt: 'asc' as const }];

export async function GET(request: NextRequest) {
  try {
    const authenticated = Boolean(await getOptionalUser());
    const countryId = normalizeCountryId(request.nextUrl.searchParams.get('country'));
    let products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(countryId ? { countries: { has: countryId } } : {}),
      },
      include: { packages: authenticated ? packageSelection.packages : false },
      orderBy: publicProductOrderBy,
    });

    if (countryId && products.length === 0) {
      products = await prisma.product.findMany({
        where: { isActive: true },
        include: { packages: authenticated ? packageSelection.packages : false },
        orderBy: publicProductOrderBy,
      });
    }

    return ok({
      pricesVisible: authenticated,
      products: products.map((product) => mapProduct({
        ...product,
        packages: 'packages' in product ? product.packages : [],
      } as ProductWithPackages)),
    }, { headers: noStoreHeaders });
  } catch (error) {
    return handleApiError(error);
  }
}
