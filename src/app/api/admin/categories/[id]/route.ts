import { NextRequest } from 'next/server';
import { recordAdminAuditLog } from '@/server/admin-audit';
import { requirePermission } from '@/server/auth';
import { handleApiError, ok } from '@/server/http';
import { mapCatalogCategory } from '@/server/mappers';
import { prisma } from '@/server/prisma';
import { updateAdminCategorySchema } from '@/server/validation';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requirePermission('PRODUCT_MANAGE');
    const { id } = await context.params;
    const body = updateAdminCategorySchema.parse(await request.json().catch(() => ({})));
    const category = await prisma.catalogCategory.update({
      where: { id },
      data: body,
      include: { _count: { select: { products: true } } },
    });
    await recordAdminAuditLog({
      admin,
      request,
      action: 'admin.category.update',
      entityType: 'catalog_category',
      entityId: category.id,
      metadata: body,
    });

    return ok({ category: mapCatalogCategory(category) });
  } catch (error) {
    return handleApiError(error);
  }
}
