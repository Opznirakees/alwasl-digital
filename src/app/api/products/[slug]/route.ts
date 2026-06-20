import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

function normalizeCountryId(country: string | null) {
  const value = country?.trim().toLowerCase();
  return value || undefined;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const countryId = normalizeCountryId(request.nextUrl.searchParams.get('country'));
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        ...(countryId ? { countries: { has: countryId } } : {}),
      },
      include: { packages: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!product) throw new Error('NOT_FOUND');
    return ok({ product: mapProduct(product) });
  } catch (error) {
    return handleApiError(error);
  }
}
