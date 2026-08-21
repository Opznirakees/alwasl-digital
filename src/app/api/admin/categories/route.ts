import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCatalogCategory } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { createAdminCategorySchema } from '@/server/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const admin = await requirePermission('PRODUCT_MANAGE');
    const body = createAdminCategorySchema.parse(await request.json().catch(() => ({})));
    const existing = await prisma.catalogCategory.findFirst({
      where: { OR: [{ id: body.slug }, { slug: body.slug }] },
      select: { id: true },
    });
    if (existing) throw new Error('CATEGORY_EXISTS');

    const category = await prisma.catalogCategory.create({
      data: { id: body.slug, ...body },
      include: { _count: { select: { products: true } } },
    });
    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.category.create',
      entityType: 'catalog_category',
      entityId: category.id,
      metadata: { slug: category.slug, isActive: category.isActive },
    });

    return ok({ category: mapCatalogCategory(category) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
