import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

function normalizeCountryId(country: string | null) {
  const value = country?.trim().toLowerCase();
  return value || undefined;
}

export async function GET(request: NextRequest) {
  try {
    const countryId = normalizeCountryId(request.nextUrl.searchParams.get('country'));
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(countryId ? { countries: { has: countryId } } : {}),
      },
      include: { packages: { orderBy: { sortOrder: 'asc' } } },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'asc' }],
    });

    return ok({ products: products.map(mapProduct) });
  } catch (error) {
    return handleApiError(error);
  }
}
