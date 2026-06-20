import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapProduct } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminProductSchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('PRODUCT_MANAGE');
    const body = createAdminProductSchema.parse(await request.json().catch(() => ({})));
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { id: body.slug },
          { slug: body.slug },
        ],
      },
      select: { id: true },
    });
    if (existing) throw new Error('PRODUCT_EXISTS');

    const product = await prisma.product.create({
      data: {
        id: body.slug,
        slug: body.slug,
        name: body.name,
        nameAr: body.nameAr,
        description: body.description,
        descriptionAr: body.descriptionAr,
        image: body.image,
        banner: body.banner || null,
        category: body.category,
        publisher: body.publisher,
        isActive: body.isActive,
        isPopular: body.isPopular,
        isFeatured: body.isFeatured,
        requiresUserId: body.requiresUserId,
        userIdLabel: body.userIdLabel,
        userIdLabelAr: body.userIdLabelAr,
        userIdPlaceholder: body.userIdPlaceholder,
        userIdPlaceholderAr: body.userIdPlaceholderAr,
        zoneIdRequired: body.zoneIdRequired,
        zoneIdLabel: body.zoneIdLabel || null,
        zoneIdLabelAr: body.zoneIdLabelAr || null,
        countries: body.countries,
      },
      include: { packages: { orderBy: { sortOrder: 'asc' } } },
    });

    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.product.create',
      entityType: 'product',
      entityId: product.id,
      metadata: {
        slug: product.slug,
        category: product.category,
        isActive: product.isActive,
      },
    });

    return ok({ product: mapProduct(product) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
