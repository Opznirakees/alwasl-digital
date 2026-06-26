import { NextRequest } from 'next/server';
import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStoreHeaders = { 'Cache-Control': 'no-store' };

interface RouteContext {
  params: Promise<{ slug: string }>;
}

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

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const countryId = normalizeCountryId(request.nextUrl.searchParams.get('country'));
    let product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true,
        ...(countryId ? { countries: { has: countryId } } : {}),
      },
      include: publicProductInclude,
    });

    if (!product && countryId) {
      product = await prisma.product.findFirst({
        where: { slug, isActive: true },
        include: publicProductInclude,
      });
    }

    if (!product) throw new Error('NOT_FOUND');
    return ok({ product: mapProduct(product) }, { headers: noStoreHeaders });
  } catch (error) {
    return handleApiError(error);
  }
}
